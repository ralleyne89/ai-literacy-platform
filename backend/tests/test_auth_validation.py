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


def test_profile_uses_provider_scoped_clerk_identity(client, app, create_clerk_token):
    with app.app_context():
        user = User(
            email='clerk-profile@example.com',
            password_hash='clerk_managed',
            first_name='Clerk',
            last_name='Profile',
            auth_provider='clerk',
            auth_subject='user_clerk_profile',
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = create_clerk_token(
        sub='user_clerk_profile',
        email='clerk-profile@example.com',
    )

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    assert response.get_json()['user']['id'] == user_id
