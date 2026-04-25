# Deployment Documentation

This directory contains the release configuration and deployment runbooks for LitmusAI.

## Recommended Production Path

1. Merge the branch to `main`.
2. Let Netlify auto-deploy the frontend from `main`.
3. Keep the Flask backend on Render as the canonical API and Stripe webhook target.
4. Validate the live site, backend health, and billing flow after deploy.

## Release Configuration

Production release config is Clerk-only:

- Frontend build env: `VITE_CLERK_PUBLISHABLE_KEY`
- Render backend env: `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER`, `CLERK_JWKS_URL`
- Backend API base: `VITE_API_URL`

Local defaults:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5001`
- Start commands: `npm run dev` and `npm run backend`

The canonical Stripe webhook target is the Render backend route:

- `https://ai-literacy-platform.onrender.com/api/billing/webhooks/stripe`

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
npm run check:clerk-config
npm run build
```

If you change release config in `netlify.toml` or `render.yaml`, also run the Clerk config checker script. The script filename is legacy; the check now validates Clerk release config.
