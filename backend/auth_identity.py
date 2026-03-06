import os
import uuid

from flask import current_app

from models import User, db


AUTH0_PROVIDER = 'auth0'
SUPABASE_PROVIDER = 'supabase'


class AuthIdentityConflictError(ValueError):
    def __init__(self, existing_user):
        self.existing_user = existing_user
        super().__init__('Email already exists for a legacy account')


class MissingIdentityEmailError(ValueError):
    pass


def _config_value(key):
    value = None
    try:
        value = current_app.config.get(key)
    except RuntimeError:
        value = None

    if value is None:
        value = os.getenv(key)

    return str(value).strip() if value is not None else ''


def _normalize_auth0_domain():
    raw_domain = _config_value('AUTH0_DOMAIN')
    if not raw_domain:
        return ''

    normalized = raw_domain.rstrip('/')
    if normalized.startswith(('http://', 'https://')):
        return normalized

    return f'https://{normalized}'


def _normalize_text(value):
    if isinstance(value, str):
        normalized = value.strip()
        if normalized:
            return normalized

    return ''


def _normalize_email(value):
    return _normalize_text(value).lower()


def _managed_password_marker(provider):
    if provider == AUTH0_PROVIDER:
        return 'auth0_managed'
    return 'supabase_managed'


def _provider_scoped_legacy_user_id(provider, subject):
    if not provider or not subject:
        return None

    return str(uuid.uuid5(uuid.NAMESPACE_URL, f'{provider}:{subject}'))


def _is_backend_session_claims(claims):
    if not isinstance(claims, dict):
        return False

    token_type = _normalize_text(claims.get('type')).lower()
    return token_type in {'access', 'refresh'} and bool(claims.get('jti'))


def _legacy_user_id_from_subject(raw_user_id):
    if not isinstance(raw_user_id, str):
        return None

    user_id = raw_user_id.strip()
    if not user_id:
        return None

    if len(user_id) <= 36:
        return user_id

    if '|' in user_id:
        candidate = user_id.split('|', 1)[1].strip()
        if len(candidate) <= 36:
            return candidate

    return str(uuid.uuid5(uuid.NAMESPACE_DNS, user_id))


def get_external_auth_identity_from_claims(claims):
    if not isinstance(claims, dict):
        return None

    subject = _normalize_text(claims.get('sub') or claims.get('user_id') or claims.get('id'))
    if not subject:
        return None

    issuer = _normalize_text(claims.get('iss')).rstrip('/')
    auth0_domain = _normalize_auth0_domain().rstrip('/')
    provider = SUPABASE_PROVIDER

    if auth0_domain and issuer == auth0_domain:
        provider = AUTH0_PROVIDER
    elif 'auth0' in issuer:
        provider = AUTH0_PROVIDER
    elif '|' in subject and not _is_backend_session_claims(claims):
        provider = AUTH0_PROVIDER

    return {
        'provider': provider,
        'subject': subject,
    }


def _managed_user_profile_from_claims(claims):
    user_metadata = claims.get('user_metadata')
    if not isinstance(user_metadata, dict):
        user_metadata = {}

    email = _normalize_email(
        claims.get('email')
        or claims.get('user_email')
        or user_metadata.get('email')
    )
    first_name = _normalize_text(
        claims.get('given_name')
        or user_metadata.get('first_name')
        or claims.get('name')
    )
    last_name = _normalize_text(
        claims.get('family_name')
        or user_metadata.get('last_name')
    )

    if first_name and not last_name:
        full_name = _normalize_text(claims.get('name'))
        if ' ' in full_name:
            parts = full_name.split()
            first_name = parts[0]
            last_name = ' '.join(parts[1:])

    return {
        'email': email,
        'first_name': first_name or 'AI',
        'last_name': last_name or 'Learner',
        'role': _normalize_text(claims.get('role') or user_metadata.get('role')) or None,
        'organization': _normalize_text(claims.get('organization') or user_metadata.get('organization')) or None,
    }


