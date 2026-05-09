# Backend Deployment Guide

## Production Model

LitmusAI deploys with this split:

- Netlify hosts the frontend and auto-deploys from `main`
- Supabase hosts Auth, Postgres, and the `platform-api` Edge Function
- Stripe remains the billing provider
- Stripe webhooks terminate at the Supabase Edge Function

## Required Environment Variables

### Netlify

- `VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api`
- `VITE_AUTH_MODE=supabase`
- `VITE_SUPABASE_URL=<supabase-project-url>`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>`

### Supabase Edge Function Secrets

- `SUPABASE_URL=<supabase-project-url>`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `ALLOWED_ORIGINS=https://litmusai.netlify.app`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable>`
- `STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>`
- `STRIPE_PRICE_PREMIUM=<price_...>`
- `STRIPE_PRICE_ENTERPRISE=<price_...>`

## Deploy To Supabase

1. Apply the Supabase migrations.
2. Deploy the function with `supabase functions deploy platform-api`.
3. Set the secrets above with `supabase secrets set`.
4. Confirm `GET /api/health` through `VITE_API_URL` returns `runtime: "supabase-edge"`.

## Update Netlify

1. Add the Netlify env vars above.
2. Confirm the production site points to the Supabase Edge Function through `VITE_API_URL`.
3. Merge to `main` and let Netlify auto-deploy.

## Stripe Webhook

Configure Stripe to send events to:

`https://<project-ref>.supabase.co/functions/v1/platform-api/api/billing/webhooks/stripe`

Use that endpoint as the single production webhook target. The Netlify proxy functions are legacy only.

## Verification

Run these checks after deploy:

1. `GET /api/health`
2. Authenticated `GET /api/auth/profile`
3. Authenticated `GET /api/training/progress`
4. Billing checkout flow
5. Stripe webhook delivery to Supabase Edge Functions
