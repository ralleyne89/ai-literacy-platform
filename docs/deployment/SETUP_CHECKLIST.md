# Quick Setup Checklist

## 1. Verify Release Env

- `VITE_API_URL` points at the Netlify frontend origin: `https://litmusai.netlify.app`
- `BACKEND_API_URL` points at the Supabase Edge Function: `https://<project-ref>.supabase.co/functions/v1/platform-api`
- `FRONTEND_URL=https://litmusai.netlify.app` is set for Netlify
- `VITE_AUTH_MODE=supabase` is set for Netlify
- `VITE_SUPABASE_URL` is set for Netlify
- `VITE_SUPABASE_PUBLISHABLE_KEY` is set for Netlify
- `SUPABASE_SERVICE_ROLE_KEY` is set as a Supabase Edge Function secret
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_PREMIUM`, and `STRIPE_PRICE_ENTERPRISE` are set as Supabase Edge Function secrets

## 2. Configure Stripe Webhook

Set Stripe to deliver events to:

`https://<project-ref>.supabase.co/functions/v1/platform-api/api/billing/webhooks/stripe`

Select the standard subscription events used by the backend billing flow.

## 3. Deploy

1. Merge the branch to `main`.
2. Let Netlify auto-deploy the frontend from `main`.
3. Deploy `platform-api` with the Supabase CLI.
4. Confirm `/api/health` and billing checkout work on the live site.

## 4. Validate

- Supabase Google OAuth sign-in and sign-up routes load
- Protected routes land on `/dashboard`
- Billing checkout uses the Supabase Edge Function API
- Stripe webhook deliveries succeed against the Supabase Edge Function endpoint
