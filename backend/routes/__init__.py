from functools import wraps

import jwt
from flask import current_app, g, jsonify, request


def _decode_supabase_token(optional=False):
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        if optional:
            return None
        raise ValueError('Missing bearer token')

    token = auth_header.split(' ', 1)[1].strip()
    secret = current_app.config.get('SUPABASE_JWT_SECRET') or current_app.config.get('JWT_SECRET_KEY')
    if not secret:
        if optional:
            return None
        raise ValueError('Supabase JWT secret is not configured')

    try:
        decoded = jwt.decode(token, secret, algorithms=['HS256'], options={'verify_aud': False})
        return decoded
    except Exception:
        if optional:
            return None
        raise


def get_supabase_identity(optional=False):
    decoded = _decode_supabase_token(optional=optional)
    if not decoded:
        return None
    return decoded.get('sub') or decoded.get('user_id') or decoded.get('id')


def get_supabase_claims(optional=False):
    decoded = _decode_supabase_token(optional=optional)
    return decoded


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
                user_id = claims.get('sub') or claims.get('user_id') or claims.get('id')

            g.current_user_id = user_id
            g.supabase_claims = claims

            if user_id is None and not optional:
                return jsonify({'error': 'Unauthorized'}), 401

            return fn(*args, **kwargs)

        return wrapper

    return decorator
