import os
from typing import Optional

import stripe
from flask import Blueprint, jsonify, request, g
from stripe import Subscription as StripeSubscription
from stripe.billing_portal import Session as StripeBillingPortalSession
from stripe.checkout import Session as StripeCheckoutSession

from logging_config import get_logger
from models import User, db
from routes import get_supabase_claims, get_supabase_identity, supabase_jwt_required


billing_bp = Blueprint('billing', __name__)
logger = get_logger(__name__)


def _is_truthy(value):
    if value is None:
        return False
    return str(value).strip().lower() in ('1', 'true', 'yes', 'on')


def _mock_mode_enabled():
    if _is_truthy(os.getenv('STRIPE_MOCK_MODE', '')):
        return True

    if _is_truthy(os.getenv('DISABLE_STRIPE_AUTO_MOCK', '')):
        return False

    secret_missing = not os.getenv('STRIPE_SECRET_KEY')
    if not secret_missing:
        return False

    env_hint = (os.getenv('FLASK_ENV') or os.getenv('ENV') or '').lower()
    return env_hint not in ('production', 'prod')


PLAN_DEFINITIONS = {
    'free': {
        'name': 'Free',
        'amount_cents': 0,
        'currency': 'usd',
        'description': 'Perfect for individuals exploring LitmusAI.',
        'features': [
            'Access to assessments',
            'Foundational training modules',
            'Basic progress tracking'
        ],
        'cta': 'You are on this plan',
        'is_free': True,
    },
    'premium': {
        'name': 'Premium',
        'amount_cents': 4900,
        'currency': 'usd',
        'description': 'Unlock premium training, certifications, and analytics.',
        'features': [
            'All Free features',
            'Premium training catalog',
            'Certification exam access',
            'Email support'
        ],
        'cta': 'Upgrade to Premium',
        'stripe_price_env': 'STRIPE_PRICE_PREMIUM',
        'billing_interval': 'month',
    },
    'enterprise': {
        'name': 'Enterprise',
        'amount_cents': 9900,
        'currency': 'usd',
        'description': 'Tailored enablement for teams and departments.',
        'features': [
            'Custom learning paths',
            'Dedicated customer success',
            'SSO & advanced reporting',
            'Licensing & partnerships'
        ],
        'cta': 'Upgrade to Enterprise',
        'stripe_price_env': 'STRIPE_PRICE_ENTERPRISE',
        'billing_interval': 'month',
    },
}

PLAN_ALIAS = {
    'professional': 'premium',
}


def _retrieve_stripe_subscription(subscription_id: str):
    return StripeSubscription.retrieve(subscription_id)


def _create_stripe_checkout_session(**kwargs):
    return StripeCheckoutSession.create(**kwargs)


def _create_stripe_billing_portal_session(**kwargs):
    return StripeBillingPortalSession.create(**kwargs)


def _get_frontend_url() -> str:
    return os.getenv('FRONTEND_URL', 'http://localhost:5173')


def _plan_config(plan_id: str):
    plan = PLAN_DEFINITIONS.get(plan_id)
    if not plan:
        return None, None

    price_env = plan.get('stripe_price_env')
    price_id = os.getenv(price_env) if price_env else None

    stripe_secret = os.getenv('STRIPE_SECRET_KEY')
    stripe_configured = bool(stripe_secret)

    amount_cents = plan.get('amount_cents')
    configured = stripe_configured and (amount_cents is not None or bool(price_id))

    return plan, {
        'price_id': price_id,
        'configured': configured,
        'stripe_secret': stripe_secret,
        'amount_cents': amount_cents,
    }


def _normalize_plan_id(value: Optional[str]) -> str:
    normalized = (value or 'free').strip().lower()
    normalized = PLAN_ALIAS.get(normalized, normalized)
    return normalized if normalized in PLAN_DEFINITIONS else 'free'


def _plan_id_from_amount(amount_cents: Optional[int]) -> str:
    if amount_cents is None:
        return 'free'
    for plan_id, definition in PLAN_DEFINITIONS.items():
        if definition.get('amount_cents') == amount_cents and not definition.get('is_free'):
            return plan_id
    return 'free'


def _serialize_plan(plan_id: str, mock_mode: bool):
    definition, config = _plan_config(plan_id)
    if not definition:
        return None

    configured = config['configured'] if config else True
    price_env = definition.get('stripe_price_env')
    checkout_enabled = (configured or mock_mode) and (
        price_env is None or bool((config or {}).get('price_id') or (config or {}).get('amount_cents'))
    )

    status_message = None
    if price_env and not configured:
        if mock_mode:
            status_message = 'Stripe not configured. Using sandbox checkout flow.'
        elif not os.getenv('STRIPE_SECRET_KEY'):
            status_message = 'Stripe secret key is missing. Set STRIPE_SECRET_KEY to enable checkout.'
        else:
            status_message = 'Using on-the-fly Stripe price data based on plan amount.'
    elif mock_mode and not configured:
        status_message = 'Stripe not configured. Running in sandbox checkout mode.'

    amount = definition.get('amount_cents')
    interval = definition.get('billing_interval', 'month')

    return {
        'id': plan_id,
        'name': definition['name'],
        'description': definition['description'],
        'amount': (amount / 100) if amount is not None else None,
        'currency': definition.get('currency', 'usd'),
        'billing_interval': interval,
        'features': definition.get('features', []),
        'cta': definition.get('cta', 'Select plan'),
        'is_free': definition.get('is_free', False),
        'configured': configured,
        'checkout_enabled': checkout_enabled,
        'status_message': status_message,
    }


