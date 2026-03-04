#!/usr/bin/env python3
"""Import public.users rows from Supabase backup into Flask backend user table.

This keeps billing profile continuity by upserting the app's user rows using the
same UUID identity as Supabase auth users.
"""

from __future__ import annotations

import argparse
import gzip
import re
import sys
from datetime import datetime
from pathlib import Path


def _read_dump(path: Path) -> str:
    if path.suffix == '.gz':
        with gzip.open(path, 'rt', encoding='utf-8', errors='ignore') as handle:
            return handle.read()
    return path.read_text(encoding='utf-8', errors='ignore')


def _extract_public_users_rows(dump_text: str):
    pattern = r"COPY public\.users \(([^\)]+)\) FROM stdin;\n(.*?)\n\\\."
    match = re.search(pattern, dump_text, flags=re.S)
    if not match:
        raise RuntimeError('Could not find COPY public.users block in backup file')

    columns = [col.strip() for col in match.group(1).split(',')]
    rows_blob = match.group(2)

    parsed_rows = []
    for line in rows_blob.splitlines():
        if not line.strip() or line.strip().startswith('--'):
            continue
        parts = line.split('\t')
        if len(parts) != len(columns):
            continue
        parsed_rows.append(dict(zip(columns, parts)))

    return parsed_rows


def _as_nullable(value: str):
    return None if value in ('', '\\N') else value


def _normalize_tier(value: str | None) -> str:
    raw = (value or '').strip().lower()
    if raw in ('preminum', 'professional'):
        return 'premium'
    if raw in ('premium', 'enterprise', 'free', 'affiliate'):
        return raw
    return 'free'


def _parse_timestamp(value: str | None):
    cleaned = _as_nullable(value)
    if not cleaned:
        return None

    # Input shape example: 2025-10-10 22:08:25.702495+00
    parsed = datetime.fromisoformat(cleaned.replace(' ', 'T').replace('+00', '+00:00'))
    return parsed.replace(tzinfo=None)


def _map_backup_user(raw_row: dict[str, str]):
    user_id = _as_nullable(raw_row.get('id'))
    email = (_as_nullable(raw_row.get('email')) or '').strip().lower()
    if not user_id or not email:
        return None

    return {
        'id': user_id,
        'email': email,
        'first_name': _as_nullable(raw_row.get('first_name')) or 'AI',
        'last_name': _as_nullable(raw_row.get('last_name')) or 'Learner',
        'organization': _as_nullable(raw_row.get('organization')),
        'role': _as_nullable(raw_row.get('role')),
        'subscription_tier': _normalize_tier(_as_nullable(raw_row.get('subscription_tier'))),
        'stripe_customer_id': _as_nullable(raw_row.get('stripe_customer_id')),
        'stripe_subscription_id': _as_nullable(raw_row.get('stripe_subscription_id')),
        'subscription_status': _as_nullable(raw_row.get('subscription_status')),
        'created_at': _parse_timestamp(raw_row.get('created_at')),
        'updated_at': _parse_timestamp(raw_row.get('updated_at')),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description='Import users from backup public.users into backend user table.')
    parser.add_argument('--input', required=True, help='Path to .backup or .backup.gz file')
    parser.add_argument('--dry-run', action='store_true', help='Parse and report only, without writing DB changes')
    args = parser.parse_args()

    input_path = Path(args.input).expanduser().resolve()
    if not input_path.exists():
        raise FileNotFoundError(f'Backup input file not found: {input_path}')

    dump_text = _read_dump(input_path)
    backup_rows = _extract_public_users_rows(dump_text)
    mapped_rows = [mapped for raw_row in backup_rows if (mapped := _map_backup_user(raw_row))]

    if args.dry_run:
        normalized_tiers = sum(
            1 for row in mapped_rows if row['subscription_tier'] == 'premium'
        )
        print(
            f'Dry run complete. Parsed {len(mapped_rows)} users from backup '
            f'({normalized_tiers} mapped to premium tier where applicable).'
        )
        return 0

    repo_root = Path(__file__).resolve().parents[1]
    backend_root = repo_root / 'backend'
    sys.path.insert(0, str(backend_root))

    from sqlalchemy import inspect  # pylint: disable=import-error
    from app import app  # pylint: disable=import-error
    from models import db, User  # pylint: disable=import-error

    imported = 0
    updated = 0

    with app.app_context():
        inspector = inspect(db.engine)
        if not inspector.has_table('user'):
            raise RuntimeError(
                'Backend table "user" does not exist. Run migrations first: '
                '`cd backend && flask db upgrade`.'
            )

        for mapped in mapped_rows:
            user_id = mapped['id']
            existing = db.session.get(User, user_id)
            is_new = existing is None

            user = existing or User(
                id=user_id,
                email=mapped['email'],
                password_hash='supabase_managed',
                first_name=mapped['first_name'],
                last_name=mapped['last_name']
            )

            user.email = mapped['email']
            user.password_hash = 'supabase_managed'
            user.first_name = mapped['first_name'] or user.first_name or 'AI'
            user.last_name = mapped['last_name'] or user.last_name or 'Learner'
            user.organization = mapped['organization']
            user.role = mapped['role']
            user.subscription_tier = mapped['subscription_tier']
            user.stripe_customer_id = mapped['stripe_customer_id']
            user.stripe_subscription_id = mapped['stripe_subscription_id']
            user.subscription_status = mapped['subscription_status']

            created_at = mapped['created_at']
            updated_at = mapped['updated_at']
            if created_at:
                user.created_at = created_at
            if updated_at:
                user.updated_at = updated_at

            if is_new:
                db.session.add(user)
                imported += 1
            else:
                updated += 1

        db.session.commit()
        print(f'Import complete. Imported {imported} users and updated {updated} users.')

    return 0


if __name__ == '__main__':
    raise SystemExit(main())
