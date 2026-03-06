## Cursor Cloud specific instructions

### Project overview

LitmusAI is an AI literacy platform (React 18 + Vite frontend, Flask + SQLAlchemy backend, SQLite for dev). See `README.md` for full docs.

### Running services

| Service | Command | Port |
|---------|---------|------|
| Frontend (Vite) | `npm run dev` | 5173 |
| Backend (Flask) | `PYTHON_CMD=/workspace/backend/venv/bin/python SKIP_SCHEMA_READINESS_CHECK=1 npm run backend` | 5001 |

### Key gotchas

- **`.env` for local dev**: The committed `.env` points to production. For local development, set `VITE_API_URL=http://localhost:5001`, `VITE_AUTH_MODE=backend`, and `DATABASE_URL=sqlite:////workspace/backend/instance/ai_literacy.db` (absolute path). Using a relative SQLite path causes Flask CLI and direct Python imports to write to different instance directories.
- **Auth mode**: Use `VITE_AUTH_MODE=backend` for local dev to avoid needing Auth0/Supabase credentials. Auth0 and Supabase modes require external service configuration.
- **Schema readiness check**: Set `SKIP_SCHEMA_READINESS_CHECK=1` when running the backend server or Flask CLI commands on a fresh database, and when running `pytest`. The check validates the `user` table exists at startup and will fail before `db.create_all()` has run.
- **Python venv**: Must be created with `python3 -m venv --copies /workspace/backend/venv` (the `--copies` flag is required in this environment since symlinks to the system Python may fail).
- **Database init (fresh setup)**: Run `db.create_all()` first, then `flask db stamp head`, then seed commands. Do not run `flask db upgrade` on a fresh DB — migrations assume a base schema already exists.
- **Seeding**: `SKIP_SCHEMA_READINESS_CHECK=1 PYTHONPATH=. FLASK_APP=app.py flask seed-training-modules --force && flask seed-certifications --force && flask seed-course-content --force` (run from `backend/`).

### Lint / Test / Build

- **Lint**: `npm run lint` (ESLint, zero warnings policy)
- **Frontend unit tests**: `npm test` (Vitest; e2e Playwright specs are excluded from `vitest run`)
- **Backend tests**: `cd backend && source venv/bin/activate && SKIP_SCHEMA_READINESS_CHECK=1 PYTHONPATH=. python -m pytest -q`
- **Build**: `npm run build` (runs prod-env validation; use only for production builds, not local dev)
