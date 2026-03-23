# Add Environment Variables

## Netlify

Add these production frontend variables:

- `VITE_API_URL=https://ai-literacy-platform.onrender.com`
- `VITE_CLERK_PUBLISHABLE_KEY=<publishable-key>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable>`

## Render

Add these backend variables:

- `CLERK_SECRET_KEY=<secret-key>`
- `CLERK_JWT_ISSUER=<issuer-url>`
- `CLERK_JWKS_URL=<jwks-url>`
- `SECRET_KEY=<generate-a-random-secret-key>`
- `JWT_SECRET_KEY=<generate-a-random-jwt-secret>`
- `DATABASE_URL=<render-postgres-url>`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `ALLOWED_ORIGINS=https://litmusai.netlify.app`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`

## Notes

- Keep the Render backend as the canonical Stripe webhook target.
- Do not rely on legacy Auth0 or Supabase release variables for production.
- After adding or changing values, redeploy Netlify and Render from `main`.
