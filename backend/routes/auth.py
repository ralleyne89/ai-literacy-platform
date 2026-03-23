from flask import Blueprint, g, jsonify, request

from auth_identity import (
    AuthIdentityConflictError,
    MissingIdentityEmailError,
    resolve_user_from_claims,
    sync_managed_user,
)
from logging_config import get_logger
from models import User, db
from routes import (
    get_supabase_claims,
    get_supabase_identity,
    supabase_jwt_required,
)


auth_bp = Blueprint('auth', __name__)
logger = get_logger(__name__)
CLERK_ONLY_AUTH_CODE = 'CLERK_ONLY_AUTH'


def _auth_preflight_response():
    return '', 204


def _build_user_payload(user):
    return {
        'id': user.id,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'organization': user.organization,
        'subscription_tier': user.subscription_tier,
        'created_at': user.created_at.isoformat() if user.created_at else None,
    }


def _get_authenticated_user():
    user_id = g.get('current_user_id') or get_supabase_identity()
    if not user_id:
        return None
    return User.query.get(user_id)


def _upsert_authenticated_user():
    claims = g.get('current_user_claims') or get_supabase_claims()
    if not claims:
        return None
    return resolve_user_from_claims(claims, create_if_missing=True)


def _deprecated_auth_response(endpoint):
    return jsonify({
        'error': f'{endpoint} is no longer supported. Sign in through Clerk on the frontend.',
        'code': CLERK_ONLY_AUTH_CODE,
    }), 410


@auth_bp.route('/register', methods=['POST'])
def register():
    return _deprecated_auth_response('/api/auth/register')


@auth_bp.route('/login', methods=['POST'])
def login():
    return _deprecated_auth_response('/api/auth/login')


@auth_bp.route('/login', methods=['OPTIONS'])
def login_options():
    return _auth_preflight_response()


@auth_bp.route('/exchange', methods=['POST'])
def exchange():
    return _deprecated_auth_response('/api/auth/exchange')


@auth_bp.route('/profile', methods=['GET'])
@supabase_jwt_required()
def get_profile():
    try:
        user = _get_authenticated_user() or _upsert_authenticated_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': _build_user_payload(user)}), 200
    except AuthIdentityConflictError as exc:
        db.session.rollback()
        return jsonify({
            'error': str(exc),
            'code': 'EMAIL_ALREADY_EXISTS_MANAGED_ACCOUNT',
            'existing_user_id': exc.existing_user.id,
        }), 409
    except MissingIdentityEmailError as exc:
        db.session.rollback()
        return jsonify({'error': str(exc), 'code': 'CLERK_EMAIL_REQUIRED'}), 400
    except Exception as exc:
        db.session.rollback()
        logger.exception('auth_profile_load_failed', error=str(exc))
        return jsonify({'error': 'Failed to get profile', 'details': str(exc)}), 500


@auth_bp.route('/profile', methods=['OPTIONS'])
def profile_options():
    return _auth_preflight_response()


@auth_bp.route('/profile', methods=['PUT'])
@supabase_jwt_required()
def update_profile():
    try:
        user = _get_authenticated_user() or _upsert_authenticated_user()
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid request payload'}), 400

        if 'first_name' in data and isinstance(data['first_name'], str):
            user.first_name = data['first_name'].strip() or user.first_name
        if 'last_name' in data and isinstance(data['last_name'], str):
            user.last_name = data['last_name'].strip() or user.last_name
        if 'role' in data:
            user.role = data['role'].strip() if isinstance(data['role'], str) and data['role'].strip() else None
        if 'organization' in data:
            user.organization = (
                data['organization'].strip()
                if isinstance(data['organization'], str) and data['organization'].strip()
                else None
            )

        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': _build_user_payload(user),
        }), 200
    except Exception as exc:
        db.session.rollback()
        logger.exception('auth_profile_update_failed', error=str(exc))
        return jsonify({'error': 'Failed to update profile', 'details': str(exc)}), 500


@auth_bp.route('/sync', methods=['POST'])
@supabase_jwt_required()
def sync_user():
    try:
        claims = g.get('current_user_claims') or get_supabase_claims()
        payload = request.get_json(silent=True) or {}

        email = payload.get('email') or claims.get('email')
        first_name = payload.get('first_name') or claims.get('given_name') or claims.get('first_name')
        last_name = payload.get('last_name') or claims.get('family_name') or claims.get('last_name')
        role = payload.get('role')
        organization = payload.get('organization')

        user = sync_managed_user(
            claims,
            email=email,
            first_name=first_name,
            last_name=last_name,
            role=role,
            organization=organization,
        )

        return jsonify({
            'message': 'User synced successfully',
            'user': _build_user_payload(user),
        }), 200
    except AuthIdentityConflictError as exc:
        db.session.rollback()
        return jsonify({
            'error': str(exc),
            'code': 'EMAIL_ALREADY_EXISTS_MANAGED_ACCOUNT',
            'existing_user_id': exc.existing_user.id,
        }), 409
    except MissingIdentityEmailError as exc:
        db.session.rollback()
        return jsonify({'error': str(exc), 'code': 'CLERK_EMAIL_REQUIRED'}), 400
    except Exception as exc:
        db.session.rollback()
        logger.exception('auth_sync_failed', error=str(exc))
        return jsonify({'error': 'Failed to sync user', 'details': str(exc)}), 500
