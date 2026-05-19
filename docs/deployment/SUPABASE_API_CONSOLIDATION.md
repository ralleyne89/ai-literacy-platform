# Supabase API Consolidation

This project now supports a Supabase-native API target that preserves the existing frontend `/api/*` routes through one Edge Function:

```env
VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api
```

Do not set `VITE_API_URL` to the plain Supabase project URL or the Supabase REST URL (`/rest/v1`). The frontend appends paths such as `/api/auth/profile`, so the API base must include `/functions/v1/platform-api`.

## Supabase Setup

1. Apply the SQL schema in `supabase/migrations/001_create_tables.sql`.
   If an older Supabase migration with the same filename was already applied to a project, run this SQL manually in a staging project or reset the staging database before importing Render data.
2. Deploy the Edge Function:

```bash
supabase functions deploy platform-api
```

3. Set function secrets:

```bash
supabase secrets set \
  SUPABASE_URL="https://<project-ref>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  FRONTEND_URL="https://litmusai.netlify.app" \
  STRIPE_SECRET_KEY="<stripe-secret-key>" \
  STRIPE_PUBLISHABLE_KEY="<stripe-publishable-key>" \
  STRIPE_WEBHOOK_SECRET="<stripe-webhook-secret>" \
  STRIPE_PRICE_PREMIUM="price_..." \
  STRIPE_PRICE_ENTERPRISE="price_..."
```

## Netlify Environment

Set these in Netlify:

```env
VITE_API_URL=https://<project-ref>.supabase.co/functions/v1/platform-api
VITE_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
```

## Data Migration

After the Supabase schema exists, export Render data and import it into Supabase:

```bash
RENDER_DATABASE_URL="postgres://..." \
SUPABASE_DB_URL="postgres://..." \
scripts/migrate-render-data-to-supabase.sh
```

The script exports the canonical Flask tables: `user`, `assessment`, `training_module`, `assessment_result`, `user_progress`, `certification_type`, `certification`, `lesson`, and `lesson_progress`.

## Stripe Webhook

Update Stripe to send subscription events to:

```text
https://<project-ref>.supabase.co/functions/v1/platform-api/api/billing/webhooks/stripe
```

Keep Stripe as the billing provider. Supabase only replaces the custom backend runtime.

## Cutover Checks

- `GET /api/health` through the Supabase function returns `runtime: "supabase-edge"`.
- Google OAuth login loads `/api/auth/profile`.
- Assessment submit/history/recommendations work for an authenticated user.
- Training enrollment and lesson completion update Supabase rows.
- Billing config, checkout, customer portal, and Stripe webhook delivery succeed.
- Render is kept read-only or paused until the checks pass.