def _ensure_local_user(user_id: str, claims: dict) -> User:
    user = User.query.get(user_id)
    if user:
        return user

    email = (claims.get('email') or claims.get('user_email') or '').strip().lower()
    metadata = claims.get('user_metadata') or {}
    if not email:
        raise ValueError('Email is required to create user profile')

    user = User(
        id=user_id,
        email=email,
        password_hash='supabase_managed',
        first_name=metadata.get('first_name') or 'AI',
        last_name=metadata.get('last_name') or 'Learner',
        role=metadata.get('role'),
        organization=metadata.get('organization')
    )
    db.session.add(user)
    db.session.commit()
    return user


def _subscription_payload_from_user(user: User):
    plan_id = _normalize_plan_id(user.subscription_tier)
    definition = PLAN_DEFINITIONS.get(plan_id, PLAN_DEFINITIONS['free'])
    amount_cents = definition.get('amount_cents') or 0
    interval = definition.get('billing_interval', 'month')
    status = user.subscription_status

    has_subscription = plan_id != 'free' and bool(
        user.stripe_subscription_id or
        user.stripe_customer_id or
        status
    )

    return {
        'has_subscription': has_subscription,
        'plan': plan_id,
        'status': status if has_subscription else None,
        'amount': round(amount_cents / 100, 2),
        'interval': interval,
        'customer_id': user.stripe_customer_id,
        'subscription_id': user.stripe_subscription_id,
    }


def _subscription_payload_from_stripe(user: User, stripe_subscription):
    item = (stripe_subscription.get('items', {}).get('data') or [{}])[0]
    price = item.get('price') or {}
    recurring = price.get('recurring') or {}
    amount_cents = price.get('unit_amount')

    plan_id = _plan_id_from_amount(amount_cents)
    interval = recurring.get('interval') or 'month'
    status = stripe_subscription.get('status')

    user.subscription_status = status
    user.subscription_tier = plan_id
    user.stripe_subscription_id = stripe_subscription.get('id') or user.stripe_subscription_id
    user.stripe_customer_id = stripe_subscription.get('customer') or user.stripe_customer_id
    db.session.commit()

    return {
        'has_subscription': True,
        'plan': plan_id,
        'status': status,
        'amount': round((amount_cents or 0) / 100, 2),
        'interval': interval,
        'customer_id': user.stripe_customer_id,
        'subscription_id': user.stripe_subscription_id,
    }


@billing_bp.route('/config', methods=['GET'])
def get_billing_config():
    plans = []
    mock_mode = _mock_mode_enabled()
    for plan_id in PLAN_DEFINITIONS.keys():
        serialized = _serialize_plan(plan_id, mock_mode)
        if serialized:
            plans.append(serialized)

    payload = {
        'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY', ''),
        'plans': plans,
        'mock_mode': mock_mode,
    }

    return jsonify(payload)


@billing_bp.route('/subscription', methods=['GET'])
@supabase_jwt_required()
def get_subscription():
    user_id = g.get('current_user_id') or get_supabase_identity()
    claims = g.get('supabase_claims') or get_supabase_claims(optional=True) or {}

    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        user = _ensure_local_user(user_id, claims)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    mock_mode = _mock_mode_enabled()
    stripe_secret = os.getenv('STRIPE_SECRET_KEY')
    if (
        not mock_mode and
        stripe_secret and
        user.stripe_subscription_id
    ):
        try:
            stripe.api_key = stripe_secret
            stripe_subscription = _retrieve_stripe_subscription(user.stripe_subscription_id)
            payload = _subscription_payload_from_stripe(user, stripe_subscription)
            return jsonify(payload), 200
        except Exception as exc:  # pylint: disable=broad-except
            logger.warning(
                'stripe_subscription_fetch_failed',
                error=str(exc),
                user_id=user_id,
                subscription_id=user.stripe_subscription_id
            )

    payload = _subscription_payload_from_user(user)
    return jsonify(payload), 200


