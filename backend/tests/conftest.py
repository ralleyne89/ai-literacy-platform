from datetime import datetime, timedelta, timezone

import jwt
import pytest
import routes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app import create_app
from models import db
from seeders.certifications import seed_certification_types
from seeders.course_content import seed_course_content
from seeders.training import seed_training_modules


class _FakeSigningKey:
    def __init__(self, key):
        self.key = key


class _FakeJwksClient:
    def __init__(self, key):
        self._key = key

    def get_signing_key_from_jwt(self, token):
        return _FakeSigningKey(self._key)


@pytest.fixture(scope='session')
def clerk_keys():
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


@pytest.fixture()
def app(tmp_path, monkeypatch, clerk_keys):
    database_path = tmp_path / 'test.sqlite'
    test_app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{database_path}',
        'CLERK_SECRET_KEY': 'sk_test_clerk',
        'CLERK_JWT_ISSUER': 'https://clerk.test',
        'CLERK_JWKS_URL': 'https://clerk.test/.well-known/jwks.json',
        'CLERK_API_URL': 'https://api.clerk.test',
    })

    _, public_key = clerk_keys
    monkeypatch.setattr(routes, '_get_clerk_jwks_client', lambda jwks_url: _FakeJwksClient(public_key))

    with test_app.app_context():
        db.drop_all()
        db.create_all()
        seed_training_modules(force=True, silent=True)
        seed_certification_types(force=True, silent=True)
        seed_course_content(force=True, silent=True)
        yield test_app
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def create_clerk_token(app, clerk_keys):
    private_key, _ = clerk_keys

    def _create(*, sub='user_test', email='user@example.com', extra_claims=None):
        now = datetime.now(timezone.utc)
        claims = {
            'sub': sub,
            'iss': app.config['CLERK_JWT_ISSUER'],
            'iat': int(now.timestamp()),
            'nbf': int(now.timestamp()),
            'exp': int((now + timedelta(minutes=10)).timestamp()),
        }
        if email is not None:
            claims['email'] = email
        if isinstance(extra_claims, dict):
            claims.update(extra_claims)

        return jwt.encode(
            claims,
            private_key,
            algorithm='RS256',
            headers={'kid': 'test-key'},
        )

    return _create


@pytest.fixture()
def auth_headers(create_clerk_token):
    def _headers(user, *, extra_claims=None, email=None):
        token = create_clerk_token(
            sub=user.id,
            email=email or user.email,
            extra_claims=extra_claims,
        )
        return {'Authorization': f'Bearer {token}'}

    return _headers
