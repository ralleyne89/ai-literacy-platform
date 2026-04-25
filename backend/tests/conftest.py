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
def supabase_keys():
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
def app(tmp_path, monkeypatch, supabase_keys):
    database_path = tmp_path / 'test.sqlite'
    test_app = create_app({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{database_path}',
        'SUPABASE_URL': 'https://project-ref.supabase.co',
        'SUPABASE_JWT_ISSUER': 'https://project-ref.supabase.co/auth/v1',
        'SUPABASE_JWKS_URL': 'https://project-ref.supabase.co/auth/v1/.well-known/jwks.json',
        'SUPABASE_JWT_AUDIENCE': 'authenticated',
    })

    _, public_key = supabase_keys
    monkeypatch.setattr(routes, 'PyJWKClient', lambda *args, **kwargs: _FakeJwksClient(public_key))
    for factory_name in (
        '_get_supabase_jwks_client',
        '_get_auth_jwks_client',
        '_get_jwks_client',
    ):
        if hasattr(routes, factory_name):
            monkeypatch.setattr(routes, factory_name, lambda jwks_url: _FakeJwksClient(public_key))

    for cache_name in ('_SUPABASE_JWKS_CLIENTS', '_AUTH_JWKS_CLIENTS'):
        cache = getattr(routes, cache_name, None)
        if isinstance(cache, dict):
            cache.clear()

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
def create_supabase_token(app, supabase_keys):
    private_key, _ = supabase_keys

    def _create(
        *,
        sub='00000000-0000-4000-8000-000000000001',
        email='user@example.com',
        issuer=None,
        audience=None,
        expires_delta=timedelta(minutes=10),
        extra_claims=None,
    ):
        now = datetime.now(timezone.utc)
        claims = {
            'sub': sub,
            'iss': issuer or app.config['SUPABASE_JWT_ISSUER'],
            'aud': audience or app.config['SUPABASE_JWT_AUDIENCE'],
            'role': 'authenticated',
            'iat': int(now.timestamp()),
            'nbf': int(now.timestamp()),
            'exp': int((now + expires_delta).timestamp()),
            'aal': 'aal1',
            'session_id': '00000000-0000-4000-8000-000000000099',
            'is_anonymous': False,
        }
        if email is not None:
            claims['email'] = email
            claims['user_metadata'] = {
                'email': email,
            }
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
def auth_headers(create_supabase_token):
    def _headers(user, *, extra_claims=None, email=None):
        token = create_supabase_token(
            sub=user.id,
            email=email or user.email,
            extra_claims=extra_claims,
        )
        return {'Authorization': f'Bearer {token}'}

    return _headers
