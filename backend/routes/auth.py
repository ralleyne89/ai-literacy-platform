from flask import Blueprint, request, jsonify, g, current_app
from flask_jwt_extended import create_access_token
from models import db, User
from logging_config import get_logger
from sqlalchemy.exc import DataError, IntegrityError, OperationalError, ProgrammingError
import bcrypt
import re
import json
import os
from werkzeug.security import check_password_hash as check_legacy_password_hash
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from auth_identity import (
    AuthIdentityConflictError,
    MissingIdentityEmailError,
    get_external_auth_identity_from_claims,
    sync_managed_user,
)
from routes import (
    supabase_jwt_required,
    get_supabase_claims,
    get_supabase_claims_for_token,
    get_supabase_identity,
)

auth_bp = Blueprint('auth', __name__)
logger = get_logger(__name__)
MANAGED_PASSWORD_HASH_MARKERS = {'auth0_managed', 'supabase_managed'}

def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    # At least 8 characters, one uppercase, one lowercase, one digit
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    return True


def _is_valid_bcrypt_hash(stored_hash):
    if not isinstance(stored_hash, str) or not stored_hash.strip():
        return False

    encoded_hash = stored_hash.encode('utf-8')
    return (
        encoded_hash.startswith((b'$2a$', b'$2b$', b'$2x$', b'$2y$'))
        and len(encoded_hash) >= 60
    )


def _normalize_password_hash(stored_hash):
    if not isinstance(stored_hash, str):
        return ''
    return stored_hash.strip()


def _is_managed_password_hash(stored_hash):
    return _normalize_password_hash(stored_hash) in MANAGED_PASSWORD_HASH_MARKERS


def _hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def _build_password_hash_status(stored_hash, password):
    """
    Return (is_valid, requires_rebuild).
    """
    normalized_hash = _normalize_password_hash(stored_hash)
    if not normalized_hash:
        return False, False, 'missing_hash'

    if _is_managed_password_hash(normalized_hash):
        return False, False, 'managed_hash'

    if _is_valid_bcrypt_hash(normalized_hash):
        try:
            if bcrypt.checkpw(password.encode('utf-8'), normalized_hash.encode('utf-8')):
                return True, False, None
            return False, False, 'bcrypt_mismatch'
        except ValueError as exc:
            logger.warning('auth_login_invalid_bcrypt_hash', error=str(exc), password_hash='invalid_prefix_or_length')
            return False, False, 'invalid_bcrypt_hash'
        except Exception as exc:
            logger.warning('auth_login_bcrypt_check_failed', error=str(exc))
            return False, False, 'bcrypt_check_failed'

    try:
        if check_legacy_password_hash(normalized_hash, password):
            return True, True, None
        return False, False, 'legacy_mismatch'
    except ValueError as exc:
        logger.warning('auth_login_invalid_legacy_hash', error=str(exc))
        return False, False, 'invalid_legacy_hash'
    except Exception as exc:
        logger.warning('auth_login_legacy_hash_check_error', error=str(exc))
        return False, False, 'legacy_hash_check_error'


def _ensure_user_password_hash_compatibility(user, password):
    is_valid, requires_rebuild, reason = _build_password_hash_status(user.password_hash, password)
    if not is_valid:
        return False, requires_rebuild, reason

    if requires_rebuild:
        user.password_hash = _hash_password(password)
    return True, True, None


def _email_log_context(email):
    if not isinstance(email, str) or '@' not in email:
        return {'email_domain': 'unknown'}

    local_part, domain = email.rsplit('@', 1)
    return {
        'email_domain': domain.lower(),
        'email_local_length': len(local_part),
    }


def _build_user_payload(user):
    return {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'organization': user.organization,
        'subscription_tier': user.subscription_tier,
    }


def _extract_auth0_name(claims):
    user_metadata = claims.get('user_metadata')
    if not isinstance(user_metadata, dict):
        user_metadata = {}

    first_name = (
        claims.get('given_name')
        or user_metadata.get('first_name')
        or claims.get('name')
        or ''
    ).strip()
    last_name = (
        claims.get('family_name')
        or user_metadata.get('last_name')
        or ''
    ).strip()

    if first_name and not last_name and ' ' in claims.get('name', ''):
        name_parts = claims.get('name', '').strip().split()
        first_name = name_parts[0]
        last_name = ' '.join(name_parts[1:])

    return first_name, last_name


def _normalize_auth0_token(data):
    if not isinstance(data, dict):
        return ''

    token = data.get('access_token') or data.get('token')
    if isinstance(token, str):
        return token.strip()

    return ''


