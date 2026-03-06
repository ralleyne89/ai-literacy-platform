import jwt

from app import app
from models import User


def _build_token(claims):
    return jwt.encode(claims, app.config['SUPABASE_JWT_SECRET'], algorithm='HS256')


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
