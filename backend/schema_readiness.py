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

    logger.info(
        'signup_schema_check_passed',
        table='user',
        required_columns=list(SIGNUP_REQUIRED_USER_COLUMNS),
    )
