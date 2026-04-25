from functools import wraps
import os

import jwt
from jwt import PyJWKClient
from flask import current_app, g, jsonify, request
from sqlalchemy.exc import SQLAlchemyError

from auth_identity import (
    AuthIdentityConflictError,
    MissingIdentityEmailError,
    resolve_user_from_claims,
)


DEMO_USER_ID = 'demo-user'
CLERK_PROVIDER = 'clerk'
DEMO_PROVIDER = 'demo'
_CLERK_JWKS_CLIENTS = {}
TRUTHY_VALUES = {'1', 'true', 'yes', 'on'}


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


def _normalize_issuer(raw_value=None):
    value = _config_value('CLERK_JWT_ISSUER') if raw_value is None else str(raw_value).strip()
    if not value:
        return ''
    return value.rstrip('/')


def _normalize_jwks_url(raw_value=None):
    value = _config_value('CLERK_JWKS_URL') if raw_value is None else str(raw_value).strip()
    if not value:
        return ''
    return value.rstrip('/')


def _clerk_is_configured():
    return bool(_normalize_issuer() and _normalize_jwks_url())


def _get_clerk_jwks_client(jwks_url):
    normalized = _normalize_jwks_url(jwks_url)
    if not normalized:
        return None

    if normalized in _CLERK_JWKS_CLIENTS:
        return _CLERK_JWKS_CLIENTS[normalized]

    try:
        cache_keys = str(_config_value('CLERK_JWKS_CACHE_KEYS')).lower() in ('1', 'true', 'yes', 'on')
        max_cached_keys = int(_config_value('CLERK_JWKS_MAX_KEYS') or 16)
        cache_lifespan = int(_config_value('CLERK_JWKS_CACHE_LIFESPAN') or 300)
        timeout = int(_config_value('CLERK_JWKS_TIMEOUT_SECONDS') or 30)
    except ValueError:
        cache_keys = False
        max_cached_keys = 16
        cache_lifespan = 300
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

    _CLERK_JWKS_CLIENTS[normalized] = client
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


def _get_or_create_demo_user():
    from models import User, db

    user = User.query.get(DEMO_USER_ID)
    if user is not None:
        return user

    user = User(
        id=DEMO_USER_ID,
        email='demo@example.com',
        password_hash='demo',
        auth_provider=DEMO_PROVIDER,
        auth_subject=DEMO_USER_ID,
        first_name='Demo',
        last_name='User',
        role='learner',
    )
    db.session.add(user)
    db.session.commit()
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


def _decode_clerk_jwt(token):
    issuer = _normalize_issuer()
    jwks_url = _normalize_jwks_url()
    if not issuer or not jwks_url:
        return None

    client = _get_clerk_jwks_client(jwks_url)
    if client is None:
        return None

    try:
        signing_key = client.get_signing_key_from_jwt(token).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=['RS256'],
            options={'verify_aud': False},
        )
    except Exception:
        return None

    token_issuer = _normalize_issuer(claims.get('iss'))
    if token_issuer != issuer:
        return None

    return claims if isinstance(claims, dict) else None


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
    if _clerk_is_configured():
        providers.append(CLERK_PROVIDER)
    return tuple(providers)


def _decode_token_identity(optional=False, token=None, allowed_providers=None):
    token = _extract_token_value(optional=optional, token=token)
    if token is None:
        return None

    if token == 'demo' and _demo_auth_enabled():
        demo_user = _get_or_create_demo_user()
        return {
            'provider': DEMO_PROVIDER,
            'subject': DEMO_USER_ID,
            'user_id': demo_user.id,
            'claims': {'sub': demo_user.id},
        }

    providers = tuple(allowed_providers or _default_allowed_providers())
    decoders = {
        CLERK_PROVIDER: _decode_clerk_jwt,
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
                return jsonify({'error': str(exc), 'code': 'CLERK_EMAIL_REQUIRED'}), 400
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
