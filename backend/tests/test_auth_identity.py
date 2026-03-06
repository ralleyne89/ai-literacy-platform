from datetime import datetime, timedelta, timezone

import jwt
import routes
import routes.auth as auth_routes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app import app
from models import User


def _build_token(claims):
    return jwt.encode(claims, app.config['SUPABASE_JWT_SECRET'], algorithm='HS256')


class _FakeSigningKey:
    def __init__(self, key):
        self.key = key


class _FakeJwksClient:
    def __init__(self, key):
        self._key = key

    def get_signing_key_from_jwt(self, token):
        return _FakeSigningKey(self._key)


def _build_auth0_keys():
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    return private_pem, public_pem


def _build_auth0_token(private_key, *, sub, domain, audience, email='auth0@example.com'):
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            'sub': sub,
            'email': email,
            'iss': f'https://{domain}/',
            'aud': audience,
            'iat': int(now.timestamp()),
            'exp': int((now + timedelta(minutes=10)).timestamp()),
        },
        private_key,
        algorithm='RS256',
        headers={'kid': 'test-key'},
    )


def _clear_auth0_config(monkeypatch):
    for key in (
        'AUTH0_DOMAIN',
        'AUTH0_CLIENT_ID',
        'AUTH0_AUDIENCE',
        'AUTH0_REDIRECT_URI',
        'VITE_AUTH0_DOMAIN',
        'VITE_AUTH0_CLIENT_ID',
        'VITE_AUTH0_AUDIENCE',
        'VITE_AUTH0_REDIRECT_URI',
    ):
        monkeypatch.setenv(key, '')

    for key in ('AUTH0_DOMAIN', 'AUTH0_CLIENT_ID', 'AUTH0_AUDIENCE', 'AUTH0_REDIRECT_URI'):
        monkeypatch.setitem(app.config, key, '')


def test_sync_creates_internal_user_id_for_supabase_subject(client, monkeypatch):
    _clear_auth0_config(monkeypatch)
    external_subject = '12345678-1234-1234-1234-123456789abc'
    token = _build_token({
        'sub': external_subject,
        'email': 'supabase-user@example.com',
        'user_metadata': {
            'first_name': 'Supa',
            'last_name': 'Base',
        },
    })

    response = client.post(
        '/api/auth/sync',
        headers={'Authorization': f'Bearer {token}'},
        json={},
    )

    assert response.status_code == 200
    payload = response.get_json()
    synced_user = payload['user']

    assert synced_user['id'] != external_subject

    with app.app_context():
        user = User.query.filter_by(email='supabase-user@example.com').first()
        assert user is not None
        assert user.id == synced_user['id']
        assert user.auth_provider == 'supabase'
        assert user.auth_subject == external_subject

    profile_response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert profile_response.status_code == 200
    assert profile_response.get_json()['user']['id'] == synced_user['id']


def test_exchange_creates_internal_user_id_for_auth0_subject(client, monkeypatch):
    _clear_auth0_config(monkeypatch)
    external_subject = 'auth0|production-user-1234567890abcdef1234567890abcdef'
    token = _build_token({
        'sub': external_subject,
        'email': 'auth0-user@example.com',
        'given_name': 'Auth',
        'family_name': 'Zero',
        'iss': 'https://tenant.example.auth0.com/',
        'aud': 'https://api.example.com',
    })

    response = client.post(
        '/api/auth/exchange',
        json={'access_token': token},
    )

    assert response.status_code == 200
    payload = response.get_json()
    exchanged_user = payload['user']

    assert exchanged_user['id'] != external_subject

    with app.app_context():
        user = User.query.filter_by(email='auth0-user@example.com').first()
        assert user is not None
        assert user.id == exchanged_user['id']
        assert user.auth_provider == 'auth0'
        assert user.auth_subject == external_subject


def test_exchange_returns_auth0_token_unauthorized_for_unverifiable_auth0_token(client, monkeypatch):
    def raise_invalid_token(*_args, **_kwargs):
        raise Exception('invalid token')

    monkeypatch.setattr(auth_routes, 'get_supabase_claims_for_token', raise_invalid_token)

    response = client.post(
        '/api/auth/exchange',
        json={'access_token': 'invalid-auth0-token'},
    )

    assert response.status_code == 401
    assert response.get_json() == {
        'error': 'Unauthorized',
        'code': 'AUTH0_TOKEN_UNAUTHORIZED',
    }


def test_exchange_accepts_vite_auth0_config_fallbacks(client, monkeypatch):
    auth0_domain = 'litmusai-test.us.auth0.com'
    auth0_audience = 'https://api.example.test'
    auth0_subject = 'auth0|vite-config-user'
    private_key, public_key = _build_auth0_keys()

    monkeypatch.setitem(app.config, 'AUTH0_DOMAIN', '')
    monkeypatch.setitem(app.config, 'AUTH0_AUDIENCE', '')
    monkeypatch.setenv('AUTH0_DOMAIN', '')
    monkeypatch.setenv('AUTH0_AUDIENCE', '')
    monkeypatch.setenv('VITE_AUTH0_DOMAIN', f'https://{auth0_domain}')
    monkeypatch.setenv('VITE_AUTH0_AUDIENCE', auth0_audience)
    monkeypatch.setattr(routes, '_get_auth0_jwks_client', lambda domain: _FakeJwksClient(public_key))

    token = _build_auth0_token(
        private_key,
        sub=auth0_subject,
        domain=auth0_domain,
        audience=auth0_audience,
        email='vite-fallback@example.com',
    )

    response = client.post(
        '/api/auth/exchange',
        json={'access_token': token},
    )

    assert response.status_code == 200
    payload = response.get_json()
    exchanged_user = payload['user']

    assert exchanged_user['email'] == 'vite-fallback@example.com'

    with app.app_context():
        user = User.query.filter_by(email='vite-fallback@example.com').first()
        assert user is not None
        assert user.id == exchanged_user['id']
        assert user.auth_provider == 'auth0'
        assert user.auth_subject == auth0_subject
