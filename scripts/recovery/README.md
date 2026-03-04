# Recovery Scripts

This folder contains one-time recovery tooling for restoring auth and billing-profile continuity after a paused Supabase project.

## 1) Extract focused recovery SQL from backup

```bash
python3 scripts/extract_supabase_recovery_sql.py \
  --input /Users/reggiealleyne/Downloads/db_cluster-22-10-2025@06-42-46.backup.gz \
  --output /tmp/supabase_user_recovery.sql
```

This output includes only:
- `COPY auth.users`
- `COPY auth.identities`
- `COPY public.users`

It also normalizes `public.users.subscription_tier` values like `preminum` and `professional` to `premium`.

## 2) Restore into new Supabase project

```bash
psql "<new-supabase-postgres-connection-string>" -f /tmp/supabase_user_recovery.sql
```

The generated SQL performs safety checks:
- target tables exist,
- imported row counts are non-zero,
- every `public.users.id` has a matching `auth.users.id`.

## 3) Sync recovered public users into backend DB

```bash
python3 scripts/import_backup_users_to_backend.py \
  --input /Users/reggiealleyne/Downloads/db_cluster-22-10-2025@06-42-46.backup.gz
```

Use `--dry-run` first to validate parsing and counts.
