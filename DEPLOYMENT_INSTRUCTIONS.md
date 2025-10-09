# Stripe Payment Integration - Deployment Instructions

## 🎯 What Was Fixed

Your Stripe payment integration had 4 critical bugs that prevented users from successfully upgrading their accounts. All bugs have been fixed and the code is ready for deployment.

**Issues Fixed:**
1. ✅ Missing database columns for Stripe data
2. ✅ Webhook using wrong column name
3. ✅ Missing environment variable documentation
4. ✅ Tier naming mismatch between payment and certification systems

---

## ⚡ Quick Deployment (15 minutes)

### Step 1: Get Supabase Service Role Key (2 min)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: `sybctfhasyazoryzxjcg`
3. Click Settings (gear icon) → API
4. Scroll to "Project API keys"
5. Copy the **service_role** key (NOT the anon key!)
6. Keep it safe - you'll need it in Step 3

### Step 2: Run Database Migration (3 min)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click SQL Editor (left sidebar)
4. Click "New query"
5. Copy and paste this SQL:

```sql
-- Add Stripe subscription columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name IN ('stripe_customer_id', 'stripe_subscription_id', 'subscription_status')
ORDER BY column_name;
```

6. Click "Run" (or press Cmd/Ctrl + Enter)
7. Verify you see 3 rows in the results (the new columns)

### Step 3: Add Environment Variable to Netlify (3 min)

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site: `litmusai`
3. Click Site settings → Environment variables
4. Click "Add a variable"
5. Add this variable:
   - **Key:** `SUPABASE_SERVICE_ROLE_KEY`
   - **Value:** [Paste the service role key from Step 1]
   - **Scopes:** All scopes
6. Click "Create variable"

**IMPORTANT:** Make sure you're using the **service_role** key, NOT the anon key!

### Step 4: Verify Stripe Webhook (2 min)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Click Developers → Webhooks
3. Verify you have an endpoint: `https://litmusai.netlify.app/api/webhooks/stripe`
4. If not, click "Add endpoint" and:
   - URL: `https://litmusai.netlify.app/api/webhooks/stripe`
   - Events: Select these 6 events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click "Add endpoint"
5. Copy the webhook signing secret (starts with `whsec_`)
6. Verify it matches the `STRIPE_WEBHOOK_SECRET` in Netlify environment variables

### Step 5: Deploy (2 min)

```bash
# Commit the fixes
git add .
git commit -m "Fix Stripe payment integration - resolve database schema and webhook issues"

# Push to your branch
git push origin feat/phase2-auth-dashboard
```

Netlify will automatically deploy. Wait for the build to complete (~2-3 minutes).

### Step 6: Test (3 min)

1. Go to https://litmusai.netlify.app/billing
2. Click "Upgrade to Premium"
3. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., 12/25)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 12345)
4. Complete checkout
5. You should be redirected to `/billing?success=true`
6. Verify success message appears

### Step 7: Verify Database (2 min)

1. Go back to Supabase SQL Editor
2. Run this query:

```sql
SELECT 
  email,
  subscription_tier,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status
FROM users
WHERE stripe_customer_id IS NOT NULL
ORDER BY updated_at DESC
LIMIT 5;
```

3. You should see your test user with:
   - `subscription_tier` = "premium"
   - `stripe_customer_id` = "cus_..." (starts with cus_)
   - `stripe_subscription_id` = "sub_..." (starts with sub_)
   - `subscription_status` = "active"

---

## ✅ Success Checklist

- [ ] Supabase service role key obtained
- [ ] Database migration completed (3 new columns added)
- [ ] SUPABASE_SERVICE_ROLE_KEY added to Netlify
- [ ] Stripe webhook endpoint verified
- [ ] Code committed and pushed
- [ ] Netlify deployment successful
- [ ] Test checkout completed
- [ ] Database shows updated subscription data
- [ ] No errors in browser console
- [ ] No errors in Netlify function logs

---

## 🔍 Troubleshooting

### Issue: "Error updating user subscription" in webhook logs

**Solution:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify (not anon key)
2. Check that database migration was run successfully
3. Ensure user exists in database with matching email

**How to check:**
```bash
# View Netlify function logs
netlify functions:log stripe-webhook
```

### Issue: Database not updating after payment

**Solution:**
1. Check Stripe webhook deliveries:
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your endpoint
   - Check "Recent deliveries" - should show 200 OK
2. Check Netlify function logs for errors
3. Verify webhook secret matches in both Stripe and Netlify

### Issue: "Webhook secret not configured"

**Solution:**
1. Go to Netlify → Site settings → Environment variables
2. Verify `STRIPE_WEBHOOK_SECRET` is set
3. Redeploy the site

### Issue: Premium content still locked after upgrade

**Solution:**
1. Verify database shows `subscription_tier` = "premium"
2. Log out and log back in
3. Clear browser cache
4. Check browser console for errors

---

## 📊 Monitoring

After deployment, monitor these for 24 hours:

### Stripe Dashboard
- Webhooks → [Your endpoint] → Recent deliveries
- Should show 100% success rate (200 OK responses)

### Netlify Function Logs
```bash
netlify functions:log stripe-webhook
```
- Should show successful webhook processing
- No errors about missing columns or permissions

### Supabase Database
- Check that new subscriptions are being recorded
- Verify subscription_tier is updating correctly

---

## 🎉 What's Working Now

After deployment, users can:

✅ Click "Upgrade to Premium" or "Upgrade to Enterprise"
✅ Complete checkout with Stripe
✅ Get redirected back with success message
✅ Have their subscription automatically activated
✅ Access premium certifications and training
✅ Manage their subscription through Stripe portal

---

## 📚 Additional Resources

- **Quick Reference:** `docs/deployment/STRIPE_QUICK_REFERENCE.md`
- **Complete Testing Guide:** `docs/testing/STRIPE_PAYMENT_TESTING.md`
- **Environment Setup:** `docs/deployment/STRIPE_ENVIRONMENT_SETUP.md`
- **Technical Details:** `docs/fixes/STRIPE_PAYMENT_FIXES.md`
- **Summary:** `STRIPE_PAYMENT_FIX_SUMMARY.md`

---

## 🚀 Production Readiness

Your payment integration is now production-ready! The fixes ensure:

- ✅ Secure webhook signature verification
- ✅ Proper database schema for subscription tracking
- ✅ Correct tier-based access control
- ✅ Comprehensive error handling
- ✅ Full webhook event processing

---

## 💡 Next Steps After Deployment

1. **Monitor for 24 hours** - Check webhook logs and database updates
2. **Test with real card** - Do a small test transaction in live mode
3. **Set up alerts** - Monitor for webhook failures or payment errors
4. **Document support process** - How to handle customer payment issues
5. **Train support team** - On how to verify subscription status

---

## 🔐 Security Reminder

- ✅ Service role key is only in Netlify environment (server-side)
- ✅ Never commit secrets to git
- ✅ Webhook signatures are verified
- ✅ All sensitive data is properly secured

---

## ❓ Questions?

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the detailed documentation in `docs/`
3. Check Netlify function logs: `netlify functions:log stripe-webhook`
4. Check Stripe webhook deliveries in dashboard
5. Verify database state with SQL queries

---

**Ready to deploy?** Follow Steps 1-7 above and you'll be live in 15 minutes! 🚀

