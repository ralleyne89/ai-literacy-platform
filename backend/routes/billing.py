import os

import stripe
from flask import Blueprint, jsonify, request, g

from logging_config import get_logger
from models import User, db
from routes import get_supabase_claims, get_supabase_identity, supabase_jwt_required


billing_bp = Blueprint('billing', __name__)
logger = get_logger(__name__)


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


def _serialize_plan(plan_id: str):
    definition, config = _plan_config(plan_id)
    if not definition:
        return None

    configured = config['configured'] if config else True
    price_env = definition.get('stripe_price_env')
    checkout_enabled = configured and (price_env is None or bool(config.get('price_id') or config.get('amount_cents')))

    status_message = None
    if price_env and not configured:
        if not os.getenv('STRIPE_SECRET_KEY'):
            status_message = 'Stripe secret key is missing. Set STRIPE_SECRET_KEY to enable checkout.'
        else:
            status_message = 'Using on-the-fly Stripe price data based on plan amount.'

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


@billing_bp.route('/config', methods=['GET'])
def get_billing_config():
    plans = []
    for plan_id in PLAN_DEFINITIONS.keys():
        serialized = _serialize_plan(plan_id)
        if serialized:
            plans.append(serialized)

    payload = {
        'publishable_key': os.getenv('STRIPE_PUBLISHABLE_KEY', ''),
        'plans': plans,
    }

    return jsonify(payload)


@billing_bp.route('/checkout-session', methods=['POST'])
@supabase_jwt_required(optional=True)
def create_checkout_session():
    request_data = request.get_json() or {}
    plan_id = (request_data.get('plan') or '').lower()

    if not plan_id:
        return jsonify({'error': 'Plan is required'}), 400

    plan_definition, config = _plan_config(plan_id)

    if not plan_definition:
        return jsonify({'error': 'Unknown plan selected'}), 400

    if plan_definition.get('is_free', False):
        return jsonify({'error': 'Free plan does not require checkout'}), 400

    if not config or not config['configured']:
        return jsonify({'error': 'Stripe is not fully configured for this plan'}), 503

    stripe_secret = config['stripe_secret']
    price_id = config['price_id']
    amount_cents = config.get('amount_cents')

    if not stripe_secret:
        logger.error('STRIPE_SECRET_KEY is not set in environment variables')
        return jsonify({
            'error': 'Stripe is not configured',
            'details': 'STRIPE_SECRET_KEY environment variable is missing'
        }), 503

    stripe.api_key = stripe_secret

    user_id = g.get('current_user_id') or get_supabase_identity(optional=True)
    claims = g.get('supabase_claims') or get_supabase_claims(optional=True) or {}

    user = User.query.get(user_id) if user_id else None

    email = (request_data.get('email') or '').strip().lower()
    if not email:
        email = (user.email if user else None) or claims.get('email') or claims.get('user_email')

    if not email:
        return jsonify({'error': 'Email is required to start checkout'}), 400

    if user is None and user_id:
        metadata = claims.get('user_metadata') or {}
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

    frontend_url = _get_frontend_url().rstrip('/')
    success_url = request_data.get('success_url') or f'{frontend_url}/billing?success=true'
    cancel_url = request_data.get('cancel_url') or f'{frontend_url}/billing?canceled=true'

    try:
        mock_mode = os.getenv('STRIPE_MOCK_MODE', '').lower() in ('1', 'true', 'yes')

        if mock_mode:
            logger.info('stripe_checkout_mock_mode', plan_id=plan_id, email=email)
            fake_url = f'{success_url}&mock_checkout=true'
            return jsonify({'url': fake_url})

        line_item = {
            'quantity': 1,
        }

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
                'recurring': {
                    'interval': plan_definition.get('billing_interval', 'month')
                }
            }

        session = stripe.checkout.Session.create(
            mode='subscription',
            payment_method_types=['card'],
            line_items=[line_item],
            customer_email=email,
            success_url=f'{success_url}&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=cancel_url,
            metadata={
                'user_id': user.id if user else '',
                'plan_id': plan_id,
                'email': email,
            }
        )
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
