# Stripe Environment Setup

## Required Variables

### Netlify

- `VITE_API_URL=https://ai-literacy-platform.onrender.com`
- `VITE_CLERK_PUBLISHABLE_KEY=<publishable-key>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable>`

### Render

- `CLERK_SECRET_KEY=<secret-key>`
- `CLERK_JWT_ISSUER=<issuer-url>`
- `CLERK_JWKS_URL=<jwks-url>`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `ALLOWED_ORIGINS=https://litmusai.netlify.app`

## Webhook Target

Use the Render backend as the only production webhook target:

`https://ai-literacy-platform.onrender.com/api/billing/webhooks/stripe`

## Verification

- The frontend loads with a Clerk publishable key
- The backend can verify Clerk JWTs
- Stripe checkout uses the Render API
- Stripe webhook deliveries succeed against the Render endpoint
