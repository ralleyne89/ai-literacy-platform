# Stripe Environment Setup

## Required Variables

### Netlify

- `VITE_API_URL=https://litmusai.netlify.app`
- `BACKEND_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `VITE_AUTH_MODE=supabase`
- `VITE_SUPABASE_URL=<supabase-project-url>`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>`

Netlify should not hold Stripe secrets for the current production path. It only needs the public frontend variables and the backend proxy target.

### Supabase Edge Function Secrets

- `SUPABASE_URL=<supabase-project-url>`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable>`
- `STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>`
- `STRIPE_PRICE_PREMIUM=<price_...>`
- `STRIPE_PRICE_ENTERPRISE=<price_...>`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `ALLOWED_ORIGINS=https://litmusai.netlify.app`

## Webhook Target

Use the Supabase Edge Function as the only production webhook target:

`https://<project-ref>.supabase.co/functions/v1/platform-api/api/billing/webhooks/stripe`

## Verification

- The frontend loads with Supabase project URL and publishable key
- The backend can verify Supabase access JWTs
- Stripe checkout uses the Supabase Edge Function API
- Stripe webhook deliveries succeed against the Supabase Edge Function endpoint
