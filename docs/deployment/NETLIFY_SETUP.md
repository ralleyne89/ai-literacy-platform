# Netlify Setup

Netlify hosts the LitmusAI frontend. Billing requests still start from the Netlify site, but the Stripe checkout, customer portal, and webhook logic now run through the Supabase `platform-api` Edge Function.

## Required Netlify Variables

Set these in Netlify production:

```txt
VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api
VITE_AUTH_MODE=supabase
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

Do not put Stripe secret keys in Netlify for the current production path. Set Stripe values as Supabase Edge Function secrets instead.

## Billing Runtime

The legacy Netlify billing functions are thin proxies only. They should forward to `VITE_API_URL`; they are not the source of truth for Stripe configuration.

Required Supabase secrets:

```txt
STRIPE_SECRET_KEY=<stripe-secret>
STRIPE_PUBLISHABLE_KEY=<stripe-publishable>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PRICE_PREMIUM=<price_...>
STRIPE_PRICE_ENTERPRISE=<price_...>
```

## Verify

1. Deploy the frontend from Netlify.
2. Deploy `platform-api` with Supabase.
3. Confirm `/api/health` reports the Supabase Edge runtime.
4. Open `/billing` and start a checkout for each paid plan.
5. Confirm Stripe sends webhooks to `https://<project-ref>.supabase.co/functions/v1/platform-api/api/billing/webhooks/stripe`.
