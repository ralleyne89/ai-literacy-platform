# Stripe Payment Integration - Quick Reference

## 🚀 Quick Start Deployment

### 1. Run Database Migration (5 minutes)

```sql
-- Copy and paste into Supabase SQL Editor
-- Location: docs/database/stripe_migration.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
```

### 2. Set Netlify Environment Variables (5 minutes)

Go to: Netlify Dashboard → Site Settings → Environment Variables

```bash
STRIPE_SECRET_KEY=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
STRIPE_PUBLISHABLE_KEY=pk_live_51SCvSEChtGt8OBNUB5jaZ2qR3VeTL2nNCKwTSXjqVOhL6viLByGLG3ajSem3OggrP6VPrzaCDyWkw2bK5GH5N2ni00m4eSTLrQ
STRIPE_WEBHOOK_SECRET=whsec_i1UOMTPKRAcQ79dQJt32hmgeYUtMARqq
VITE_SUPABASE_URL=https://sybctfhasyazoryzxjcg.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[GET FROM SUPABASE: Settings → API → Service Role Key]
FRONTEND_URL=https://litmusai.netlify.app
```

**CRITICAL:** Get `SUPABASE_SERVICE_ROLE_KEY` from Supabase Dashboard → Settings → API → Service Role Key (NOT the anon key!)

### 3. Configure Stripe Webhook (5 minutes)

1. Go to: Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://litmusai.netlify.app/api/webhooks/stripe`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Copy webhook signing secret (starts with `whsec_`)
6. Add to Netlify environment variables as `STRIPE_WEBHOOK_SECRET`

### 4. Deploy (2 minutes)

```bash
git add .
git commit -m "Fix Stripe payment integration"
git push origin feat/phase2-auth-dashboard
```

Netlify will auto-deploy (or run `netlify deploy --prod`)

### 5. Test (10 minutes)

1. Go to `/billing` page
2. Click "Upgrade to Premium"
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify success message
6. Check database:
   ```sql
   SELECT email, subscription_tier, stripe_customer_id, subscription_status
   FROM users WHERE email = 'your-email@example.com';
   ```

**Expected:** `subscription_tier = 'premium'`, `subscription_status = 'active'`

---

## 📋 Files Changed

### Backend
- ✅ `backend/models.py` - Added Stripe columns
- ✅ `backend/routes/certification.py` - Added "premium" to tier rank

### Netlify Functions
- ✅ `netlify/functions/stripe-webhook.js` - Fixed column names

### Documentation
- ✅ `docs/database/stripe_migration.sql` - Database migration
- ✅ `docs/deployment/STRIPE_ENVIRONMENT_SETUP.md` - Environment guide
- ✅ `docs/testing/STRIPE_PAYMENT_TESTING.md` - Testing guide
- ✅ `docs/fixes/STRIPE_PAYMENT_FIXES.md` - Fix summary

---

## 🔍 Verification Commands

### Check Netlify Environment Variables
```bash
netlify env:list
```

### Check Netlify Function Logs
```bash
netlify functions:log stripe-webhook
```

### Check Database Schema
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'subscription_tier')
ORDER BY column_name;
```

### Check Recent Subscriptions
```sql
SELECT 
  email,
  subscription_tier,
  stripe_customer_id,
  subscription_status,
  updated_at
FROM users
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;
```

---

## ⚠️ Common Issues

### Issue: "Webhook secret not configured"
**Fix:** Add `STRIPE_WEBHOOK_SECRET` to Netlify and redeploy

### Issue: "Error updating user subscription"
**Fix:** 
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
2. Run database migration
3. Check user exists with matching email

### Issue: Database not updating after payment
**Fix:**
1. Check Netlify function logs: `netlify functions:log stripe-webhook`
2. Check Stripe webhook deliveries in dashboard
3. Verify webhook secret matches
4. Ensure database migration was run

### Issue: Premium content still locked after upgrade
**Fix:**
1. Verify `subscription_tier` in database is "premium"
2. Clear browser cache
3. Log out and log back in
4. Check TIER_RANK includes "premium" in certification.py

---

## 📊 Monitoring

### Stripe Dashboard
- Webhooks → [Your endpoint] → Recent deliveries
- Check for 200 OK responses
- Look for any failed deliveries

### Netlify Dashboard
- Functions → stripe-webhook → Logs
- Check for errors in webhook processing

### Supabase Dashboard
- Table Editor → users
- Verify subscription fields are updating

---

## 🎯 Success Checklist

- [ ] Database migration completed
- [ ] All environment variables set in Netlify
- [ ] Webhook endpoint configured in Stripe
- [ ] Application deployed
- [ ] Test checkout completed successfully
- [ ] Database updated with subscription data
- [ ] Webhook logs show successful processing
- [ ] Premium content accessible after upgrade

---

## 📞 Support

If issues persist after following this guide:

1. Check detailed guides:
   - `docs/deployment/STRIPE_ENVIRONMENT_SETUP.md`
   - `docs/testing/STRIPE_PAYMENT_TESTING.md`
   - `docs/fixes/STRIPE_PAYMENT_FIXES.md`

2. Collect diagnostic information:
   - Browser console errors
   - Netlify function logs
   - Stripe webhook delivery logs
   - Database state

3. Review the fix summary for technical details

---

## 🔐 Security Notes

- **Never commit** Stripe secret keys to git
- **Never expose** service role key in frontend code
- **Always use** environment variables for sensitive data
- **Use test mode** for development and testing
- **Monitor** webhook deliveries for suspicious activity

---

## 🚦 Production Readiness

Before going live with real payments:

1. ✅ All tests pass in test mode
2. ✅ Webhook deliveries are 100% successful
3. ✅ Database updates are consistent
4. ✅ Error handling is working
5. ✅ Monitoring is set up
6. ✅ Backup plan for failed payments
7. ✅ Customer support process defined

Switch to live keys only when all checks pass!

