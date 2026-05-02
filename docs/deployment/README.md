# Deployment Documentation

This directory contains the release configuration and deployment runbooks for LitmusAI.

## Recommended Production Path

1. Merge the branch to `main`.
2. Let Netlify auto-deploy the frontend from `main`.
3. Keep the Supabase `platform-api` Edge Function as the canonical API and Stripe webhook target.
4. Validate the live site, backend health, and billing flow after deploy.

## Release Configuration

Production release config uses Supabase Auth with Google OAuth:

- Frontend build env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Supabase Edge Function secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe secrets, and frontend origin
- Backend API base: `VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api`

Do not use the Supabase REST URL (`https://<project-ref>.supabase.co/rest/v1`) for `VITE_API_URL`. The browser calls `/api/*` routes, so the base URL must be the `platform-api` Edge Function.

Local defaults:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001`
- Start commands: `npm run dev` and `npm run backend`

The canonical Stripe webhook target is the Supabase Edge Function route:

- `https://<project-ref>.supabase.co/functions/v1/platform-api/api/billing/webhooks/stripe`

Netlify billing functions remain legacy proxies and are not the source of truth.

## What To Read

- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for the backend and database rollout steps
- [PUSH_AND_DEPLOY_GUIDE.md](PUSH_AND_DEPLOY_GUIDE.md) for the PR-to-main workflow
- [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md) for release configuration verification
- [ADD_ENV_VARS.md](ADD_ENV_VARS.md) for environment variable setup
- [STRIPE_ENVIRONMENT_SETUP.md](STRIPE_ENVIRONMENT_SETUP.md) for billing and webhook setup

## Validation

Use the release validation script from the repo root after updating production config:

```bash
npm run validate:prod-env
npm run check:supabase-config
npm run build
```

If you change release config in `netlify.toml` or `render.yaml`, run the Supabase config check and a production-style build before merging.
