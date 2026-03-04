import jwt
import pytest

from app import app
from models import db, User


@pytest.fixture()
def authenticated_user(client):
    with app.app_context():
        user = User(
            email='billing@example.com',
            password_hash='test-hash',
            first_name='Bill',
            last_name='User',
            subscription_tier='free'
        )
        db.session.add(user)
        db.session.commit()
        user_id = user.id
        user_email = user.email

    token = jwt.encode({'sub': user_id}, app.config['SUPABASE_JWT_SECRET'], algorithm='HS256')
    return {
        'id': user_id,
        'email': user_email,
        'token': token
    }


def test_billing_config_endpoint(client, monkeypatch):
    monkeypatch.setenv('STRIPE_PRICE_PREMIUM', '')
    response = client.get('/api/billing/config')
    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload.get('plans'), list)
    assert any(plan['id'] == 'free' for plan in payload['plans'])


def test_checkout_requires_configuration(client, authenticated_user, monkeypatch):
    token = authenticated_user['token']

    monkeypatch.setenv('STRIPE_SECRET_KEY', '')
    monkeypatch.setenv('STRIPE_PRICE_PREMIUM', '')
    monkeypatch.setenv('DISABLE_STRIPE_AUTO_MOCK', '1')

    response = client.post(
        '/api/billing/checkout-session',
        json={'plan': 'premium'},
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 503
    assert 'Stripe is not fully configured' in response.get_json().get('error', '')


def test_checkout_session_success(client, authenticated_user, monkeypatch):
    token = authenticated_user['token']
    email = authenticated_user['email']

    monkeypatch.setenv('STRIPE_SECRET_KEY', 'sk_test_mock')
    monkeypatch.setenv('STRIPE_PRICE_PREMIUM', 'price_mock')

    import routes.billing as billing_routes

    def fake_checkout_session_create(**kwargs):  # noqa: ANN001
        assert kwargs['customer_email'] == email

        class FakeSession:
            url = 'https://stripe.example/checkout'

        return FakeSession()

    monkeypatch.setattr(
        billing_routes,
        '_create_stripe_checkout_session',
        fake_checkout_session_create
    )

    response = client.post(
        '/api/billing/checkout-session',
        json={'plan': 'premium', 'email': email},
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['url'] == 'https://stripe.example/checkout'


def test_subscription_endpoint_defaults_to_free(client, authenticated_user):
    token = authenticated_user['token']
    response = client.get(
        '/api/billing/subscription',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['plan'] == 'free'
    assert payload['has_subscription'] is False


def test_subscription_endpoint_uses_stripe_fallback(client, authenticated_user, monkeypatch):
    user_id = authenticated_user['id']
    token = authenticated_user['token']

    with app.app_context():
        user = User.query.get(user_id)
        user.subscription_tier = 'premium'
        user.stripe_subscription_id = 'sub_test_123'
        user.stripe_customer_id = 'cus_test_123'
        db.session.commit()

    monkeypatch.setenv('STRIPE_SECRET_KEY', 'sk_test_mock')

    import routes.billing as billing_routes

    def fake_subscription_retrieve(subscription_id):  # noqa: ANN001
        assert subscription_id == 'sub_test_123'
        return {
            'id': 'sub_test_123',
            'status': 'active',
            'customer': 'cus_test_123',
            'items': {
                'data': [
                    {
                        'price': {
                            'unit_amount': 4900,
                            'recurring': {'interval': 'month'}
                        }
                    }
                ]
            }
        }

    monkeypatch.setattr(
        billing_routes,
        '_retrieve_stripe_subscription',
        fake_subscription_retrieve
    )

    response = client.get(
        '/api/billing/subscription',
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['has_subscription'] is True
    assert payload['plan'] == 'premium'
    assert payload['status'] == 'active'


def test_customer_portal_requires_authentication(client):
    response = client.post('/api/billing/customer-portal', json={})
    assert response.status_code == 401


def test_customer_portal_requires_customer_id(client, authenticated_user):
    token = authenticated_user['token']

    response = client.post(
        '/api/billing/customer-portal',
        json={},
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 404
    assert 'No active subscription customer found' in response.get_json().get('error', '')


def test_customer_portal_success(client, authenticated_user, monkeypatch):
    user_id = authenticated_user['id']
    token = authenticated_user['token']

    with app.app_context():
        user = User.query.get(user_id)
        user.stripe_customer_id = 'cus_test_123'
        db.session.commit()

    monkeypatch.setenv('STRIPE_SECRET_KEY', 'sk_test_mock')

    import routes.billing as billing_routes

    def fake_portal_create(**kwargs):  # noqa: ANN001
        assert kwargs['customer'] == 'cus_test_123'

        class FakeSession:
            url = 'https://stripe.example/portal'

        return FakeSession()

    monkeypatch.setattr(
        billing_routes,
        '_create_stripe_billing_portal_session',
        fake_portal_create
    )

    response = client.post(
        '/api/billing/customer-portal',
        json={},
        headers={'Authorization': f'Bearer {token}'}
    )
    assert response.status_code == 200
    assert response.get_json()['url'] == 'https://stripe.example/portal'
