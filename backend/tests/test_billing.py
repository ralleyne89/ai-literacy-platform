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

    token = jwt.encode({'sub': user.id}, app.config['SUPABASE_JWT_SECRET'], algorithm='HS256')
    return user, token


def test_billing_config_endpoint(client, monkeypatch):
    monkeypatch.setenv('STRIPE_PRICE_PREMIUM', '')
    response = client.get('/api/billing/config')
    assert response.status_code == 200
    payload = response.get_json()
    assert isinstance(payload.get('plans'), list)
    assert any(plan['id'] == 'free' for plan in payload['plans'])


def test_checkout_requires_configuration(client, authenticated_user, monkeypatch):
    _, token = authenticated_user

    monkeypatch.setenv('STRIPE_SECRET_KEY', '')
    monkeypatch.setenv('STRIPE_PRICE_PREMIUM', '')

    response = client.post(
        '/api/billing/checkout-session',
        json={'plan': 'premium'},
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 503
    assert 'Stripe is not fully configured' in response.get_json().get('error', '')


def test_checkout_session_success(client, authenticated_user, monkeypatch):
    user, token = authenticated_user

    monkeypatch.setenv('STRIPE_SECRET_KEY', 'sk_test_mock')
    monkeypatch.setenv('STRIPE_PRICE_PREMIUM', 'price_mock')

    import routes.billing as billing_routes

    def fake_checkout_session_create(**kwargs):  # noqa: ANN001
        assert kwargs['customer_email'] == user.email
        class FakeSession:
            url = 'https://stripe.example/checkout'
        return FakeSession()

    monkeypatch.setattr(billing_routes.stripe.checkout.Session, 'create', fake_checkout_session_create)

    response = client.post(
        '/api/billing/checkout-session',
        json={'plan': 'premium', 'email': user.email},
        headers={'Authorization': f'Bearer {token}'}
    )

    assert response.status_code == 200
    payload = response.get_json()
    assert payload['url'] == 'https://stripe.example/checkout'
