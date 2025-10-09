# Stripe Payment Integration - Bug Fixes and Resolution

## Issues Identified and Fixed

### 1. Database Schema Mismatch ✅ FIXED

**Problem:**

- Webhook handler was trying to update `subscription_plan` column
- Backend database model only had `subscription_tier` column
- Missing Stripe-related columns: `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`

**Solution:**

- Updated `backend/models.py` to add missing columns:
  - `stripe_customer_id` (String, nullable)
  - `stripe_subscription_id` (String, nullable)
  - `subscription_status` (String, nullable)
- Updated webhook handler to use `subscription_tier` instead of `subscription_plan`
- Created database migration script: `docs/database/stripe_migration.sql`

**Files Changed:**

- `backend/models.py` - Added Stripe columns to User model
- `netlify/functions/stripe-webhook.js` - Fixed column name from `subscription_plan` to `subscription_tier`
- `docs/database/stripe_migration.sql` - New migration script

### 2. Missing Environment Variables Documentation ✅ FIXED

**Problem:**

- Critical environment variable `SUPABASE_SERVICE_ROLE_KEY` was not documented
- Confusion between anon key and service role key
- Incomplete setup instructions

**Solution:**

- Created comprehensive environment setup guide: `docs/deployment/STRIPE_ENVIRONMENT_SETUP.md`
- Documented all required environment variables for:
  - Netlify Functions
  - Backend API
  - Frontend
- Added troubleshooting section
- Clarified difference between anon key and service role key

**Files Changed:**

- `docs/deployment/STRIPE_ENVIRONMENT_SETUP.md` - New comprehensive guide

### 3. Webhook Handler Improvements ✅ FIXED

**Problem:**

- Inconsistent column naming between webhook and database
- Subscription cancellation handler also used wrong column name

**Solution:**

- Updated `handleCheckoutSessionCompleted` to use `subscription_tier`
- Updated `handleSubscriptionDeleted` to use `subscription_tier`
- Improved logging to show which plan user was upgraded to

**Files Changed:**

- `netlify/functions/stripe-webhook.js` - Fixed both handlers

## Required Actions for Deployment

### Step 1: Run Database Migration

Execute the SQL migration in Supabase SQL Editor:

```bash
# Location: docs/database/stripe_migration.sql
```

This will:

- Add `stripe_customer_id` column
- Add `stripe_subscription_id` column
- Add `subscription_status` column
- Create indexes for performance
- Set default values for existing users

### Step 2: Set Environment Variables in Netlify

Go to Netlify Dashboard → Site Settings → Environment Variables and add:

```bash
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SCvSEChtGt8OBNUB5jaZ2qR3VeTL2nNCKwTSXjqVOhL6viLByGLG3ajSem3OggrP6VPrzaCDyWkw2bK5GH5N2ni00m4eSTLrQ
STRIPE_WEBHOOK_SECRET=whsec_i1UOMTPKRAcQ79dQJt32hmgeYUtMARqq
VITE_SUPABASE_URL=https://sybctfhasyazoryzxjcg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[GET FROM SUPABASE DASHBOARD]
FRONTEND_URL=https://litmusai.netlify.app
```

**CRITICAL:** You need to get the `SUPABASE_SERVICE_ROLE_KEY` from:

- Supabase Dashboard → Settings → API → Service Role Key

### Step 3: Update Backend Database

If using local SQLite for development:

```bash
cd backend
python
>>> from app import app, db
>>> with app.app_context():
...     db.create_all()
>>> exit()
```

This will add the new columns to your local database.

### Step 4: Redeploy

```bash
# Commit changes
git add .
git commit -m "Fix Stripe payment integration - add missing columns and fix webhook handler"
git push origin feat/phase2-auth-dashboard

# Deploy to Netlify (if auto-deploy is not enabled)
netlify deploy --prod
```

### Step 5: Verify Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Verify endpoint: `https://litmusai.netlify.app/api/webhooks/stripe`
3. Ensure these events are selected:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Testing the Fix

### Test Checkout Flow

1. Go to `/billing` page
2. Click "Upgrade to Premium" or "Upgrade to Enterprise"
3. Complete checkout with test card: `4242 4242 4242 4242`
4. Verify redirect to `/billing?success=true`
5. Check Supabase users table - verify these fields are updated:
   - `subscription_tier` = "premium" or "enterprise"
   - `stripe_customer_id` = "cus\_..."
   - `stripe_subscription_id` = "sub\_..."
   - `subscription_status` = "active"

### Test Webhook Delivery

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. View recent deliveries
4. Verify successful 200 responses
5. Check Netlify function logs for webhook processing

### Verify Database Updates

```sql
-- Run in Supabase SQL Editor
SELECT
  email,
  subscription_tier,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  updated_at
FROM users
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

## Common Errors and Solutions

### Error: "column subscription_plan does not exist"

**Solution:** Run the database migration script

### Error: "Webhook secret not configured"

**Solution:** Add `STRIPE_WEBHOOK_SECRET` to Netlify environment variables and redeploy

### Error: "Error updating user subscription" in webhook logs

**Solution:**

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
2. Run database migration to add missing columns
3. Check that user exists with matching email

### Webhook receives events but database not updating

**Solution:**

1. Check Netlify function logs for errors
2. Verify SUPABASE_SERVICE_ROLE_KEY has write permissions
3. Ensure database migration was run successfully

## Summary of Changes

### 4. Tier Naming Inconsistency ✅ FIXED

**Problem:**

- Payment system uses "premium" tier
- Certification system expected "professional" tier
- Users upgrading to "premium" couldn't access premium certifications

**Solution:**

- Added "premium" to TIER_RANK mapping in certification.py
- Both "premium" and "professional" now have rank 1 (same access level)
- Maintains backward compatibility

**Files Changed:**

- `backend/routes/certification.py` - Added "premium" to TIER_RANK

### Code Changes

- ✅ Added 3 new columns to User model
- ✅ Fixed webhook handler column naming (2 locations)
- ✅ Improved webhook logging
- ✅ Fixed tier rank mapping to support "premium" tier

### Documentation Added

- ✅ Database migration script
- ✅ Environment setup guide
- ✅ Tier naming clarification document
- ✅ This fix summary document

### Configuration Required

- ⚠️ Run database migration in Supabase
- ⚠️ Add SUPABASE_SERVICE_ROLE_KEY to Netlify
- ⚠️ Redeploy application

## Next Steps

1. Run the database migration
2. Set the missing environment variable
3. Redeploy the application
4. Test the complete payment flow
5. Monitor webhook logs for any errors

The payment integration should now work correctly with proper database updates after successful payments.
