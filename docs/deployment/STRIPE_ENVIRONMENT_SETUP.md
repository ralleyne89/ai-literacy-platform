# Stripe Payment Integration - Environment Setup Guide

This guide covers all required environment variables for the Stripe payment integration to work correctly.

## Required Environment Variables

### 1. Netlify Environment Variables

Set these in your Netlify dashboard (Site settings → Environment variables):

```bash
# Frontend runtime
VITE_API_URL=https://your-backend-host.onrender.com
VITE_AUTH_MODE=auth0
VITE_AUTH0_DOMAIN=https://your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=https://your-api-audience
VITE_AUTH0_REDIRECT_URI=https://your-site.netlify.app/auth/callback

# Stripe publishable key for billing UI
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_... for testing

# Optional explicit backend URL for legacy Netlify billing/webhook proxy functions.
# When omitted, the proxy falls back to VITE_API_URL.
BACKEND_API_URL=https://your-backend-host.onrender.com
```

### 2. Backend Environment Variables (backend/.env)

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_... # Get this from Stripe webhook settings
STRIPE_PRICE_PREMIUM=price_... # Optional
STRIPE_PRICE_ENTERPRISE=price_... # Optional

# Auth + token verification
JWT_SECRET_KEY=your-backend-jwt-secret
SUPABASE_JWT_SECRET=your-jwt-secret # Required only if validating Supabase-issued tokens
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_AUDIENCE=https://your-api-audience
AUTH0_REDIRECT_URI=https://your-site.netlify.app/auth/callback

# Frontend origin allowlist
FRONTEND_URL=https://your-site.netlify.app
ALLOWED_ORIGINS=https://your-site.netlify.app
```

### Auth0 alignment rules

When `VITE_AUTH_MODE=auth0`, treat the frontend `VITE_AUTH0_*` values and backend `AUTH0_*` values as one deployment contract:

- `VITE_AUTH0_CLIENT_ID` and `AUTH0_CLIENT_ID` must match exactly.
- `VITE_AUTH0_AUDIENCE` and `AUTH0_AUDIENCE` must match exactly.
- `VITE_AUTH0_REDIRECT_URI` and `AUTH0_REDIRECT_URI` must match exactly.
- `VITE_AUTH0_DOMAIN` and `AUTH0_DOMAIN` must point at the same Auth0 tenant. The backend accepts either the bare hostname or the full `https://...` URL.
- Even though Flask can fall back to `VITE_AUTH0_*`, set the bare `AUTH0_*` variables explicitly on the deployed backend/runtime so callback failures are easier to diagnose.

### 3. Frontend Environment Variables (.env)

```bash
# Local frontend runtime
VITE_API_URL=http://localhost:5001
VITE_AUTH_MODE=auth0
VITE_AUTH0_DOMAIN=https://your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=https://your-api-audience
VITE_AUTH0_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Critical Notes

### Canonical billing state lives in Flask

**IMPORTANT:** Billing checkout, customer portal access, and Stripe webhook writes must flow through the Flask backend.

- The browser should call backend billing routes via `VITE_API_URL`.
- The backend owns the canonical `User.subscription_*` fields.
- Legacy Netlify billing functions are now just thin proxies to the backend. Do not treat them as a separate billing system.

### Webhook Secret Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-backend-host.onrender.com/api/billing/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add it to the backend environment variables as `STRIPE_WEBHOOK_SECRET`
6. If you must keep an older Netlify webhook URL temporarily, point it at the legacy function only after setting `BACKEND_API_URL`/`VITE_API_URL` so it can proxy through to Flask.

### Testing vs Production Keys

**Test Mode:**
- Use keys starting with `sk_test_` and `pk_test_`
- No real charges will be made
- Use test card: `4242 4242 4242 4242`

**Production Mode:**
- Use keys starting with `sk_live_` and `pk_live_`
- Real charges will be made
- Requires activated Stripe account

## Verification Checklist

After setting up environment variables:

- [ ] Netlify has `VITE_API_URL` (and optionally `BACKEND_API_URL`) pointed at the public backend host
- [ ] Backend environment has Stripe keys, webhook secret, and allowed frontend origins configured
- [ ] Frontend local `.env` has the correct Auth0 + Stripe publishable settings
- [ ] Stripe webhook endpoint is configured against the backend `/api/billing/webhooks/stripe` route
- [ ] Database migration has been run (see `stripe_migration.sql`)
- [ ] Authenticated checkout flow works
- [ ] Returning from Stripe syncs subscription state to the Flask `User` record
- [ ] Webhook successfully updates canonical subscription state for renewals/cancellations

## Troubleshooting

### "Webhook secret not configured" error
- Check that `STRIPE_WEBHOOK_SECRET` is set in backend environment variables
- Redeploy after adding the variable

### "Webhook processing failed" in backend logs
- Verify `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are both set on the backend
- Check that the checkout session metadata includes the authenticated `user_id`
- Verify the backend can reach Stripe and that the user exists in the Flask database

### "Stripe is not configured" error on checkout
- Check that `STRIPE_SECRET_KEY` is set
- Verify the key starts with `sk_test_` or `sk_live_`
- Check backend logs for more details

### Database not updating after successful payment
- Confirm the browser returned to `/billing?success=true&session_id=...`
- Verify `POST /api/billing/checkout-session/complete` succeeds for the signed-in user
- Check backend logs for webhook or checkout-complete errors
- Ensure subscription columns exist on the `user` table

## Database Schema Requirements

The users table must have these columns (run the migration script):

```sql
subscription_tier TEXT DEFAULT 'free'
stripe_customer_id TEXT
stripe_subscription_id TEXT
subscription_status TEXT
```

See `docs/database/stripe_migration.sql` for the complete migration script.

