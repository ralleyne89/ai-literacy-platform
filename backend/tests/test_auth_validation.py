from datetime import datetime, timedelta, timezone
import uuid

import jwt
import routes
from app import app
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from models import User, db


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


def _expected_auth0_user_id(subject):
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'auth0:{subject}'))


def test_profile_rejects_legacy_supabase_token_when_auth0_is_configured(client, monkeypatch):
    with app.app_context():
        user = User(
            email='legacy@example.com',
            password_hash='test-hash',
            first_name='Legacy',
            last_name='User',
        )
        db.session.add(user)
        db.session.commit()
        token = jwt.encode({'sub': user.id}, app.config['SUPABASE_JWT_SECRET'], algorithm='HS256')

    monkeypatch.setitem(app.config, 'AUTH0_DOMAIN', 'litmusai-test.us.auth0.com')
    monkeypatch.setitem(app.config, 'AUTH0_AUDIENCE', 'https://api.example.test')

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 401
    assert response.get_json() == {'error': 'Unauthorized'}


def test_profile_uses_provider_scoped_auth0_identity(client, monkeypatch):
    auth0_domain = 'litmusai-test.us.auth0.com'
    auth0_audience = 'https://api.example.test'
    auth0_subject = 'google-oauth2|abc123'
    expected_user_id = _expected_auth0_user_id(auth0_subject)
    private_key, public_key = _build_auth0_keys()

    with app.app_context():
        user = User(
            id=expected_user_id,
            email='auth0@example.com',
            password_hash='auth0_managed',
            first_name='Auth0',
            last_name='User',
        )
        db.session.add(user)
        db.session.commit()

    monkeypatch.setitem(app.config, 'AUTH0_DOMAIN', auth0_domain)
    monkeypatch.setitem(app.config, 'AUTH0_AUDIENCE', auth0_audience)
    monkeypatch.setattr(routes, '_get_auth0_jwks_client', lambda domain: _FakeJwksClient(public_key))

    token = _build_auth0_token(
        private_key,
        sub=auth0_subject,
        domain=auth0_domain,
        audience=auth0_audience,
    )

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert response.get_json()['user']['id'] == expected_user_id
