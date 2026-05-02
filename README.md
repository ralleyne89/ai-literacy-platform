# LitmusAI

LitmusAI is an AI literacy platform built around the Assess -> Activate -> Certify learning flow. It gives learners an AI readiness assessment, recommends role-aware training paths, tracks course progress, and supports certifications and billing.

The release architecture is Netlify for the React frontend and Supabase for auth, Postgres, and the `platform-api` Edge Function. A Flask API with SQLite is still available as a local fallback for development and tests.

## Contents

- [Stack](#stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Local Data Setup](#local-data-setup)
- [Common Commands](#common-commands)
- [Testing](#testing)
- [Supabase and Netlify Deployment](#supabase-and-netlify-deployment)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Security Notes](#security-notes)

## Stack

| Layer | Local development | Production / release path |
| --- | --- | --- |
| Frontend | React 18, Vite, Tailwind CSS | Netlify static build |
| API | Flask on `http://localhost:5001` | Supabase Edge Function `platform-api` |
| Database | SQLite through Flask | Supabase Postgres |
| Auth | Supabase Auth, with Playwright stub support for tests | Supabase Auth with Google OAuth |
| Billing | Flask fallback routes or Supabase function secrets | Stripe through Supabase Edge Function |
| Tests | Vitest, pytest, Playwright | Same checks plus Supabase API smoke checks |

## Prerequisites

- Node.js 18 or newer
- npm
- Python 3.8 or newer
- Git
- Optional for production operations: Supabase CLI, Netlify CLI, Stripe CLI

## Quick Start

From a fresh checkout:

```bash
git clone https://github.com/ralleyne89/ai-literacy-platform.git
cd ai-literacy-platform

npm install

python3 -m venv backend/venv
backend/venv/bin/python -m pip install --upgrade pip
backend/venv/bin/python -m pip install -r requirements-dev.txt

# Create local env files only if they do not already exist.
test -f .env || cp .env.example .env
test -f backend/.env || cp backend/.env.example backend/.env
```

Then start the app in two terminals:

```bash
npm run backend
```

```bash
npm run dev
```

Local URLs:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Flask API | `http://localhost:5001` |
| Flask health check | `http://localhost:5001/api/health` |

The backend script expects `backend/venv/bin/python`. To use a different interpreter:

```bash
PYTHON_CMD=/path/to/python npm run backend
```

## Environment Setup

There are two local env surfaces:

- Root `.env`: values consumed by Vite, build validation scripts, and frontend tooling.
- `backend/.env`: values consumed by the Flask fallback API.

Start from `.env.example` and `backend/.env.example`, then replace placeholders as needed. Do not put real service-role keys, Stripe secrets, or OAuth secrets in browser-exposed `VITE_*` variables.

### Required local frontend values

```env
VITE_API_URL=http://localhost:5001
VITE_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-supabase-publishable-key
```

For local Flask-only development, `VITE_API_URL=http://localhost:5001` is the important value.

### Required local Flask fallback values

```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
DATABASE_URL=sqlite:///ai_literacy.db
FLASK_ENV=development
FLASK_DEBUG=1
PORT=5001
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
```

If protected routes need to verify real Supabase tokens locally, also set:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_JWT_AUDIENCE=authenticated
```

### Production API URL rule

For Supabase-backed builds, `VITE_API_URL` must include the Edge Function path:

```env
VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api
```

Do not set `VITE_API_URL` to the Supabase project origin or `/rest/v1`. The frontend appends routes such as `/api/auth/profile`, so production API traffic must go through the `platform-api` Edge Function.

## Local Data Setup

The Flask app creates a local SQLite database on startup, but a complete local dataset should be migrated and seeded explicitly:

```bash
cd backend
source venv/bin/activate

FLASK_APP=app.py flask db upgrade
FLASK_APP=app.py flask seed-training-modules --force
FLASK_APP=app.py flask seed-certifications --force
FLASK_APP=app.py flask seed-course-content --force
```

The seed commands are idempotent. Use `--force` when fixture changes should overwrite existing local records.

## Common Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite frontend on port 5173. |
| `npm run backend` | Start the Flask fallback API on port 5001. |
| `PORT=5010 npm run backend` | Start Flask on a different port. |
| `npm run build` | Validate non-production env rules and build the frontend into `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run TypeScript checks. |
| `npm test` | Run Vitest unit tests. |
| `npm run test:backend` | Run backend pytest tests. |
| `npm run test:all` | Run lint, typecheck, frontend tests, backend tests, and build. |
| `npm run e2e:install` | Install Playwright browser dependencies. |
| `npm run test:e2e` | Run Playwright E2E tests. |
| `npm run check:platform-api` | Smoke test the API base configured by `VITE_API_URL`. |

## Testing

### Unit and integration checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:backend
npm run build
```

Use the full gate when you need broad confidence:

```bash
npm run test:all
```

### Playwright E2E

The Playwright config starts its own backend and frontend. It uses:

- Frontend: `http://127.0.0.1:5195`
- Backend: `http://127.0.0.1:5001`
- Temporary SQLite database: `/tmp/ai-literacy-playwright.db`
- Supabase auth stub: `VITE_SUPABASE_AUTH_STUB=1`

Run:

```bash
npm run e2e:install
npm run test:e2e
```

For headed recording:

```bash
npm run test:e2e:record
```

### Production-style env validation

To force the same strict checks used for production builds:

```bash
VITE_API_URL=https://your-project.supabase.co/functions/v1/platform-api \
VITE_AUTH_MODE=supabase \
VITE_SUPABASE_URL=https://your-project.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key \
ENFORCE_PROD_ENV=1 \
npm run build
```

### Supabase API smoke check

After deploying `platform-api`, validate the live API contract:

```bash
VITE_API_URL=https://your-project.supabase.co/functions/v1/platform-api npm run check:platform-api
```

The smoke check calls:

- `/api/health`
- `/api/training/modules`
- `/api/certification/available`
- `/api/billing/config`

## Supabase and Netlify Deployment

Production is designed for Netlify plus Supabase:

1. Apply the Supabase schema in `supabase/migrations/001_create_tables.sql`.
2. Deploy the Supabase Edge Function:

```bash
supabase functions deploy platform-api
```

3. Set Supabase function secrets:

```bash
supabase secrets set \
  SUPABASE_URL="https://<project-ref>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  FRONTEND_URL="https://your-netlify-site.netlify.app" \
  ALLOWED_ORIGINS="https://your-netlify-site.netlify.app" \
  STRIPE_SECRET_KEY="sk_live_or_test_..." \
  STRIPE_PUBLISHABLE_KEY="pk_live_or_test_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  STRIPE_PRICE_PREMIUM="price_..." \
  STRIPE_PRICE_ENTERPRISE="price_..."
```

4. Set Netlify build variables:

```env
VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api
VITE_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
```

5. Configure Supabase Auth:

- Enable Google as an OAuth provider.
- Add the Google client ID and client secret in the Supabase provider config.
- Add local and production `/auth/callback` URLs to the Supabase redirect URL allow list.
- Keep `/auth/callback` available in the SPA for PKCE code exchange.

6. Update Stripe webhooks to the Supabase function endpoint:

```text
https://<project-ref>.supabase.co/functions/v1/platform-api/api/billing/webhooks/stripe
```

7. Run the production build and API smoke checks before release.

Netlify deploys from `main` using `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Node version: 18

Legacy Netlify billing functions are retained for older deployments, but the canonical billing route is the Supabase Edge Function API.

## Project Structure

```text
ai-literacy-platform/
|-- src/                         # React frontend
|   |-- components/              # Shared UI and course components
|   |-- config/                  # API/auth URL helpers
|   |-- contexts/                # Auth state
|   |-- data/                    # Demo fallback data
|   |-- pages/                   # Route-level views
|   |-- services/                # Supabase client
|   `-- test/                    # Frontend test setup
|-- backend/                     # Flask local fallback API
|   |-- migrations/              # Alembic migrations
|   |-- routes/                  # API route handlers
|   |-- seeders/                 # Local fixture seeders
|   `-- tests/                   # Backend pytest tests
|-- supabase/
|   |-- functions/platform-api/  # Supabase Edge Function API
|   `-- migrations/              # Supabase SQL schema
|-- netlify/functions/           # Legacy Netlify function compatibility routes
|-- e2e/                         # Playwright tests
|-- scripts/                     # Validation, migration, and smoke-check scripts
|-- docs/                        # Extended project documentation
|-- netlify.toml                 # Netlify build/deploy config
|-- package.json                 # Frontend scripts and dependencies
`-- requirements-dev.txt         # Backend plus pytest dependencies
```

## Troubleshooting

### `VITE_API_URL` points to the wrong Supabase URL

Use:

```env
VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api
```

Do not use:

```env
VITE_API_URL=https://<project-ref>.supabase.co
VITE_API_URL=https://<project-ref>.supabase.co/rest/v1
```

### `npm run build` fails during env validation

Check for missing placeholders or release-blocking values:

- `VITE_API_URL` must be absolute and cannot point to localhost in production mode.
- Supabase API URLs must include `/functions/v1/platform-api`.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are required for release builds.
- Legacy Clerk/Auth0 production variables should be removed from the release environment.

### Flask backend does not start

Recreate the virtual environment and install dependencies:

```bash
python3 -m venv backend/venv
backend/venv/bin/python -m pip install --upgrade pip
backend/venv/bin/python -m pip install -r requirements-dev.txt
npm run backend
```

If port 5001 is occupied:

```bash
PORT=5010 npm run backend
```

Then update root `.env`:

```env
VITE_API_URL=http://localhost:5010
```

### Frontend cannot reach the API

Confirm both services are running:

```bash
curl http://localhost:5001/api/health
curl http://localhost:5173
```

Also confirm that `FRONTEND_URL` and `ALLOWED_ORIGINS` in `backend/.env` match the frontend URL.

### Supabase OAuth starts but callback fails

Check:

- Google provider is enabled in Supabase.
- Google client ID and client secret are present.
- Redirect allow list includes `http://localhost:5173/auth/callback` and the production callback URL.
- Root `.env` contains `VITE_AUTH_MODE=supabase`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_PUBLISHABLE_KEY`.

### `npm run check:platform-api` returns 404

The hosted Supabase project likely does not have the `platform-api` function deployed, or `VITE_API_URL` is missing the function path. Deploy the function and rerun the smoke check.

## Documentation

Useful starting points:

- [Supabase API Consolidation](docs/deployment/SUPABASE_API_CONSOLIDATION.md)
- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md)
- [Netlify Setup](docs/deployment/NETLIFY_SETUP.md)
- [Testing Guide](docs/testing/TESTING_GUIDE.md)
- [Course Catalog](docs/course-content/COURSE_CATALOG.md)
- [Course Content System](docs/course-content/COURSE_CONTENT_SYSTEM.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Documentation Index](docs/README.md)

## Security Notes

- Keep Supabase service-role keys, Stripe secrets, and OAuth secrets server-side only.
- Browser-exposed variables must use the `VITE_*` prefix and should only contain publishable values.
- Production billing, auth, and database operations should terminate at Supabase Edge Functions, not in client-side code.