def _normalize_auth0_text(value):
    if isinstance(value, str):
        normalized = value.strip()
        if normalized:
            return normalized

    return ''


def _auth0_config_value(key):
    value = None
    try:
        value = current_app.config.get(key)
    except RuntimeError:
        value = None

    if value is None:
        value = os.getenv(key)

    return _normalize_auth0_text(value)


def _normalize_frontend_redirect_uri(override_redirect_uri=''):
    if isinstance(override_redirect_uri, str):
        override = override_redirect_uri.strip()
        if override:
            return override

    configured_redirect_uri = _auth0_config_value('AUTH0_REDIRECT_URI')
    if configured_redirect_uri:
        return configured_redirect_uri

    vite_redirect_uri = _auth0_config_value('VITE_AUTH0_REDIRECT_URI')
    if vite_redirect_uri:
        return vite_redirect_uri

    frontend_url = _auth0_config_value('FRONTEND_URL')
    if frontend_url:
        return f'{frontend_url.rstrip("/")}/auth/callback'

    return ''


def _build_auth0_token_url():
    raw_domain = _auth0_config_value('AUTH0_DOMAIN')
    if not raw_domain:
        return ''

    normalized_domain = raw_domain.rstrip('/')
    if not normalized_domain.startswith(('http://', 'https://')):
        normalized_domain = f'https://{normalized_domain}'

    return f'{normalized_domain}/oauth/token'


def _build_auth0_userinfo_url():
    raw_domain = _auth0_config_value('AUTH0_DOMAIN')
    if not raw_domain:
        return ''

    normalized_domain = raw_domain.rstrip('/')
    if not normalized_domain.startswith(('http://', 'https://')):
        normalized_domain = f'https://{normalized_domain}'

    return f'{normalized_domain}/userinfo'


def _extract_json_error_message(raw_body):
    if not isinstance(raw_body, str):
        return ''

    raw_body = raw_body.strip()
    if not raw_body:
        return ''

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return raw_body

    if not isinstance(payload, dict):
        return raw_body

    for key in ('error_description', 'error'):
        value = payload.get(key)
        if isinstance(value, str):
            value = value.strip()
            if value:
                return value

    return raw_body


def _extract_json_payload(raw_body):
    if not isinstance(raw_body, str):
        return None

    raw_body = raw_body.strip()
    if not raw_body:
        return None

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return None

    return payload if isinstance(payload, dict) else None


def _fetch_auth0_userinfo(access_token):
    userinfo_url = _build_auth0_userinfo_url()
    if not userinfo_url:
        return None, 'Auth0 domain is not configured for userinfo lookup.'

    normalized_token = _normalize_auth0_text(access_token)
    if not normalized_token:
        return None, 'Access token is required for userinfo lookup.'

    request = Request(
        userinfo_url,
        method='GET',
        headers={
            'Accept': 'application/json',
            'Authorization': f'Bearer {normalized_token}',
        },
    )

    try:
        with urlopen(request, timeout=10) as response:
            response_body = response.read().decode('utf-8')
    except HTTPError as error:
        try:
            raw_error = error.read().decode('utf-8', errors='replace')
        except Exception:
            raw_error = ''

        error_message = _extract_json_error_message(raw_error) or str(error)
        return None, f'Auth0 userinfo lookup failed: {error_message}'
    except URLError as error:
        return None, f'Unable to reach Auth0 userinfo endpoint: {error}'
    except Exception as error:
        return None, f'Auth0 userinfo lookup failed: {error}'

    payload = _extract_json_payload(response_body)
    if payload is None:
        return None, 'Auth0 userinfo endpoint returned an invalid response.'

    return payload, ''


def _is_verified_auth0_claims(claims):
    if not isinstance(claims, dict):
        return False

    if not claims.get('iss') or not claims.get('aud'):
        return False

    identity = get_external_auth_identity_from_claims(claims)
    return bool(identity and identity.get('provider') == 'auth0' and identity.get('subject'))


def _merge_auth0_claims(decoded_claims=None, userinfo_claims=None):
    merged = {}

    if isinstance(userinfo_claims, dict):
        merged.update(userinfo_claims)

    if isinstance(decoded_claims, dict):
        for key, value in decoded_claims.items():
            if isinstance(value, dict) and isinstance(merged.get(key), dict):
                merged[key] = {**merged[key], **value}
                continue

            if value not in (None, ''):
                merged[key] = value

    return merged


