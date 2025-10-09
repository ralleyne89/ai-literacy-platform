# Stripe Payment Integration - Environment Setup Guide

This guide covers all required environment variables for the Stripe payment integration to work correctly.

## Required Environment Variables

### 1. Netlify Environment Variables

Set these in your Netlify dashboard (Site settings → Environment variables):

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_... # Get this from Stripe webhook settings

# Supabase Configuration (for webhook database updates)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci... # IMPORTANT: Service role key, not anon key!

# Frontend URL (for redirects)
FRONTEND_URL=https://your-site.netlify.app
URL=https://your-site.netlify.app # Netlify sets this automatically

# Optional: Mock mode for testing without real Stripe calls
STRIPE_MOCK_MODE=false # Set to "true" to enable mock mode
```

### 2. Backend Environment Variables (backend/.env)

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_live_... # or sk_test_... for testing
STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_... # Get this from Stripe webhook settings

# Supabase JWT Secret (for validating tokens)
SUPABASE_JWT_SECRET=your-jwt-secret

# Frontend URL
FRONTEND_URL=http://localhost:5173 # or production URL

# Optional: Stripe Price IDs (if using predefined prices instead of dynamic pricing)
STRIPE_PRICE_PREMIUM=price_... # Optional
STRIPE_PRICE_ENTERPRISE=price_... # Optional
```

### 3. Frontend Environment Variables (.env)

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci... # Public anon key

# Stripe Publishable Key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_... # or pk_test_... for testing

# API URL
VITE_API_URL=http://localhost:5001 # or production backend URL
```

## Critical Notes

### SUPABASE_SERVICE_ROLE_KEY vs VITE_SUPABASE_ANON_KEY

**IMPORTANT:** The webhook handler needs the **Service Role Key**, NOT the anon key!

- **VITE_SUPABASE_ANON_KEY**: Public key for frontend, limited permissions
- **SUPABASE_SERVICE_ROLE_KEY**: Private key for backend/webhooks, full database access

To get your Service Role Key:
1. Go to Supabase Dashboard
2. Settings → API
3. Copy the `service_role` key (keep it secret!)

### Webhook Secret Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-site.netlify.app/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add it to Netlify environment variables as `STRIPE_WEBHOOK_SECRET`

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

- [ ] Netlify has all required variables set
- [ ] Backend .env file has Stripe keys
- [ ] Frontend .env file has Supabase and Stripe publishable key
- [ ] Webhook endpoint is configured in Stripe dashboard
- [ ] SUPABASE_SERVICE_ROLE_KEY is set (not anon key!)
- [ ] Database migration has been run (see stripe_migration.sql)
- [ ] Test checkout flow works
- [ ] Webhook successfully updates database

## Troubleshooting

### "Webhook secret not configured" error
- Check that `STRIPE_WEBHOOK_SECRET` is set in Netlify environment variables
- Redeploy after adding the variable

### "Error updating user subscription" in webhook logs
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
- Check that database migration has been run
- Verify user exists in database with matching email

### "Stripe is not configured" error on checkout
- Check that `STRIPE_SECRET_KEY` is set
- Verify the key starts with `sk_test_` or `sk_live_`
- Check backend logs for more details

### Database not updating after successful payment
- Check Netlify function logs for webhook errors
- Verify webhook endpoint is receiving events in Stripe dashboard
- Ensure database columns exist (run migration script)
- Verify SUPABASE_SERVICE_ROLE_KEY has write permissions

## Database Schema Requirements

The users table must have these columns (run the migration script):

```sql
subscription_tier TEXT DEFAULT 'free'
stripe_customer_id TEXT
stripe_subscription_id TEXT
subscription_status TEXT
```

See `docs/database/stripe_migration.sql` for the complete migration script.

