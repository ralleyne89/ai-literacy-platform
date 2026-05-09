from functools import wraps
import base64
import json
import os
import uuid

import jwt
from jwt import PyJWKClient
from flask import current_app, g, jsonify, request
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from auth_identity import (
    AuthIdentityConflictError,
    MissingIdentityEmailError,
    resolve_user_from_claims,
)


DEMO_USER_ID = 'demo-user'
DEMO_TOKEN_PREFIX = 'demo.'
SUPABASE_PROVIDER = 'supabase'
DEMO_PROVIDER = 'demo'
_SUPABASE_JWKS_CLIENTS = {}
TRUTHY_VALUES = {'1', 'true', 'yes', 'on'}
ASYMMETRIC_ALGORITHMS = ('RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'EdDSA')


def _config_value(key):
    value = current_app.config.get(key)
    if value is not None:
        normalized = str(value).strip()
        if normalized:
            return normalized

    env_value = os.getenv(key)
    if env_value is not None:
        normalized = str(env_value).strip()
        if normalized:
            return normalized

    return ''


def _normalize_url(value):
    normalized = str(value or '').strip().rstrip('/')
    if not normalized:
        return ''
    return normalized


def _normalize_supabase_url():
    return _normalize_url(_config_value('SUPABASE_URL') or _config_value('VITE_SUPABASE_URL'))


def _normalize_issuer(raw_value=None):
    value = _normalize_url(raw_value) if raw_value is not None else _normalize_url(_config_value('SUPABASE_JWT_ISSUER'))
    if value:
        return value

    supabase_url = _normalize_supabase_url()
    if supabase_url:
        return f'{supabase_url}/auth/v1'

    return ''


def _normalize_jwks_url(raw_value=None):
    value = _normalize_url(raw_value) if raw_value is not None else _normalize_url(_config_value('SUPABASE_JWKS_URL'))
    if value:
        return value

    issuer = _normalize_issuer()
    if issuer:
        return f'{issuer}/.well-known/jwks.json'

    return ''


def _normalize_audience():
    return _config_value('SUPABASE_JWT_AUDIENCE') or 'authenticated'


def _supabase_jwt_secret():
    return _config_value('SUPABASE_JWT_SECRET')


def _supabase_is_configured():
    return bool(_normalize_issuer() and (_normalize_jwks_url() or _supabase_jwt_secret()))


def _get_supabase_jwks_client(jwks_url):
    normalized = _normalize_jwks_url(jwks_url)
    if not normalized:
        return None

    if normalized in _SUPABASE_JWKS_CLIENTS:
        return _SUPABASE_JWKS_CLIENTS[normalized]

    try:
        cache_keys = str(_config_value('SUPABASE_JWKS_CACHE_KEYS')).lower() in TRUTHY_VALUES
        max_cached_keys = int(_config_value('SUPABASE_JWKS_MAX_KEYS') or 16)
        cache_lifespan = int(_config_value('SUPABASE_JWKS_CACHE_LIFESPAN') or 600)
        timeout = int(_config_value('SUPABASE_JWKS_TIMEOUT_SECONDS') or 30)
    except ValueError:
        cache_keys = False
        max_cached_keys = 16
        cache_lifespan = 600
        timeout = 30

    try:
        client = PyJWKClient(
            normalized,
            cache_keys=cache_keys,
            max_cached_keys=max_cached_keys,
            lifespan=cache_lifespan,
            timeout=timeout,
        )
    except Exception:
        return None

    _SUPABASE_JWKS_CLIENTS[normalized] = client
    return client


def _normalize_identity_value(value):
    if not isinstance(value, str):
        return ''
    return value.strip()


def _truthy_config(key):
    return _config_value(key).lower() in TRUTHY_VALUES


def _demo_auth_enabled():
    if current_app.config.get('TESTING'):
        return True

    environment = (_config_value('FLASK_ENV') or _config_value('ENV')).lower()
    if environment in ('production', 'prod'):
        return False

    return _truthy_config('ENABLE_DEMO_AUTH') or environment == 'demo'


def _truncate(value, max_length, fallback=''):
    normalized = str(value or '').strip()
    if not normalized:
        return fallback
    return normalized[:max_length]


def _default_demo_claims():
    return {
        'sub': DEMO_USER_ID,
        'email': 'demo@example.com',
        'user_metadata': {
            'first_name': 'Demo',
            'last_name': 'User',
        },
        'role': 'learner',
    }


def _decode_demo_payload_token(token):
    if token == 'demo':
        return _default_demo_claims()

    if not isinstance(token, str) or not token.startswith(DEMO_TOKEN_PREFIX):
        return None

    encoded = token[len(DEMO_TOKEN_PREFIX):].strip()
    if not encoded:
        return None

    try:
        padding = '=' * (-len(encoded) % 4)
        decoded = base64.urlsafe_b64decode(f'{encoded}{padding}'.encode('utf-8')).decode('utf-8')
        payload = json.loads(decoded)
    except Exception:
        return None

    if not isinstance(payload, dict):
        return None

    email = _truncate(payload.get('email'), 120).lower()
    if '@' not in email:
        return None

    metadata = payload.get('user_metadata') if isinstance(payload.get('user_metadata'), dict) else {}
    first_name = _truncate(metadata.get('first_name') or payload.get('first_name'), 50, 'Review')
    last_name = _truncate(metadata.get('last_name') or payload.get('last_name'), 50, 'User')
    role = _truncate(payload.get('role'), 50, 'learner')
    organization = _truncate(payload.get('organization'), 100, '')
    subject = str(uuid.uuid5(uuid.NAMESPACE_URL, f'litmusai-demo-review:{email}'))

    return {
        'sub': subject,
        'email': email,
        'user_metadata': {
            'first_name': first_name,
            'last_name': last_name,
        },
        'role': role,
        'organization': organization,
    }


def _get_or_create_demo_user(claims=None):
    from models import User, db

    demo_claims = claims if isinstance(claims, dict) else _default_demo_claims()
    subject = _truncate(demo_claims.get('sub'), 36, DEMO_USER_ID)
    email = _truncate(demo_claims.get('email'), 120, 'demo@example.com').lower()
    metadata = demo_claims.get('user_metadata') if isinstance(demo_claims.get('user_metadata'), dict) else {}
    first_name = _truncate(metadata.get('first_name'), 50, 'Demo')
    last_name = _truncate(metadata.get('last_name'), 50, 'User')
    role = _truncate(demo_claims.get('role'), 50, 'learner')
    organization = _truncate(demo_claims.get('organization'), 100, '')

    user = User.query.get(subject)
    if user is not None:
        user.email = email
        user.first_name = first_name
        user.last_name = last_name
        user.role = role
        user.organization = organization or None
        db.session.commit()
        return user

    user = User.query.filter_by(email=email).first()
    if user is not None:
        user.auth_provider = DEMO_PROVIDER
        user.auth_subject = subject
        user.first_name = first_name
        user.last_name = last_name
        user.role = role
        user.organization = organization or None
        db.session.commit()
        return user

    user = User(
        id=subject,
        email=email,
        password_hash='demo',
        auth_provider=DEMO_PROVIDER,
        auth_subject=subject,
        first_name=first_name,
        last_name=last_name,
        role=role,
        organization=organization or None,
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        user = User.query.get(subject) or User.query.filter_by(email=email).first()
        if user is None:
            raise
    return user


def _build_identity(provider, claims):
    subject = _normalize_identity_value(claims.get('sub'))
    user = resolve_user_from_claims(claims, create_if_missing=bool(subject))
    user_id = user.id if user is not None else None
    return {
        'provider': provider,
        'subject': subject,
        'user_id': user_id,
        'claims': claims,
    }


def _token_algorithm(token):
    try:
        header = jwt.get_unverified_header(token)
    except Exception:
        return ''

    return str(header.get('alg') or '').strip()


def _decode_supabase_jwks_jwt(token, issuer, audience):
    jwks_url = _normalize_jwks_url()
    if not jwks_url:
        return None

    client = _get_supabase_jwks_client(jwks_url)
    if client is None:
        return None

    try:
        signing_key = client.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=list(ASYMMETRIC_ALGORITHMS),
            audience=audience,
            issuer=issuer,
        )
    except Exception:
        return None

    return claims if isinstance(claims, dict) else None


def _decode_supabase_legacy_jwt(token, issuer, audience):
    secret = _supabase_jwt_secret()
    if not secret:
        return None

    try:
        claims = jwt.decode(
            token,
            secret,
            algorithms=['HS256'],
            audience=audience,
            issuer=issuer,
        )
    except Exception:
        return None

    return claims if isinstance(claims, dict) else None


def _decode_supabase_jwt(token):
    issuer = _normalize_issuer()
    audience = _normalize_audience()
    if not issuer or not audience:
        return None

    algorithm = _token_algorithm(token)
    claims = None

    if algorithm and algorithm != 'HS256':
        claims = _decode_supabase_jwks_jwt(token, issuer, audience)

    if claims is None:
        claims = _decode_supabase_legacy_jwt(token, issuer, audience)

    if not isinstance(claims, dict) or not _normalize_identity_value(claims.get('sub')):
        return None

    return claims


def _extract_token_value(optional=False, token=None):
    if token is None:
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            if optional:
                return None
            raise ValueError('Missing bearer token')

        token = auth_header.split(' ', 1)[1].strip()
    elif isinstance(token, str):
        token = token.strip()
        if not token and not optional:
            raise ValueError('Missing bearer token')
    else:
        if optional:
            return None
        raise ValueError('Missing bearer token')

    return token


def _default_allowed_providers():
    providers = []
    if _supabase_is_configured():
        providers.append(SUPABASE_PROVIDER)
    return tuple(providers)


def _decode_token_identity(optional=False, token=None, allowed_providers=None):
    token = _extract_token_value(optional=optional, token=token)
    if token is None:
        return None

    demo_claims = _decode_demo_payload_token(token)
    if demo_claims and _demo_auth_enabled():
        demo_user = _get_or_create_demo_user(demo_claims)
        return {
            'provider': DEMO_PROVIDER,
            'subject': demo_claims['sub'],
            'user_id': demo_user.id,
            'claims': demo_claims,
        }

    providers = tuple(allowed_providers or _default_allowed_providers())
    decoders = {
        SUPABASE_PROVIDER: _decode_supabase_jwt,
    }

    for provider in providers:
        decoder = decoders.get(provider)
        if decoder is None:
            continue

        claims = decoder(token)
        if claims is not None:
            return _build_identity(provider, claims)

    if optional:
        return None

    raise ValueError('Unauthorized')


def get_authenticated_identity(optional=False, token=None, allowed_providers=None):
    return _decode_token_identity(
        optional=optional,
        token=token,
        allowed_providers=allowed_providers,
    )


def get_authenticated_claims(optional=False, token=None, allowed_providers=None):
    identity = get_authenticated_identity(
        optional=optional,
        token=token,
        allowed_providers=allowed_providers,
    )
    if not identity:
        return None
    return identity.get('claims')


def get_supabase_identity(optional=False):
    identity = get_authenticated_identity(optional=optional)
    if not identity:
        return None
    return identity.get('user_id')


def get_supabase_claims(optional=False):
    return get_authenticated_claims(optional=optional)


def get_supabase_identity_for_token(token):
    identity = get_authenticated_identity(optional=False, token=token)
    if not identity:
        return None
    return identity.get('user_id')


def get_supabase_claims_for_token(token, optional=False):
    return get_authenticated_claims(optional=optional, token=token)


def get_external_auth_identity(optional=False, token=None, allowed_providers=None):
    identity = get_authenticated_identity(
        optional=optional,
        token=token,
        allowed_providers=allowed_providers,
    )
    if not identity:
        return None

    return {
        'provider': identity.get('provider'),
        'subject': identity.get('subject'),
    }


def get_external_auth_identity_for_token(token, optional=False, allowed_providers=None):
    return get_external_auth_identity(
        optional=optional,
        token=token,
        allowed_providers=allowed_providers,
    )


def supabase_jwt_required(optional: bool = False, allowed_providers=None):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                identity = get_authenticated_identity(
                    optional=optional,
                    allowed_providers=allowed_providers,
                )
            except AuthIdentityConflictError as exc:
                return jsonify({
                    'error': str(exc),
                    'code': 'EMAIL_ALREADY_EXISTS_MANAGED_ACCOUNT',
                    'existing_user_id': exc.existing_user.id,
                }), 409
            except MissingIdentityEmailError as exc:
                return jsonify({'error': str(exc), 'code': 'SUPABASE_EMAIL_REQUIRED'}), 400
            except SQLAlchemyError:
                return jsonify({'error': 'Authentication storage unavailable'}), 503
            except Exception:
                return jsonify({'error': 'Unauthorized'}), 401

            claims = identity.get('claims') if identity else None
            user_id = identity.get('user_id') if identity else None
            subject = identity.get('subject') if identity else None
            provider = identity.get('provider') if identity else None

            g.current_user_id = user_id
            g.current_user_subject = subject
            g.current_auth_provider = provider
            g.current_user_claims = claims
            g.authenticated_identity = identity
            g.supabase_claims = claims

            if user_id is None and not optional:
                return jsonify({'error': 'Unauthorized'}), 401

            return fn(*args, **kwargs)

        return wrapper

    return decorator
