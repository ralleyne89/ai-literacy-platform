# Quick Setup Checklist

## 1. Verify Release Env

- `VITE_API_URL` points at the Render backend
- `VITE_CLERK_PUBLISHABLE_KEY` is set for Netlify
- `CLERK_SECRET_KEY` is set on Render
- `CLERK_JWT_ISSUER` is set on Render
- `CLERK_JWKS_URL` is set on Render
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and `STRIPE_WEBHOOK_SECRET` are set

## 2. Configure Stripe Webhook

Set Stripe to deliver events to:

`https://ai-literacy-platform.onrender.com/api/billing/webhooks/stripe`

Select the standard subscription events used by the backend billing flow.

## 3. Deploy

1. Merge the branch to `main`.
2. Let Netlify auto-deploy the frontend from `main`.
3. Let Render deploy the backend from the repo config.
4. Confirm `/api/health` and billing checkout work on the live site.

## 4. Validate

- Clerk sign-in and sign-up routes load
- Protected routes land on `/dashboard`
- Billing checkout uses the Render backend
- Stripe webhook deliveries succeed against the Render endpoint
