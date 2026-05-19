from datetime import timedelta
import base64
import json

import pytest

from models import User, db


def test_profile_rejects_invalid_bearer_token(client):
    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': 'Bearer invalid-token'},
    )

    assert response.status_code == 401
    assert response.get_json() == {'error': 'Unauthorized'}


def test_demo_bearer_token_is_rejected_in_production(client, app, monkeypatch):
    monkeypatch.setitem(app.config, 'TESTING', False)
    monkeypatch.setitem(app.config, 'FLASK_ENV', 'production')

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': 'Bearer demo'},
    )

    assert response.status_code == 401
    assert response.get_json() == {'error': 'Unauthorized'}


def test_demo_payload_token_creates_review_user_when_enabled(client, app):
    payload = {
        'email': 'reggiealleyne89@gmail.com',
        'user_metadata': {
            'first_name': 'Reggie',
            'last_name': 'Alleyne',
        },
        'role': 'learner',
    }
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8').rstrip('=')

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer demo.{encoded}'},
    )

    assert response.status_code == 200
    user = response.get_json()['user']
    assert user['email'] == 'reggiealleyne89@gmail.com'
    assert user['first_name'] == 'Reggie'
    assert user['last_name'] == 'Alleyne'

    with app.app_context():
        stored = User.query.get(user['id'])
        assert stored is not None
        assert stored.auth_provider == 'demo'


def test_demo_payload_token_is_rejected_in_production(client, app, monkeypatch):
    payload = {'email': 'reggiealleyne89@gmail.com'}
    encoded = base64.urlsafe_b64encode(json.dumps(payload).encode('utf-8')).decode('utf-8').rstrip('=')
    monkeypatch.setitem(app.config, 'TESTING', False)
    monkeypatch.setitem(app.config, 'FLASK_ENV', 'production')

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer demo.{encoded}'},
    )

    assert response.status_code == 401
    assert response.get_json() == {'error': 'Unauthorized'}


def test_profile_rejects_expired_supabase_token(client, create_supabase_token):
    token = create_supabase_token(expires_delta=timedelta(minutes=-1))

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 401
    assert response.get_json() == {'error': 'Unauthorized'}


@pytest.mark.parametrize(
    ('claim_name', 'claim_value'),
    [
        ('issuer', 'https://other-project.supabase.co/auth/v1'),
        ('audience', 'anon'),
    ],
)
def test_profile_rejects_supabase_token_with_untrusted_claims(
    client,
    create_supabase_token,
    claim_name,
    claim_value,
):
    token = create_supabase_token(**{claim_name: claim_value})

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 401
    assert response.get_json() == {'error': 'Unauthorized'}


def test_profile_uses_provider_scoped_supabase_identity(client, app, create_supabase_token):
    with app.app_context():
        user = User(
            email='supabase-profile@example.com',
            password_hash='supabase_managed',
            first_name='Supabase',
            last_name='Profile',
            auth_provider='supabase',
            auth_subject='00000000-0000-4000-8000-000000000321',
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = create_supabase_token(
        sub='00000000-0000-4000-8000-000000000321',
        email='supabase-profile@example.com',
    )

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert response.get_json()['user']['id'] == user_id
