# Stripe Environment Setup

## Required Variables

### Netlify

- `VITE_API_URL=https://ai-literacy-platform.onrender.com`
- `VITE_AUTH_MODE=supabase`
- `VITE_SUPABASE_URL=<supabase-project-url>`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable>`

### Render

- `SUPABASE_URL=<supabase-project-url>`
- `SUPABASE_JWT_AUDIENCE=authenticated`
- `SUPABASE_JWT_SECRET=<legacy-jwt-secret-if-needed>`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `ALLOWED_ORIGINS=https://litmusai.netlify.app`

## Webhook Target

Use the Render backend as the only production webhook target:

`https://ai-literacy-platform.onrender.com/api/billing/webhooks/stripe`

## Verification

- The frontend loads with Supabase project URL and publishable key
- The backend can verify Supabase access JWTs
- Stripe checkout uses the Render API
- Stripe webhook deliveries succeed against the Render endpoint
