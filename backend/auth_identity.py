import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from flask import current_app

from models import User, db


CLERK_PROVIDER = 'clerk'
CLERK_MANAGED_PASSWORD_MARKER = 'clerk_managed'
DEFAULT_CLERK_API_URL = 'https://api.clerk.com'


class AuthIdentityConflictError(ValueError):
    def __init__(self, existing_user):
        self.existing_user = existing_user
        super().__init__('Email already exists for a different managed account')


class MissingIdentityEmailError(ValueError):
    pass


def _config_value(key):
    value = None
    try:
        value = current_app.config.get(key)
    except RuntimeError:
        value = None

    if value is not None:
        normalized = str(value).strip()
        if normalized:
            return normalized

    env_value = os.getenv(key)
    if env_value is not None:
        normalized = str(env_value).strip()
        if normalized:
            return normalized

    return ''


def _normalize_text(value):
    if isinstance(value, str):
        normalized = value.strip()
        if normalized:
            return normalized
    return ''


def _normalize_email(value):
    return _normalize_text(value).lower()


def _normalize_clerk_api_url():
    configured = _normalize_text(_config_value('CLERK_API_URL'))
    if configured:
        return configured.rstrip('/')
    return DEFAULT_CLERK_API_URL


def _extract_primary_email(payload):
    if not isinstance(payload, dict):
        return ''

    email_addresses = payload.get('email_addresses')
    primary_email_address_id = _normalize_text(payload.get('primary_email_address_id'))
    if isinstance(email_addresses, list):
        for entry in email_addresses:
            if not isinstance(entry, dict):
                continue
            if primary_email_address_id and _normalize_text(entry.get('id')) != primary_email_address_id:
                continue
            address = _normalize_email(entry.get('email_address'))
            if address:
                return address

        for entry in email_addresses:
            if not isinstance(entry, dict):
                continue
            address = _normalize_email(entry.get('email_address'))
            if address:
                return address

    return ''


def _fetch_clerk_user_profile(subject):
    subject = _normalize_text(subject)
    if not subject:
        return {}

    secret_key = _normalize_text(_config_value('CLERK_SECRET_KEY'))
    if not secret_key:
        return {}

    request = Request(
        f'{_normalize_clerk_api_url()}/v1/users/{subject}',
        headers={
            'Authorization': f'Bearer {secret_key}',
            'Content-Type': 'application/json',
        },
        method='GET',
    )

    try:
        with urlopen(request, timeout=10) as response:
            raw_body = response.read().decode('utf-8')
    except (HTTPError, URLError, TimeoutError):
        return {}
    except Exception:
        return {}

    try:
        payload = json.loads(raw_body)
    except json.JSONDecodeError:
        return {}

    if not isinstance(payload, dict):
        return {}

    unsafe_metadata = payload.get('unsafe_metadata')
    if not isinstance(unsafe_metadata, dict):
        unsafe_metadata = {}

    public_metadata = payload.get('public_metadata')
    if not isinstance(public_metadata, dict):
        public_metadata = {}

    return {
        'email': _extract_primary_email(payload),
        'first_name': _normalize_text(payload.get('first_name')),
        'last_name': _normalize_text(payload.get('last_name')),
        'role': _normalize_text(public_metadata.get('role') or unsafe_metadata.get('role')) or None,
        'organization': _normalize_text(
            public_metadata.get('organization') or unsafe_metadata.get('organization')
        ) or None,
    }


def get_external_auth_identity_from_claims(claims):
    if not isinstance(claims, dict):
        return None

    subject = _normalize_text(claims.get('sub'))
    if not subject:
        return None

    return {
        'provider': CLERK_PROVIDER,
        'subject': subject,
    }


def _managed_user_profile_from_claims(claims):
    unsafe_metadata = claims.get('unsafe_metadata')
    if not isinstance(unsafe_metadata, dict):
        unsafe_metadata = {}

    public_metadata = claims.get('public_metadata')
    if not isinstance(public_metadata, dict):
        public_metadata = {}

    profile = {}
    email = _normalize_email(
        claims.get('email') or claims.get('email_address') or claims.get('primary_email_address')
    )
    first_name = _normalize_text(claims.get('given_name') or claims.get('first_name'))
    last_name = _normalize_text(claims.get('family_name') or claims.get('last_name'))
    role = _normalize_text(public_metadata.get('role') or unsafe_metadata.get('role'))
    organization = _normalize_text(public_metadata.get('organization') or unsafe_metadata.get('organization'))

    if email:
        profile['email'] = email
    if first_name:
        profile['first_name'] = first_name
    if last_name:
        profile['last_name'] = last_name
    if role:
        profile['role'] = role
    if organization:
        profile['organization'] = organization

    if not profile.get('email') or not profile.get('first_name') or not profile.get('last_name'):
        remote_profile = _fetch_clerk_user_profile(claims.get('sub'))
        if remote_profile:
            for key in ('email', 'first_name', 'last_name', 'role', 'organization'):
                if not profile.get(key) and remote_profile.get(key):
                    profile[key] = remote_profile[key]

    return profile


