# Backend Deployment Guide

## Production Model

LitmusAI deploys with this split:

- Netlify hosts the frontend and auto-deploys from `main`
- Render hosts the Flask backend and PostgreSQL database
- Supabase Auth provides the release auth path
- Stripe webhooks terminate at the Render backend

## Required Environment Variables

### Netlify

- `VITE_API_URL=https://ai-literacy-platform.onrender.com`
- `VITE_AUTH_MODE=supabase`
- `VITE_SUPABASE_URL=<supabase-project-url>`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>`

### Render

- `SUPABASE_URL=<supabase-project-url>`
- `SUPABASE_JWT_AUDIENCE=authenticated`
- `SUPABASE_JWT_SECRET=<legacy-jwt-secret-if-needed>`
- `SECRET_KEY=<generate-a-random-secret-key>`
- `JWT_SECRET_KEY=<generate-a-random-jwt-secret>`
- `DATABASE_URL=<render-postgres-url>`
- `FLASK_ENV=production`
- `FLASK_DEBUG=0`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `ALLOWED_ORIGINS=https://litmusai.netlify.app`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`

## Deploy To Render

1. Create or open the Render web service.
2. Point it at the repository root and the backend app.
3. Set the environment variables above.
4. Run `flask db upgrade` in the build step.
5. Confirm the service boots and `/api/health` returns 200.

## Update Netlify

1. Add the Netlify env vars above.
2. Confirm the production site still points to the Render backend through `VITE_API_URL`.
3. Merge to `main` and let Netlify auto-deploy.

## Stripe Webhook

Configure Stripe to send events to:

`https://ai-literacy-platform.onrender.com/api/billing/webhooks/stripe`

Use that endpoint as the single production webhook target. The Netlify proxy functions are legacy only.

## Verification

Run these checks after deploy:

1. `GET /api/health`
2. Authenticated `GET /api/auth/profile`
3. Authenticated `GET /api/training/progress`
4. Billing checkout flow
5. Stripe webhook delivery to Render