def _link_user_to_identity(user, identity):
    user.auth_provider = identity['provider']
    user.auth_subject = identity['subject']


def _user_matches_identity(user, identity):
    if user is None or identity is None:
        return False

    return (
        user.auth_provider == identity['provider']
        and user.auth_subject == identity['subject']
    )


def _find_user_by_identity(identity):
    if identity is None:
        return None

    return User.query.filter_by(
        auth_provider=identity['provider'],
        auth_subject=identity['subject'],
    ).first()


def _find_legacy_user(identity):
    if identity is None:
        return None

    candidate_ids = []

    provider_scoped_id = _provider_scoped_legacy_user_id(
        identity['provider'],
        identity['subject'],
    )
    if provider_scoped_id:
        candidate_ids.append(provider_scoped_id)

    legacy_user_id = _legacy_user_id_from_subject(identity['subject'])
    if legacy_user_id and legacy_user_id not in candidate_ids:
        candidate_ids.append(legacy_user_id)

    for candidate_id in candidate_ids:
        user = User.query.get(candidate_id)
        if user is not None:
            return user

    return None


def resolve_user_from_claims(claims, create_if_missing=False):
    identity = get_external_auth_identity_from_claims(claims)
    if identity is None:
        return None

    if _is_backend_session_claims(claims):
        direct_user = User.query.get(identity['subject'])
        if direct_user is not None:
            return direct_user

    user = _find_user_by_identity(identity)
    if user is not None:
        return user

    legacy_user = _find_legacy_user(identity)
    if legacy_user is not None:
        if not _user_matches_identity(legacy_user, identity):
            _link_user_to_identity(legacy_user, identity)
            db.session.commit()
        return legacy_user

    if not create_if_missing or _is_backend_session_claims(claims):
        return None

    profile = _managed_user_profile_from_claims(claims)
    if not profile['email']:
        raise MissingIdentityEmailError('Email is required to create user profile')

    existing_user = User.query.filter_by(email=profile['email']).first()
    if existing_user is not None:
        raise AuthIdentityConflictError(existing_user)

    user = User(
        email=profile['email'],
        password_hash=_managed_password_marker(identity['provider']),
        first_name=profile['first_name'],
        last_name=profile['last_name'],
        role=profile['role'],
        organization=profile['organization'],
        auth_provider=identity['provider'],
        auth_subject=identity['subject'],
    )
    db.session.add(user)
    db.session.commit()
    return user


def sync_managed_user(claims, email, first_name, last_name, role=None, organization=None):
    identity = get_external_auth_identity_from_claims(claims)
    if identity is None or _is_backend_session_claims(claims):
        return None

    normalized_email = _normalize_email(email)
    if not normalized_email:
        raise MissingIdentityEmailError('Email is required to sync user')

    user = _find_user_by_identity(identity)
    if user is None:
        user = _find_legacy_user(identity)

    if user is None:
        existing_user = User.query.filter_by(email=normalized_email).first()
        if existing_user is not None:
            raise AuthIdentityConflictError(existing_user)

        user = User(
            email=normalized_email,
            password_hash=_managed_password_marker(identity['provider']),
            first_name=_normalize_text(first_name) or 'AI',
            last_name=_normalize_text(last_name) or 'Learner',
            role=_normalize_text(role) or None,
            organization=_normalize_text(organization) or None,
        )
        _link_user_to_identity(user, identity)
        db.session.add(user)
    else:
        conflicting_user = User.query.filter_by(email=normalized_email).first()
        if conflicting_user is not None and conflicting_user.id != user.id:
            raise AuthIdentityConflictError(conflicting_user)

        _link_user_to_identity(user, identity)
        user.email = normalized_email
        user.first_name = _normalize_text(first_name) or user.first_name or 'AI'
        user.last_name = _normalize_text(last_name) or user.last_name or 'Learner'
        if role is not None:
            user.role = _normalize_text(role) or None
        if organization is not None:
            user.organization = _normalize_text(organization) or None

    db.session.commit()
    return user
