from functools import wraps
import os
import uuid
from jwt import PyJWKClient

import jwt
from flask import current_app, g, jsonify, request
from sqlalchemy.exc import SQLAlchemyError

from auth_identity import (
    AuthIdentityConflictError,
    MissingIdentityEmailError,
    get_external_auth_identity_from_claims,
    resolve_user_from_claims,
)


_AUTH0_JWKS_CLIENTS = {}


def _auth0_config_value(key):
    value = current_app.config.get(key)
    if value is None:
        value = os.getenv(key)

    return (str(value).strip() if value is not None else '')


def _auth0_bool(value):
    return str(value).lower() in ('1', 'true', 'yes', 'on')


def _normalize_auth0_domain(raw_domain):
    domain = _auth0_config_value('AUTH0_DOMAIN') if raw_domain is None else str(raw_domain).strip()
    if not domain:
        return ''

    normalized = domain.rstrip('/')
    if normalized.startswith(('http://', 'https://')):
        return normalized

    return f'https://{normalized}'


def _auth0_issuer(domain):
    normalized = _normalize_auth0_domain(domain)
    if not normalized:
        return ''

    return f'{normalized}/'


def _auth0_jwks_url(domain):
    normalized = _normalize_auth0_domain(domain)
    if not normalized:
        return ''

    return f'{normalized}/.well-known/jwks.json'


def _get_auth0_jwks_client(domain):
    normalized = _normalize_auth0_domain(domain)
    if not normalized:
        return None

    if normalized in _AUTH0_JWKS_CLIENTS:
        return _AUTH0_JWKS_CLIENTS[normalized]

    try:
        cache_keys = _auth0_bool(_auth0_config_value('AUTH0_JWKS_CACHE_KEYS'))
        max_cached_keys = int(_auth0_config_value('AUTH0_JWKS_MAX_KEYS') or 16)
        cache_lifespan = int(_auth0_config_value('AUTH0_JWKS_CACHE_LIFESPAN') or 300)
        timeout = int(_auth0_config_value('AUTH0_JWKS_TIMEOUT_SECONDS') or 30)
    except ValueError:
        max_cached_keys = 16
        cache_lifespan = 300
        timeout = 30

    try:
        client = PyJWKClient(
            _auth0_jwks_url(normalized),
            cache_keys=cache_keys,
            max_cached_keys=max_cached_keys,
            lifespan=cache_lifespan,
            timeout=timeout,
        )
    except Exception:
        return None

    _AUTH0_JWKS_CLIENTS[normalized] = client
    return client


def _auth0_is_configured():
    return bool(_normalize_auth0_domain(None) and _auth0_config_value('AUTH0_AUDIENCE'))


def _normalize_identity_value(value):
    if not isinstance(value, str):
        return ''
    return value.strip()


def _is_uuid_like(value):
    try:
        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError, AttributeError):
        return False


def _stable_provider_user_id(provider, subject):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'{provider}:{subject}'))


def _normalize_user_id(raw_user_id, provider='backend'):
    if not isinstance(raw_user_id, str):
        return None

    user_id = raw_user_id.strip()
    if not user_id:
        return None

    if provider == 'backend':
        return user_id

    if provider == 'auth0':
        return _stable_provider_user_id(provider, user_id)

    if _is_uuid_like(user_id):
        return str(uuid.UUID(user_id))

    if len(user_id) <= 36:
        return user_id

    return _stable_provider_user_id(provider or 'external', user_id)


def _decode_backend_jwt(token):
    secret = current_app.config.get('JWT_SECRET_KEY')
    if not secret:
        return None

    try:
        decoded = jwt.decode(token, secret, algorithms=['HS256'], options={'verify_aud': False})
    except Exception:
        return None

    if not isinstance(decoded, dict):
        return None

    token_type = decoded.get('type')
    if token_type not in (None, 'access'):
        return None

    return decoded


def _decode_legacy_supabase_jwt(token):
    if _auth0_is_configured():
        return None

    secret = current_app.config.get('SUPABASE_JWT_SECRET')
    if not secret:
        return None

    try:
        return jwt.decode(token, secret, algorithms=['HS256'], options={'verify_aud': False})
    except Exception:
        return None


def _decode_auth0_jwt(token):
    domain = _normalize_auth0_domain(None)
    audience = _auth0_config_value('AUTH0_AUDIENCE')
    if not domain or not audience:
        return None

    client = _get_auth0_jwks_client(domain)
    if client is None:
        return None

    try:
        signing_key = client.get_signing_key_from_jwt(token).key
        return jwt.decode(
            token,
            signing_key,
            algorithms=['RS256'],
            audience=audience,
            issuer=_auth0_issuer(domain),
        )
    except Exception:
        return None


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
    providers = ['backend']
    if _auth0_is_configured():
        providers.append('auth0')
    elif current_app.config.get('SUPABASE_JWT_SECRET'):
        providers.append('legacy_supabase')
    return tuple(providers)


def _build_identity(provider, claims):
    subject = _normalize_identity_value(
        claims.get('sub') or claims.get('user_id') or claims.get('id')
    )
    user = resolve_user_from_claims(claims, create_if_missing=bool(subject))
    user_id = user.id if user is not None else None
    return {
        'provider': provider,
        'subject': subject,
        'user_id': user_id,
        'claims': claims,
    }


def _decode_token_identity(optional=False, token=None, allowed_providers=None):
    token = _extract_token_value(optional=optional, token=token)
    if token is None:
        return None

    providers = tuple(allowed_providers or _default_allowed_providers())
    decoders = {
        'backend': _decode_backend_jwt,
        'auth0': _decode_auth0_jwt,
        'legacy_supabase': _decode_legacy_supabase_jwt,
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


def _decode_supabase_token(optional=False):
    identity = _decode_token_identity(optional=optional)
    if not identity:
        return None
    return identity.get('claims')


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
    claims = get_authenticated_claims(
        optional=optional,
        token=token,
        allowed_providers=allowed_providers,
    )
    if not claims:
        return None

    return get_external_auth_identity_from_claims(claims)


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
                    'code': 'EMAIL_ALREADY_EXISTS_LEGACY_ACCOUNT',
                    'existing_user_id': exc.existing_user.id,
                }), 409
            except MissingIdentityEmailError as exc:
                return jsonify({'error': str(exc)}), 400
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
