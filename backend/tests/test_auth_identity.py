from models import User, db


def test_sync_creates_internal_user_for_supabase_subject(client, app, create_supabase_token):
    token = create_supabase_token(
        sub='00000000-0000-4000-8000-000000000123',
        email='supabase-user@example.com',
        extra_claims={
            'given_name': 'Supabase',
            'family_name': 'User',
        },
    )

    response = client.post(
        '/api/auth/sync',
        headers={'Authorization': f'Bearer {token}'},
        json={},
    )

    assert response.status_code == 200
    payload = response.get_json()
    synced_user = payload['user']

    with app.app_context():
        user = User.query.filter_by(email='supabase-user@example.com').first()
        assert user is not None
        assert user.id == synced_user['id']
        assert user.auth_provider == 'supabase'
        assert user.auth_subject == '00000000-0000-4000-8000-000000000123'


def test_profile_links_existing_email_to_supabase_identity(client, app, create_supabase_token):
    with app.app_context():
        existing_user = User(
            email='existing@example.com',
            password_hash='test-hash',
            first_name='Existing',
            last_name='User',
        )

        db.session.add(existing_user)
        db.session.commit()
        existing_user_id = existing_user.id

    token = create_supabase_token(
        sub='00000000-0000-4000-8000-000000000456',
        email='existing@example.com',
        extra_claims={
            'given_name': 'Existing',
            'family_name': 'User',
        },
    )

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['user']['id'] == existing_user_id

    with app.app_context():
        user = User.query.get(existing_user_id)
        assert user.auth_provider == 'supabase'
        assert user.auth_subject == '00000000-0000-4000-8000-000000000456'


def test_profile_sync_preserves_locally_managed_fields(client, app, create_supabase_token):
    with app.app_context():
        user = User(
            email='preserve@example.com',
            password_hash='supabase_managed',
            first_name='Local',
            last_name='Profile',
            role='Sales',
            organization='Acme',
            auth_provider='supabase',
            auth_subject='00000000-0000-4000-8000-000000000789',
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.id

    token = create_supabase_token(
        sub='00000000-0000-4000-8000-000000000789',
        email='preserve@example.com',
        extra_claims={
            'given_name': 'Remote',
            'family_name': 'Profile',
        },
    )

    response = client.get(
        '/api/auth/profile',
        headers={'Authorization': f'Bearer {token}'},
    )

    assert response.status_code == 200

    with app.app_context():
        user = User.query.get(user_id)
        assert user.first_name == 'Remote'
        assert user.last_name == 'Profile'
        assert user.role == 'Sales'
        assert user.organization == 'Acme'
