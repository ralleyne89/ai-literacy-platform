import uuid

from models import User, db


SUPABASE_PROVIDER = 'supabase'
DEMO_PROVIDER = 'demo'
SUPABASE_MANAGED_PASSWORD_MARKER = 'supabase_managed'


class AuthIdentityConflictError(ValueError):
    def __init__(self, existing_user):
        self.existing_user = existing_user
        super().__init__('Email already exists for a different managed account')


class MissingIdentityEmailError(ValueError):
    pass


def _normalize_text(value):
    if isinstance(value, str):
        normalized = value.strip()
        if normalized:
            return normalized
    return ''


def _normalize_email(value):
    return _normalize_text(value).lower()


def _metadata_from_claims(claims, key):
    value = claims.get(key)
    return value if isinstance(value, dict) else {}


def _split_display_name(name):
    normalized = _normalize_text(name)
    if not normalized:
        return '', ''

    parts = normalized.split()
    if len(parts) == 1:
        return parts[0], ''

    return parts[0], ' '.join(parts[1:])


def _is_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except (TypeError, ValueError):
        return False


def get_external_auth_identity_from_claims(claims):
    if not isinstance(claims, dict):
        return None

    subject = _normalize_text(claims.get('sub'))
    if not subject:
        return None

    return {
        'provider': SUPABASE_PROVIDER,
        'subject': subject,
    }


def _managed_user_profile_from_claims(claims):
    user_metadata = _metadata_from_claims(claims, 'user_metadata')
    app_metadata = _metadata_from_claims(claims, 'app_metadata')

    profile = {}
    email = _normalize_email(
        claims.get('email') or user_metadata.get('email') or claims.get('phone')
    )
    first_name = _normalize_text(
        user_metadata.get('first_name') or
        user_metadata.get('given_name') or
        claims.get('given_name') or
        claims.get('first_name')
    )
    last_name = _normalize_text(
        user_metadata.get('last_name') or
        user_metadata.get('family_name') or
        claims.get('family_name') or
        claims.get('last_name')
    )

    if not first_name or not last_name:
        split_first_name, split_last_name = _split_display_name(
            user_metadata.get('full_name') or user_metadata.get('name') or claims.get('name')
        )
        first_name = first_name or split_first_name
        last_name = last_name or split_last_name

    role = _normalize_text(app_metadata.get('app_role') or user_metadata.get('role'))
    organization = _normalize_text(
        app_metadata.get('organization') or user_metadata.get('organization')
    )

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


def _can_relink_user_to_identity(user, identity):
    if user is None or identity is None:
        return False
    if not user.auth_provider:
        return True
    if _user_matches_identity(user, identity):
        return True
    return user.auth_provider == DEMO_PROVIDER and identity['provider'] == SUPABASE_PROVIDER


def _find_user_by_identity(identity):
    if identity is None:
        return None

    return User.query.filter_by(
        auth_provider=identity['provider'],
        auth_subject=identity['subject'],
    ).first()


def _find_user_by_subject_id(identity):
    if identity is None or not _is_uuid(identity['subject']):
        return None

    return User.query.get(identity['subject'])


def _user_id_for_new_identity(identity):
    if identity is not None and _is_uuid(identity['subject']):
        return identity['subject']
    return None


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

    existing_user = _find_user_by_subject_id(identity) or User.query.filter_by(email=create_profile['email']).first()
    if existing_user is not None:
        if not _can_relink_user_to_identity(existing_user, identity):
            raise AuthIdentityConflictError(existing_user)

        _link_user_to_identity(existing_user, identity)
        _update_user_from_profile(existing_user, profile)
        if not existing_user.password_hash:
            existing_user.password_hash = SUPABASE_MANAGED_PASSWORD_MARKER
        db.session.commit()
        return existing_user

    new_user_kwargs = {}
    new_user_id = _user_id_for_new_identity(identity)
    if new_user_id:
        new_user_kwargs['id'] = new_user_id

    user = User(
        **new_user_kwargs,
        email=create_profile['email'],
        password_hash=SUPABASE_MANAGED_PASSWORD_MARKER,
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
        user = _find_user_by_subject_id(identity)
        if user is not None and not _can_relink_user_to_identity(user, identity):
            raise AuthIdentityConflictError(user)

    if user is None:
        user = User.query.filter_by(email=normalized_email).first()
        if user is not None and not _can_relink_user_to_identity(user, identity):
            raise AuthIdentityConflictError(user)

    if user is None:
        new_user_kwargs = {}
        new_user_id = _user_id_for_new_identity(identity)
        if new_user_id:
            new_user_kwargs['id'] = new_user_id

        user = User(
            **new_user_kwargs,
            email=profile['email'],
            password_hash=SUPABASE_MANAGED_PASSWORD_MARKER,
            first_name=profile['first_name'],
            last_name=profile['last_name'],
            role=profile['role'],
            organization=profile['organization'],
        )
        db.session.add(user)

    _link_user_to_identity(user, identity)
    _update_user_from_profile(user, profile)
    if not user.password_hash:
        user.password_hash = SUPABASE_MANAGED_PASSWORD_MARKER
    db.session.commit()
    return user
