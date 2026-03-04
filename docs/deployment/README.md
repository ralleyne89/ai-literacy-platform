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

## 🔐 Auth and Session Modes

The frontend supports two authentication paths:

- Supabase mode (default): keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set.
- Backend mode: set `VITE_AUTH_MODE=backend` and rely on `/api/auth/register`, `/api/auth/login`, and `/api/auth/profile`.
  - Keep Supabase vars set to preserve Google/Facebook provider login while backend mode remains active.

In backend mode, configure:

- `VITE_API_URL`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `DATABASE_URL`

To enable Supabase OAuth providers, keep Supabase variables configured. Provider login is available when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, regardless of `VITE_AUTH_MODE`.

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

