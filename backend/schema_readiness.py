import os
import sys
from typing import Iterable, Set

from logging_config import get_logger
from sqlalchemy import inspect
from sqlalchemy.exc import SQLAlchemyError


logger = get_logger(__name__)

SIGNUP_REQUIRED_USER_COLUMNS = (
    'email',
    'password_hash',
    'first_name',
    'last_name',
    'subscription_tier',
)
PASSWORD_HASH_COLUMN = 'password_hash'
PASSWORD_HASH_MIN_LENGTH = 60


class SchemaReadinessError(RuntimeError):
    """Raised when signup-critical database schema is missing or drifted."""


def _truthy(value: str) -> bool:
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


def should_enforce_schema_readiness() -> bool:
    """Determine whether startup schema validation should run."""
    if _truthy(os.getenv('SKIP_SCHEMA_READINESS_CHECK', '')):
        return False

    # Tests import app early before fixtures can reconfigure database state.
    if os.getenv('PYTEST_CURRENT_TEST'):
        return False

    if os.getenv('FLASK_RUN_FROM_CLI') == 'true':
        cli_args = set(sys.argv[1:])

        # Skip validation for migration and one-off maintenance commands.
        if 'db' in cli_args or 'init-db' in cli_args:
            return False

    return True


def _missing_required_columns(existing_columns: Iterable[str]) -> Set[str]:
    existing = {name.lower() for name in existing_columns}
    return {
        column_name
        for column_name in SIGNUP_REQUIRED_USER_COLUMNS
        if column_name.lower() not in existing
    }


def _validate_password_hash_column(columns):
    password_hash_column = None
    for column in columns:
        if column.get('name', '').lower() == PASSWORD_HASH_COLUMN:
            password_hash_column = column
            break

    if password_hash_column is None:
        raise SchemaReadinessError(
            "Signup schema check failed: missing required 'password_hash' column."
        )

    if password_hash_column.get('nullable') is True:
        raise SchemaReadinessError(
            'Signup schema check failed: password_hash column is nullable; '
            'backend authentication requires non-null values.'
        )

    column_type = password_hash_column.get('type')
    max_length = getattr(column_type, 'length', None)
    if max_length is not None and max_length < PASSWORD_HASH_MIN_LENGTH:
        raise SchemaReadinessError(
            'Signup schema check failed: password_hash column is too short '
            f'({max_length}). At least {PASSWORD_HASH_MIN_LENGTH} characters are required.'
        )


def validate_signup_schema_or_raise(db) -> None:
    """Validate signup-critical schema and raise on drift."""
    try:
        inspector = inspect(db.engine)
        table_names = {table_name.lower() for table_name in inspector.get_table_names()}
    except SQLAlchemyError as exc:
        raise SchemaReadinessError(
            f'Unable to inspect database schema during startup: {exc}'
        ) from exc

    if 'user' not in table_names:
        raise SchemaReadinessError(
            "Signup schema check failed: missing required 'user' table."
        )

    try:
        user_columns = [column['name'] for column in inspector.get_columns('user')]
    except SQLAlchemyError as exc:
        raise SchemaReadinessError(
            f"Unable to inspect 'user' table columns during startup: {exc}"
        ) from exc

    missing_columns = _missing_required_columns(user_columns)
    if missing_columns:
        missing_formatted = ', '.join(sorted(missing_columns))
        raise SchemaReadinessError(
            'Signup schema check failed: missing required user columns '
            f'[{missing_formatted}].'
        )

    _validate_password_hash_column(user_columns)

    logger.info(
        'signup_schema_check_passed',
        table='user',
        required_columns=list(SIGNUP_REQUIRED_USER_COLUMNS),
    )
