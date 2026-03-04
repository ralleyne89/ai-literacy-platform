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

- Supabase mode (default): keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set.
  - In production, use `VITE_AUTH_MODE=backend` explicitly if you do not provide Supabase credentials.
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
- `VITE_AUTH0_DOMAIN`
- `VITE_AUTH0_CLIENT_ID`
- `VITE_AUTH0_AUDIENCE`
- `VITE_AUTH0_REDIRECT_URI`
- `AUTH0_DOMAIN`
- `AUTH0_AUDIENCE`
- `JWT_SECRET_KEY` or `SUPABASE_JWT_SECRET`

## 🌐 Netlify + backend API routing

For Netlify-hosted frontend deployments using backend mode, set `VITE_API_URL` to your public backend URL (for example `https://<your-backend-host>/`) so all `/api/*` calls are sent directly to Flask.

- Ensure the backend host permits your Netlify origin in CORS (`ALLOWED_ORIGINS` or `FRONTEND_URL`).
- Avoid relying on Netlify proxying for backend auth paths unless you explicitly add `/api/*` redirects in `netlify.toml`.
- Verify `VITE_API_URL` and restart the frontend build whenever the backend URL changes.

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