def _exchange_authorization_code_for_access_token(auth_code, code_verifier, redirect_uri):
    token_url = _build_auth0_token_url()
    if not token_url:
        return '', 'Auth0 domain is not configured for token exchange.'

    client_id = _auth0_config_value('AUTH0_CLIENT_ID')
    if not client_id:
        return '', 'Auth0 client_id is not configured for token exchange.'

    payload = {
        'grant_type': 'authorization_code',
        'client_id': client_id,
        'code': auth_code,
        'code_verifier': code_verifier,
        'redirect_uri': redirect_uri,
    }
    request_kwargs = {
        'method': 'POST',
        'headers': {'Content-Type': 'application/json'},
        'data': json.dumps(payload).encode('utf-8'),
    }
    request = Request(token_url, **request_kwargs)

    try:
        with urlopen(request, timeout=10) as response:
            response_body = response.read().decode('utf-8')
    except HTTPError as error:
        try:
            raw_error = error.read().decode('utf-8', errors='replace')
        except Exception:
            raw_error = ''

        error_message = _extract_json_error_message(raw_error) or str(error)
        return '', f'Auth0 token exchange failed: {error_message}'
    except URLError as error:
        return '', f'Unable to reach Auth0 token endpoint: {error}'
    except Exception as error:
        return '', f'Auth0 token exchange failed: {error}'

    try:
        exchange_payload = json.loads(response_body)
    except json.JSONDecodeError:
        return '', 'Auth0 token endpoint returned an invalid response.'

    auth0_access_token = _normalize_auth0_token(exchange_payload if isinstance(exchange_payload, dict) else {})
    if not auth0_access_token:
        return '', 'Auth0 token exchange did not return an access token.'

    return auth0_access_token, ''
def _auth_preflight_response():
    return '', 204


def _build_registration_error_details(exc):
    details = {
        'type': 'RegistrationError',
        'error_code': 'unknown',
    }

    if exc is None:
        return details

    details['type'] = exc.__class__.__name__

    origin = getattr(exc, 'orig', None)
    if origin is not None:
        details['origin_type'] = origin.__class__.__name__
        details['origin_message'] = str(origin).strip()[:120]
        db_error_code = getattr(origin, 'sqlstate', None) or getattr(origin, 'pgcode', None)
        if db_error_code:
            details['origin_code'] = db_error_code
    else:
        details['origin_type'] = None

    raw_code = getattr(exc, 'code', None)
    if raw_code:
        details['error_code'] = str(raw_code)

    try:
        message = str(exc).strip()
    except Exception:
        return details

    if message:
        details['message'] = message[:200]

    return details


