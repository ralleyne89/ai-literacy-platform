#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${RENDER_DATABASE_URL:-}" ]]; then
  echo "RENDER_DATABASE_URL is required." >&2
  exit 1
fi

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is required." >&2
  exit 1
fi

DUMP_FILE="${1:-/tmp/litmusai-render-data.sql}"

echo "Exporting Render Postgres data to ${DUMP_FILE}"
pg_dump "${RENDER_DATABASE_URL}" \
  --data-only \
  --column-inserts \
  --no-owner \
  --no-acl \
  --table='public.user' \
  --table='public.assessment' \
  --table='public.training_module' \
  --table='public.assessment_result' \
  --table='public.user_progress' \
  --table='public.certification_type' \
  --table='public.certification' \
  --table='public.lesson' \
  --table='public.lesson_progress' \
  > "${DUMP_FILE}"

echo "Importing data into Supabase Postgres"
psql "${SUPABASE_DB_URL}" \
  --set=ON_ERROR_STOP=1 \
  --file="${DUMP_FILE}"

echo "Data import complete. Run Supabase/API smoke checks before retiring Render."