def _profile_for_new_user(profile):
    return {
        'email': profile.get('email', ''),
        'first_name': profile.get('first_name') or 'AI',
        'last_name': profile.get('last_name') or 'Learner',
        'role': profile.get('role'),
        'organization': profile.get('organization'),
    }


def _link_user_to_identity(user, identity):
    user.auth_provider = identity['provider']
    user.auth_subject = identity['subject']


def _update_user_from_profile(user, profile):
    if profile.get('email') and user.email != profile['email']:
        user.email = profile['email']
    if profile.get('first_name'):
        user.first_name = profile['first_name']
    if profile.get('last_name'):
        user.last_name = profile['last_name']
    if profile.get('role') is not None:
        user.role = profile.get('role')
    if profile.get('organization') is not None:
        user.organization = profile.get('organization')


def _user_matches_identity(user, identity):
    if user is None or identity is None:
        return False
    return user.auth_provider == identity['provider'] and user.auth_subject == identity['subject']


def _find_user_by_identity(identity):
    if identity is None:
        return None

    return User.query.filter_by(
        auth_provider=identity['provider'],
        auth_subject=identity['subject'],
    ).first()


def resolve_user_from_claims(claims, create_if_missing=False):
    identity = get_external_auth_identity_from_claims(claims)
    if identity is None:
        return None

    profile = _managed_user_profile_from_claims(claims)

    user = _find_user_by_identity(identity)
    if user is not None:
        _update_user_from_profile(user, profile)
        db.session.commit()
        return user

    if not create_if_missing:
        return None

    create_profile = _profile_for_new_user(profile)
    if not create_profile['email']:
        raise MissingIdentityEmailError('Email is required to create user profile')

    existing_user = User.query.filter_by(email=create_profile['email']).first()
    if existing_user is not None:
        if existing_user.auth_provider and not _user_matches_identity(existing_user, identity):
            raise AuthIdentityConflictError(existing_user)

        _link_user_to_identity(existing_user, identity)
        _update_user_from_profile(existing_user, profile)
        if not existing_user.password_hash:
            existing_user.password_hash = CLERK_MANAGED_PASSWORD_MARKER
        db.session.commit()
        return existing_user

    user = User(
        email=create_profile['email'],
        password_hash=CLERK_MANAGED_PASSWORD_MARKER,
        first_name=create_profile['first_name'],
        last_name=create_profile['last_name'],
        role=create_profile.get('role'),
        organization=create_profile.get('organization'),
        auth_provider=identity['provider'],
        auth_subject=identity['subject'],
    )
    db.session.add(user)
    db.session.commit()
    return user


def sync_managed_user(claims, email, first_name, last_name, role=None, organization=None):
    identity = get_external_auth_identity_from_claims(claims)
    if identity is None:
        return None

    normalized_email = _normalize_email(email)
    if not normalized_email:
        raise MissingIdentityEmailError('Email is required to create user profile')

    profile = {
        'email': normalized_email,
        'first_name': _normalize_text(first_name) or 'AI',
        'last_name': _normalize_text(last_name) or 'Learner',
        'role': _normalize_text(role) or None,
        'organization': _normalize_text(organization) or None,
    }

    user = _find_user_by_identity(identity)
    if user is None:
        user = User.query.filter_by(email=normalized_email).first()
        if user is not None and user.auth_provider and not _user_matches_identity(user, identity):
            raise AuthIdentityConflictError(user)

    if user is None:
        user = User(
            email=profile['email'],
            password_hash=CLERK_MANAGED_PASSWORD_MARKER,
            first_name=profile['first_name'],
            last_name=profile['last_name'],
            role=profile['role'],
            organization=profile['organization'],
        )
        db.session.add(user)

    _link_user_to_identity(user, identity)
    _update_user_from_profile(user, profile)
    if not user.password_hash:
        user.password_hash = CLERK_MANAGED_PASSWORD_MARKER
    db.session.commit()
    return user
