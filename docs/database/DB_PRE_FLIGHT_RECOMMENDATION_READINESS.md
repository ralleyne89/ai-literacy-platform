# Database Baseline & Recommendation Readiness Checklist

This checklist standardizes database setup validation for the assessment + recommendation
workflow in both local and Supabase environments.

## 1) Local backend setup (SQLite/PostgreSQL via Flask `DATABASE_URL`)

### Prerequisites

- Backend virtual environment installed (`backend/requirements.txt`)
- Backend environment file configured (`backend/.env` or environment variables)
- `DATABASE_URL` is set for the target environment (`sqlite:///ai_literacy.db` in default local dev)

### Commands

Run from repository root:

```bash
cd backend

# Ensure Flask sees the app
export FLASK_APP=app.py

# Activate your environment/venv first (optional but recommended)
source venv/bin/activate

# 1) Apply SQLAlchemy/Flask-Migrate schema migrations
flask db upgrade

# 2) Ensure assessment + recommendation schema compatibility
flask migrate-add-target-domains

# 3) Seed required datasets
flask seed-training-modules --force
flask seed-certifications --force
flask seed-course-content --force
```

### Fast validation queries

Assuming default SQLite file at `backend/instance/ai_literacy.db`:

```bash
sqlite3 backend/instance/ai_literacy.db "
  SELECT name FROM sqlite_master
  WHERE type='table' AND name IN ('user','assessment_result','training_module','user_progress');
"

sqlite3 backend/instance/ai_literacy.db "
  SELECT
    (SELECT COUNT(*) FROM assessment_result) AS assessment_rows,
    (SELECT COUNT(*) FROM user_progress) AS user_progress_rows,
    (SELECT COUNT(*) FROM training_module) AS training_module_rows,
    (SELECT COUNT(*) FROM user) AS user_rows;
"

sqlite3 backend/instance/ai_literacy.db "
  SELECT COUNT(*) AS mapped_modules
  FROM training_module
  WHERE target_domains IS NOT NULL AND TRIM(target_domains) <> '';
"

sqlite3 backend/instance/ai_literacy.db "
  SELECT id, title, target_domains
  FROM training_module
  LIMIT 5;
"
```

Expected minimum state:

- `assessment_result`, `training_module`, `user_progress`, and `user` tables exist
- `training_module` has seeded rows
- `training_module.target_domains` is populated for seed modules (non-null count > 0)
- `assessment_result` is writable by authenticated users (`/api/assessment/submit` path)
- `assessment_result` contains `recommendations` payloads and `domain_scores`

### Optional: backend endpoint smoke check (requires an auth token)

```bash
curl -sS http://127.0.0.1:5001/api/assessment/questions | jq '.questions|length'
curl -sS http://127.0.0.1:5001/health
```

## 2) Supabase/Postgres setup for recommendation reliability

If your data source is Supabase/Postgres, apply migrations and ensure the assessment
pipeline tables are present. The existing project migration file `supabase/migrations/001_create_tables.sql`
creates core tables and seeded modules in the project schema, but it does not add
`target_domains` as a dedicated column.

### Recommended Supabase migration order

1. Run `001_create_tables.sql` (or your equivalent migration baseline).
2. Add recommendation compatibility column for `target_domains` if your backend expects
   `training_module.target_domains` values directly:

```sql
-- Add dedicated recommendation-target column if needed
ALTER TABLE public.training_modules
ADD COLUMN IF NOT EXISTS target_domains jsonb;

-- Backfill from existing content metadata
UPDATE public.training_modules
SET target_domains = COALESCE(
  content->'target_domains',
  (content->'metadata'->'target_domains'),
  target_domains::jsonb,
  '[]'::jsonb
)
WHERE target_domains IS NULL;
```

3. Verify table coverage used by assessment/recommendation queries:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users','assessment_results','training_modules','user_progress')
ORDER BY table_name;

SELECT COUNT(*) AS training_modules
FROM public.training_modules;

SELECT COUNT(*) AS mapped_modules
FROM public.training_modules
WHERE target_domains IS NOT NULL
AND jsonb_typeof(target_domains) = 'array'
AND jsonb_array_length(target_domains) > 0;
```

### If using an existing legacy Supabase schema

For environments already running an older schema, run the schema alignment checks above first,
then ensure the tables/columns your backend expects are present before enabling recommendation reads.

## 3) Pre-flight criteria for assessment-to-recommendation flow

Before running E2E or QA:

- Assessment questions endpoint returns successfully.
- `/api/assessment/submit` inserts rows into `assessment_result` and persists `domain_scores`.
- `/api/assessment/recommendations` returns module payload with:
  - `id`, `title`, `reason`
  - `priority`
  - `target_domains` when available
- At least one seeded training module is mapped with domain tags (`AI Fundamentals`,
  `Practical Usage`, `Ethics & Critical Thinking`, `AI Impact & Applications`, `Strategic Understanding`).

Use this checklist whenever spinning a fresh dev instance or a new Supabase DB.