@billing_bp.route('/checkout-session', methods=['POST'])
@supabase_jwt_required(optional=True)
def create_checkout_session():
    request_data = request.get_json() or {}
    plan_id = _normalize_plan_id(request_data.get('plan'))

    if not plan_id:
        return jsonify({'error': 'Plan is required'}), 400

    plan_definition, config = _plan_config(plan_id)
    mock_mode = _mock_mode_enabled()

    if not plan_definition:
        return jsonify({'error': 'Unknown plan selected'}), 400

    if plan_definition.get('is_free', False):
        return jsonify({'error': 'Free plan does not require checkout'}), 400

    if (not config or not config['configured']) and not mock_mode:
        return jsonify({'error': 'Stripe is not fully configured for this plan'}), 503

    config = config or {}
    stripe_secret = config.get('stripe_secret')
    price_id = config.get('price_id')
    amount_cents = config.get('amount_cents')

    if not mock_mode and not stripe_secret:
        logger.error('STRIPE_SECRET_KEY is not set in environment variables')
        return jsonify({
            'error': 'Stripe is not configured',
            'details': 'STRIPE_SECRET_KEY environment variable is missing'
        }), 503

    user_id = g.get('current_user_id') or get_supabase_identity(optional=True)
    claims = g.get('supabase_claims') or get_supabase_claims(optional=True) or {}
    user = User.query.get(user_id) if user_id else None

    email = (request_data.get('email') or '').strip().lower()
    if not email:
        email = (user.email if user else None) or claims.get('email') or claims.get('user_email')

    if not email:
        return jsonify({'error': 'Email is required to start checkout'}), 400

    if user is None and user_id:
        try:
            user = _ensure_local_user(user_id, claims)
        except ValueError as exc:
            return jsonify({'error': str(exc)}), 400

    frontend_url = _get_frontend_url().rstrip('/')
    success_url = request_data.get('success_url') or f'{frontend_url}/billing?success=true'
    cancel_url = request_data.get('cancel_url') or f'{frontend_url}/billing?canceled=true'

    try:
        if mock_mode:
            logger.info('stripe_checkout_mock_mode', plan_id=plan_id, email=email)
            fake_url = f'{success_url}&mock_checkout=true'
            return jsonify({'url': fake_url})

        stripe.api_key = stripe_secret

        line_item = {'quantity': 1}
        if price_id:
            line_item['price'] = price_id
        else:
            line_item['price_data'] = {
                'currency': plan_definition.get('currency', 'usd'),
                'product_data': {
                    'name': plan_definition['name'],
                    'description': plan_definition.get('description', ''),
                },
                'unit_amount': amount_cents,
                'recurring': {'interval': plan_definition.get('billing_interval', 'month')}
            }

        checkout_kwargs = {
            'mode': 'subscription',
            'payment_method_types': ['card'],
            'line_items': [line_item],
            'success_url': f'{success_url}&session_id={{CHECKOUT_SESSION_ID}}',
            'cancel_url': cancel_url,
            'metadata': {
                'user_id': user.id if user else '',
                'plan_id': plan_id,
                'email': email,
            }
        }

        if user and user.stripe_customer_id:
            checkout_kwargs['customer'] = user.stripe_customer_id
        else:
            checkout_kwargs['customer_email'] = email

        session = _create_stripe_checkout_session(**checkout_kwargs)
    except Exception as exc:  # pylint: disable=broad-except
        error_message = getattr(getattr(exc, 'user_message', None), 'strip', lambda: None)()
        error_message = error_message or getattr(exc, 'user_message', None) or str(exc)
        logger.exception(
            'stripe_checkout_failed',
            error=str(exc),
            plan_id=plan_id,
            user_id=user_id,
        )
        return jsonify({
            'error': 'Unable to start checkout with Stripe',
            'details': error_message,
            'hint': 'Verify STRIPE_SECRET_KEY and network connectivity. If using test mode, ensure the key starts with sk_test_.',
        }), 500

    return jsonify({'url': session.url})


@billing_bp.route('/customer-portal', methods=['POST'])
@supabase_jwt_required()
def create_customer_portal():
    user_id = g.get('current_user_id') or get_supabase_identity()
    claims = g.get('supabase_claims') or get_supabase_claims(optional=True) or {}

    if not user_id:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        user = _ensure_local_user(user_id, claims)
    except ValueError as exc:
        return jsonify({'error': str(exc)}), 400

    if not user.stripe_customer_id:
        return jsonify({'error': 'No active subscription customer found'}), 404

    request_data = request.get_json(silent=True) or {}
    frontend_url = _get_frontend_url().rstrip('/')
    return_url = request_data.get('return_url') or f'{frontend_url}/billing'

    if not str(return_url).startswith(frontend_url):
        return_url = f'{frontend_url}/billing'

    if _mock_mode_enabled():
        return jsonify({'url': f'{return_url}?portal=mock'}), 200

    stripe_secret = os.getenv('STRIPE_SECRET_KEY')
    if not stripe_secret:
        return jsonify({'error': 'Stripe is not configured'}), 503

    try:
        stripe.api_key = stripe_secret
        session = _create_stripe_billing_portal_session(
            customer=user.stripe_customer_id,
            return_url=return_url
        )
        return jsonify({'url': session.url}), 200
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception(
            'stripe_customer_portal_failed',
            error=str(exc),
            user_id=user_id,
            customer_id=user.stripe_customer_id,
        )
        return jsonify({'error': 'Unable to open customer portal', 'details': str(exc)}), 500
