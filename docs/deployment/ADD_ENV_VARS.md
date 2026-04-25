# Add Environment Variables

## Netlify

Add these production frontend variables:

- `VITE_API_URL=https://ai-literacy-platform.onrender.com`
- `VITE_AUTH_MODE=supabase`
- `VITE_SUPABASE_URL=<supabase-project-url>`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>`
- `STRIPE_PUBLISHABLE_KEY=<stripe-publishable>`

## Render

Add these backend variables:

- `SUPABASE_URL=<supabase-project-url>`
- `SUPABASE_JWT_AUDIENCE=authenticated`
- `SUPABASE_JWT_SECRET=<legacy-jwt-secret-if-needed>`
- `SECRET_KEY=<generate-a-random-secret-key>`
- `JWT_SECRET_KEY=<generate-a-random-jwt-secret>`
- `DATABASE_URL=<render-postgres-url>`
- `FRONTEND_URL=https://litmusai.netlify.app`
- `ALLOWED_ORIGINS=https://litmusai.netlify.app`
- `STRIPE_SECRET_KEY=<stripe-secret>`
- `STRIPE_WEBHOOK_SECRET=<whsec_...>`

## Notes

- Keep the Render backend as the canonical Stripe webhook target.
- Do not rely on legacy Clerk or Auth0 release variables for production.
- After adding or changing values, redeploy Netlify and Render from `main`.
