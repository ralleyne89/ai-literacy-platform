from functools import wraps
import os
import uuid
from jwt import PyJWKClient

import jwt
from flask import current_app, g, jsonify, request


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


def _normalize_user_id(raw_user_id):
    if not isinstance(raw_user_id, str):
        return None

    user_id = raw_user_id.strip()
    if not user_id:
        return None

    if len(user_id) <= 36:
        return user_id

    if '|' in user_id:
        candidate = user_id.split('|', 1)[1].strip()
        if len(candidate) <= 36:
            return candidate

    return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_id))


def _decode_supabase_jwt(token):
    secret = current_app.config.get('SUPABASE_JWT_SECRET') or current_app.config.get('JWT_SECRET_KEY')
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


def _decode_token_claims(optional=False, token=None):
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

    claims = _decode_supabase_jwt(token)
    if claims is not None:
        return claims

    claims = _decode_auth0_jwt(token)
    if claims is not None:
        return claims

    if optional:
        return None

    raise ValueError('Unauthorized')


def _decode_supabase_token(optional=False):
    return _decode_token_claims(optional=optional)


def get_supabase_identity(optional=False):
    decoded = _decode_supabase_token(optional=optional)
    if not decoded:
        return None
    return _normalize_user_id(decoded.get('sub') or decoded.get('user_id') or decoded.get('id'))


def get_supabase_claims(optional=False):
    decoded = _decode_supabase_token(optional=optional)
    return decoded


def get_supabase_identity_for_token(token):
    decoded = _decode_token_claims(optional=False, token=token)
    if not decoded:
        return None
    return _normalize_user_id(decoded.get('sub') or decoded.get('user_id') or decoded.get('id'))


def get_supabase_claims_for_token(token, optional=False):
    return _decode_token_claims(optional=optional, token=token)


def supabase_jwt_required(optional: bool = False):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                claims = get_supabase_claims(optional=optional)
            except Exception:
                return jsonify({'error': 'Unauthorized'}), 401

            user_id = None
            if claims:
                user_id = _normalize_user_id(claims.get('sub') or claims.get('user_id') or claims.get('id'))

            g.current_user_id = user_id
            g.supabase_claims = claims

            if user_id is None and not optional:
                return jsonify({'error': 'Unauthorized'}), 401

            return fn(*args, **kwargs)

        return wrapper

    return decorator
