from flask import Blueprint, request, jsonify, g
from flask_jwt_extended import create_access_token
from models import db, User
from logging_config import get_logger
from sqlalchemy.exc import DataError, IntegrityError, OperationalError, ProgrammingError
import bcrypt
import re
from routes import supabase_jwt_required, get_supabase_identity, get_supabase_claims

auth_bp = Blueprint('auth', __name__)
logger = get_logger(__name__)

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


def _email_log_context(email):
    if not isinstance(email, str) or '@' not in email:
        return {'email_domain': 'unknown'}

    local_part, domain = email.rsplit('@', 1)
    return {
        'email_domain': domain.lower(),
        'email_local_length': len(local_part),
    }


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

        if not _is_valid_bcrypt_hash(user.password_hash):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        # Check password
        try:
            if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
                return jsonify({'error': 'Invalid email or password'}), 401
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid email or password'}), 401
        
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
        supabase_user_id = g.get('current_user_id') or get_supabase_identity()
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

        user = User.query.get(supabase_user_id)

        if not user:
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.id != supabase_user_id:
                return jsonify({
                    'error': 'Email already exists for a legacy account',
                    'code': 'EMAIL_ALREADY_EXISTS_LEGACY_ACCOUNT',
                    'message': 'A legacy account with this email already exists. Please sign in using email/password first, then link your social provider if needed.',
                    'existing_user_id': existing_user.id
                }), 409

            user = User(
                id=supabase_user_id,
                email=email,
                password_hash='supabase_managed',
                first_name=first_name,
                last_name=last_name,
                role=role or None,
                organization=organization or None
            )
            db.session.add(user)
        else:
            user.email = email
            user.first_name = first_name
            user.last_name = last_name
            user.role = role or None
            user.organization = organization or None

        db.session.commit()

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

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to sync user', 'details': str(e)}), 500
