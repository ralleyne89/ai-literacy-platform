# Add Environment Variables

## Netlify

Add these production frontend variables:

- `VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api`
- `VITE_AUTH_MODE=supabase`
- `VITE_SUPABASE_URL=<supabase-project-url>`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>`

## Supabase Edge Function Secrets

Set these with `supabase secrets set`:

- `SUPABASE_URL=<supabase-project-url>`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `ALLOWED_ORIGINS=https://litmusai.netlify.app`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable>`
- `STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>`
- `STRIPE_PRICE_PREMIUM=<price_...>`
- `STRIPE_PRICE_ENTERPRISE=<price_...>`

## Notes

- Keep Stripe as the billing provider; Supabase Edge Functions now host the webhook/API glue.
- `VITE_API_URL` must be the `platform-api` Edge Function URL, not the Supabase REST URL (`/rest/v1`).
- Do not rely on legacy Clerk or Auth0 release variables for production.
- After adding or changing values, redeploy Netlify and `supabase functions deploy platform-api`.
