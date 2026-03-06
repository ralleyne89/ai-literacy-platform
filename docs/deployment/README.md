# Deployment Documentation

This directory contains all deployment-related documentation for the LitmusAI platform.

## 📁 Files

### Primary Guides

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
  - Database migrations
  - Environment variables
  - Production deployment steps
  - Post-deployment testing

- **[PUSH_AND_DEPLOY_GUIDE.md](PUSH_AND_DEPLOY_GUIDE.md)** - Quick start guide
  - GitHub authentication options
  - Push commands
  - Netlify deployment
  - Troubleshooting

### Setup Guides

- **[NETLIFY_SETUP.md](NETLIFY_SETUP.md)** - Netlify-specific setup
- **[STRIPE_COMPLETE_SETUP.md](STRIPE_COMPLETE_SETUP.md)** - Stripe payment integration
- **[ADD_ENV_VARS.md](ADD_ENV_VARS.md)** - Environment variables reference
- **[SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)** - Complete setup checklist

### Legacy/Alternative

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Original deployment guide
- **[RENDER_DEPLOYMENT_CHECKLIST.md](RENDER_DEPLOYMENT_CHECKLIST.md)** - Render.com deployment

## 🚀 Quick Start

**First time deploying?**
1. Read [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. Follow [PUSH_AND_DEPLOY_GUIDE.md](PUSH_AND_DEPLOY_GUIDE.md)
3. Check [SETUP_CHECKLIST.md](SETUP_CHECKLIST.md)

**Already deployed?**
- Use [PUSH_AND_DEPLOY_GUIDE.md](PUSH_AND_DEPLOY_GUIDE.md) for updates

## 🔁 PR → main → Netlify workflow

Recommended production path:

1. Push a feature branch to GitHub.
2. Open a pull request that targets `main`.
3. Merge the PR after review and checks.
4. Let Netlify auto-deploy from the linked `main` branch.

## 🔐 Auth and Session Modes

The frontend supports three authentication modes:

- Supabase mode: set `VITE_AUTH_MODE=supabase` and keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set.
- `auto` is not supported in production; always set `VITE_AUTH_MODE=backend`, `VITE_AUTH_MODE=supabase`, or `VITE_AUTH_MODE=auth0`.
- Backend mode: set `VITE_AUTH_MODE=backend` and rely on `/api/auth/register`, `/api/auth/login`, and `/api/auth/profile`.
  - Supabase variables can be unset in backend mode unless you still need OAuth/social behavior.
- Auth0 mode: set `VITE_AUTH_MODE=auth0` and configure `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, and `VITE_AUTH0_REDIRECT_URI`.
  - Auth0 handles email/password and provider sign-in; frontend form routes defer to Auth0 flows.

In backend mode, configure:

- `VITE_API_URL`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `DATABASE_URL`
- `SUPABASE_JWT_SECRET` (required if your backend validates Supabase-issued tokens)

In Auth0 mode, configure:

- `VITE_API_URL`
- `BACKEND_API_URL` (optional Netlify function proxy override; defaults to `VITE_API_URL`)
- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE`
- `VITE_AUTH0_REDIRECT_URI`
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`
- `JWT_SECRET_KEY` or `SUPABASE_JWT_SECRET`
- `FRONTEND_URL`
- `ALLOWED_ORIGINS`

## Auth0 provider settings for production

- When `VITE_AUTH_MODE=auth0`, confirm your Auth0 application is configured for this frontend domain before redeploying.
  - Open the Auth0 dashboard and enable **Google** (`google-oauth2`) for the app/client used by this site.
  - Add callback URL(s):
    - `https://litmusai.netlify.app/auth/callback` (production)
    - `http://localhost:5173/auth/callback` (local development)
  - Add web origins:
    - `https://litmusai.netlify.app`
    - `http://localhost:5173`
  - Verify `VITE_AUTH0_REDIRECT_URI` in Netlify is set to the same production callback URL.

## Auth0 release verification

For Auth0 releases, use the real redirect and callback flow as the release gate.

1. Deploy a build that keeps `VITE_AUTH_MODE=auth0` and the production `VITE_AUTH0_*` values aligned with `netlify.toml`.
2. Open `/login`, submit an email, and confirm the browser leaves the app for Auth0 Universal Login instead of showing a local password form.
3. Open `/register`, submit an email, and confirm the browser leaves the app for the Auth0 signup flow.
4. Complete sign-in and verify Auth0 returns to `/auth/callback`, the backend exchange succeeds, and the app lands on `/dashboard`.
5. Open at least one protected route after sign-in, such as `/training` or a module page, to confirm the session is usable beyond the dashboard.

Legacy note:

- Do not treat backend-form Playwright coverage as authoritative for Auth0 ship decisions.
- `npm run e2e:smoke` and `npm run e2e:flow` need Auth0-aware specs before they can be used as production release gates.

## 🌐 Netlify + backend API routing

For Netlify-hosted frontend deployments, set `VITE_API_URL` to your public backend URL (for example `https://<your-backend-host>/`) so auth and billing requests go straight to Flask.

- Ensure the backend host permits your Netlify origin in CORS (`ALLOWED_ORIGINS` or `FRONTEND_URL`).
- Avoid relying on Netlify proxying for backend auth paths unless you explicitly add `/api/*` redirects in `netlify.toml`.
- Verify `VITE_API_URL` and restart the frontend build whenever the backend URL changes.
- Billing and Stripe state are canonical in Flask:
  - Browser requests should use the backend billing routes such as `/api/billing/config`, `/api/billing/checkout-session`, and `/api/billing/customer-portal`.
  - Stripe webhooks should target the backend route `https://<your-backend-host>/api/billing/webhooks/stripe`.
  - The legacy Netlify billing functions now proxy to the backend and should not be treated as a second source of truth.

## 🗄️ Database Providers and Migration Notes

Recommended PostgreSQL options for constrained budgets:

- Neon
- Render PostgreSQL
- Railway PostgreSQL
- Supabase Postgres
- Aiven
- ElephantSQL (where available)

A deployment migration checklist:

1. Update `DATABASE_URL`
2. Run `cd backend && FLASK_APP=app.py flask db upgrade`
3. Re-run seeder scripts where required

## 🔑 Key Topics

### Authentication
- GitHub authentication (Personal Access Token, SSH, Git Credential Manager)
- Supabase setup
- Backend auth mode (`VITE_AUTH_MODE=backend`)
- Auth0 mode (`VITE_AUTH_MODE=auth0`)
- Environment variables

### Database
- Running migrations
- Seeding content
- Production database setup

### Hosting
- Netlify deployment
- Render.com deployment (alternative)
- Custom domain setup

### Payment
- Stripe integration
- Webhook configuration
- Subscription management