@auth_bp.route('/register', methods=['POST'])
def register():
    email = None
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid request payload'}), 400
        
        # Validate required fields
        required_fields = ['email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            value = data.get(field)
            if not isinstance(value, str) or not value.strip():
                return jsonify({'error': f'{field} is required'}), 400
        
        email = data['email'].strip().lower()
        password = data['password']
        first_name = data['first_name'].strip()
        last_name = data['last_name'].strip()
        role = (data.get('role') or '').strip()
        organization = (data.get('organization') or '').strip()
        
        # Validate email format
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Validate password strength
        if not validate_password(password):
            return jsonify({
                'error': 'Password must be at least 8 characters with uppercase, lowercase, and number'
            }), 400
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({
                'error': 'Email already registered',
                'code': 'EMAIL_ALREADY_REGISTERED',
            }), 409
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create new user
        user = User(
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            role=role if role else None,
            organization=organization if organization else None
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'organization': user.organization,
                'subscription_tier': user.subscription_tier
            }
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        logger.warning(
            'auth_register_integrity_error',
            error=str(getattr(e, 'orig', e)),
            **_email_log_context(email),
        )

        return jsonify({
            'error': 'Email already registered',
            'code': 'EMAIL_ALREADY_REGISTERED',
        }), 409
    except (OperationalError, ProgrammingError) as e:
        db.session.rollback()
        logger.exception(
            'auth_register_schema_or_db_error',
            error=str(getattr(e, 'orig', e)),
            **_email_log_context(email),
        )

        return jsonify({
            'error': 'Registration is temporarily unavailable. Please try again shortly.',
            'code': 'REGISTRATION_BACKEND_UNAVAILABLE',
        }), 503
    except DataError as e:
        db.session.rollback()
        logger.warning(
            'auth_register_invalid_data',
            error=str(getattr(e, 'orig', e)),
            **_email_log_context(email),
        )

        return jsonify({
            'error': 'Registration data is invalid.',
            'code': 'REGISTRATION_INVALID_DATA',
        }), 400
    except (ValueError, TypeError) as e:
        db.session.rollback()
        logger.warning(
            'auth_register_auth_processing_error',
            error=str(e),
            **_email_log_context(email),
        )

        return jsonify({
            'error': 'Registration failed due to invalid authentication data.',
            'code': 'REGISTRATION_AUTH_PROCESSING_ERROR',
        }), 400
    except Exception as e:
        db.session.rollback()
        logger.exception(
            'auth_register_unexpected_error',
            error=str(e),
            **_email_log_context(email),
        )
        details = _build_registration_error_details(e)
        return jsonify({
            'error': 'Registration failed. Please try again.',
            'code': 'REGISTRATION_UNEXPECTED_ERROR',
            'details': details,
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid request payload'}), 400
        
        email = data.get('email')
        password = data.get('password')
        if not isinstance(email, str) or not isinstance(password, str) or not email.strip() or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        email = email.strip().lower()
        
        # Find user
        user = User.query.filter_by(email=email).first()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401

        password_is_valid, did_rebuild, reason = _ensure_user_password_hash_compatibility(user, password)
        if not password_is_valid:
            logger.warning(
                'auth_login_invalid_password_hash',
                email=email,
                user_id=user.id,
                reason=reason,
                legacy_password_hash=(
                    f"{_normalize_password_hash(user.password_hash)[:20]}..."
                    if _normalize_password_hash(user.password_hash)
                    else None
                )
            )
            return jsonify({'error': 'Invalid email or password'}), 401

        if did_rebuild:
            try:
                db.session.commit()
            except Exception as exc:
                db.session.rollback()
                logger.warning(
                    'auth_login_password_rebuild_failed',
                    error=str(exc),
                    email=email,
                )
                return jsonify({
                    'error': 'Login temporarily unavailable. Please try again shortly.',
                    'code': 'LOGIN_PASSWORD_REBUILD_FAILED',
                }), 503
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'organization': user.organization,
                'subscription_tier': user.subscription_tier
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500


@auth_bp.route('/login', methods=['OPTIONS'])
def login_options():
    return _auth_preflight_response()


@auth_bp.route('/exchange', methods=['POST'])
def exchange():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        logger.warning(
            'auth_exchange_invalid_payload',
            request_id=str(request.headers.get('X-Request-ID', '')),
            content_type=request.headers.get('Content-Type', ''),
            raw_payload_type=type(payload).__name__,
        )
        return jsonify({'error': 'Invalid request payload'}), 400

    payload_code = _normalize_auth0_text(payload.get('code'))
    payload_code_verifier = _normalize_auth0_text(payload.get('code_verifier'))
    payload_access_token = _normalize_auth0_token(payload)
    payload_redirect_uri = _normalize_frontend_redirect_uri(payload.get('redirect_uri'))

    logger.info(
        'auth_exchange_request_keys',
        request_id=str(request.headers.get('X-Request-ID', '')),
        has_code=bool(payload_code),
        has_code_verifier=bool(payload_code_verifier),
        has_access_token=bool(payload_access_token),
        has_redirect_uri=bool(payload_redirect_uri),
    )

    auth0_access_token = ''
    auth0_code = payload_code
    if auth0_code:
        auth0_code_verifier = payload_code_verifier
        if not auth0_code_verifier:
            return jsonify({
                'error': 'Code verifier is required for authorization code exchange.',
                'code': 'AUTH0_CODE_VERIFIER_REQUIRED',
            }), 400

        auth0_redirect_uri = payload_redirect_uri
        if not auth0_redirect_uri:
            return jsonify({
                'error': 'Redirect URI is required for authorization code exchange.',
                'code': 'AUTH0_REDIRECT_URI_REQUIRED',
            }), 400

        auth0_access_token, exchange_error = _exchange_authorization_code_for_access_token(
            auth0_code,
            auth0_code_verifier,
            auth0_redirect_uri,
        )
        if not auth0_access_token:
            return jsonify({
                'error': exchange_error or 'Auth0 code exchange failed.',
                'code': 'AUTH0_CODE_EXCHANGE_FAILED',
            }), 400
    else:
        auth0_access_token = payload_access_token

    if not auth0_access_token:
        return jsonify({
            'error': 'Access token is required',
            'code': 'AUTH0_ACCESS_TOKEN_REQUIRED',
        }), 400

    decoded_claims = None
    try:
        candidate_claims = get_supabase_claims_for_token(auth0_access_token, optional=False)
        if _is_verified_auth0_claims(candidate_claims):
            decoded_claims = candidate_claims
    except Exception:
        decoded_claims = None

    userinfo_claims = None
    if decoded_claims is None or not decoded_claims.get('email'):
        userinfo_claims, _userinfo_error = _fetch_auth0_userinfo(auth0_access_token)
        if decoded_claims is None and not isinstance(userinfo_claims, dict):
            return jsonify({
                'error': 'Unauthorized',
                'code': 'AUTH0_TOKEN_UNAUTHORIZED',
            }), 401

    claims = _merge_auth0_claims(decoded_claims, userinfo_claims)
    auth_identity = get_external_auth_identity_from_claims(claims)
    if not auth_identity or auth_identity.get('provider') != 'auth0':
        return jsonify({
            'error': 'Invalid access token',
            'code': 'AUTH0_INVALID_ACCESS_TOKEN',
        }), 401

    email = (claims.get('email') or '').strip().lower()
    if not email:
        return jsonify({
            'error': 'Token missing email claim',
            'code': 'AUTH0_EMAIL_CLAIM_REQUIRED',
        }), 400

    first_name, last_name = _extract_auth0_name(claims)
    if not first_name:
        first_name = 'AI'
    if not last_name:
        last_name = 'Learner'

    user_metadata = claims.get('user_metadata')
    if not isinstance(user_metadata, dict):
        user_metadata = {}

    role = claims.get('role') or user_metadata.get('role')
    organization = claims.get('organization') or user_metadata.get('organization')

    try:
        user = sync_managed_user(
            claims,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            organization=organization,
        )
    except AuthIdentityConflictError:
        db.session.rollback()
        return jsonify({
            'error': 'Email already exists for a legacy account',
            'code': 'EMAIL_ALREADY_EXISTS_LEGACY_ACCOUNT',
        }), 409
    except MissingIdentityEmailError:
        db.session.rollback()
        return jsonify({
            'error': 'Token missing email claim',
            'code': 'AUTH0_EMAIL_CLAIM_REQUIRED',
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Exchange failed', 'details': str(e)}), 500

    access_token = create_access_token(identity=user.id)
    return jsonify({
        'message': 'Token exchange successful',
        'access_token': access_token,
        'user': _build_user_payload(user),
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@supabase_jwt_required()
def get_profile():
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'organization': user.organization,
                'subscription_tier': user.subscription_tier,
                'created_at': user.created_at.isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get profile', 'details': str(e)}), 500


@auth_bp.route('/profile', methods=['OPTIONS'])
def profile_options():
    return _auth_preflight_response()

@auth_bp.route('/profile', methods=['PUT'])
@supabase_jwt_required()
def update_profile():
    try:
        user_id = g.get('current_user_id') or get_supabase_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name'].strip()
        if 'last_name' in data:
            user.last_name = data['last_name'].strip()
        if 'role' in data:
            user.role = data['role'].strip() if data['role'] else None
        if 'organization' in data:
            user.organization = data['organization'].strip() if data['organization'] else None
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'organization': user.organization,
                'subscription_tier': user.subscription_tier
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500


@auth_bp.route('/sync', methods=['POST'])
@supabase_jwt_required()
def sync_user():
    """Ensure a corresponding user record exists in the local database for Supabase-authenticated users."""
    try:
        g.get('current_user_id') or get_supabase_identity()
        claims = g.get('supabase_claims') or get_supabase_claims()
        payload = request.get_json() or {}

        email = (payload.get('email') or claims.get('email') or '').strip().lower()
        first_name = (payload.get('first_name')
                      or claims.get('user_metadata', {}).get('first_name')
                      or '').strip()
        last_name = (payload.get('last_name')
                     or claims.get('user_metadata', {}).get('last_name')
                     or '').strip()
        role = payload.get('role') or claims.get('user_metadata', {}).get('role')
        organization = payload.get('organization') or claims.get('user_metadata', {}).get('organization')

        if not email:
            return jsonify({'error': 'Email is required to sync user'}), 400

        if not first_name:
            first_name = 'AI'
        if not last_name:
            last_name = 'Learner'

        user = sync_managed_user(
            claims,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            organization=organization,
        )

        return jsonify({
            'message': 'User synchronized successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'organization': user.organization,
                'subscription_tier': user.subscription_tier
            }
        }), 200
    except AuthIdentityConflictError as exc:
        db.session.rollback()
        return jsonify({
            'error': 'Email already exists for a legacy account',
            'code': 'EMAIL_ALREADY_EXISTS_LEGACY_ACCOUNT',
            'message': 'A legacy account with this email already exists. Please sign in using email/password first, then link your social provider if needed.',
            'existing_user_id': exc.existing_user.id,
        }), 409
    except MissingIdentityEmailError:
        db.session.rollback()
        return jsonify({'error': 'Email is required to sync user'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to sync user', 'details': str(e)}), 500
