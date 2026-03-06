from datetime import datetime, timedelta, timezone
import json

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
import jwt
import routes
from routes import auth as auth_routes

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


class _FakeUrlopenResponse:
    def __init__(self, payload):
        self._payload = json.dumps(payload).encode('utf-8')

    def read(self):
        return self._payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False


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


def _build_auth0_token(private_key, *, sub, domain, audience, email=None):
    now = datetime.now(timezone.utc)
    claims = {
        'sub': sub,
        'iss': f'https://{domain}/',
        'aud': audience,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(minutes=10)).timestamp()),
    }
    if email:
        claims['email'] = email

    return jwt.encode(
        claims,
        private_key,
        algorithm='RS256',
        headers={'kid': 'test-key'},
    )


def test_sync_creates_internal_user_id_for_supabase_subject(client):
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


def test_exchange_creates_internal_user_id_for_auth0_subject(client):
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


def test_exchange_uses_auth0_userinfo_when_verified_token_omits_email(client, monkeypatch):
    auth0_domain = 'litmusai-test.us.auth0.com'
    auth0_audience = 'https://api.example.test'
    external_subject = 'auth0|userinfo-email-fallback'
    private_key, public_key = _build_auth0_keys()
    token = _build_auth0_token(
        private_key,
        sub=external_subject,
        domain=auth0_domain,
        audience=auth0_audience,
    )

    monkeypatch.setitem(app.config, 'AUTH0_DOMAIN', auth0_domain)
    monkeypatch.setitem(app.config, 'AUTH0_AUDIENCE', auth0_audience)
    monkeypatch.setattr(routes, '_get_auth0_jwks_client', lambda domain: _FakeJwksClient(public_key))

    def fake_urlopen(request, timeout=10):
        assert request.full_url == f'https://{auth0_domain}/userinfo'
        return _FakeUrlopenResponse({
            'sub': external_subject,
            'email': 'userinfo-fallback@example.com',
            'given_name': 'Userinfo',
            'family_name': 'Fallback',
        })

    monkeypatch.setattr(auth_routes, 'urlopen', fake_urlopen)

    response = client.post(
        '/api/auth/exchange',
        json={'access_token': token},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['user']['email'] == 'userinfo-fallback@example.com'

    with app.app_context():
        user = User.query.filter_by(email='userinfo-fallback@example.com').first()
        assert user is not None
        assert user.auth_provider == 'auth0'
        assert user.auth_subject == external_subject


def test_exchange_accepts_auth0_userinfo_when_token_is_not_locally_decodable(client, monkeypatch):
    auth0_domain = 'litmusai-test.us.auth0.com'
    auth0_audience = 'https://api.example.test'
    external_subject = 'auth0|opaque-userinfo-fallback'
    opaque_token = 'opaque-auth0-access-token'

    monkeypatch.setitem(app.config, 'AUTH0_DOMAIN', auth0_domain)
    monkeypatch.setitem(app.config, 'AUTH0_AUDIENCE', auth0_audience)
    monkeypatch.setattr(routes, '_get_auth0_jwks_client', lambda domain: None)

    def fake_urlopen(request, timeout=10):
        assert request.full_url == f'https://{auth0_domain}/userinfo'
        return _FakeUrlopenResponse({
            'sub': external_subject,
            'email': 'opaque-userinfo@example.com',
            'given_name': 'Opaque',
            'family_name': 'Token',
        })

    monkeypatch.setattr(auth_routes, 'urlopen', fake_urlopen)

    response = client.post(
        '/api/auth/exchange',
        json={'access_token': opaque_token},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['user']['email'] == 'opaque-userinfo@example.com'

    with app.app_context():
        user = User.query.filter_by(email='opaque-userinfo@example.com').first()
        assert user is not None
        assert user.auth_provider == 'auth0'
        assert user.auth_subject == external_subject
