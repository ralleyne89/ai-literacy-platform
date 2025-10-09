# 🚀 Quick Setup Checklist - Get Everything Working in 10 Minutes

Follow these steps in order. I'll help you with each one!

---

## ✅ Step 1: Verify Netlify Environment Variables (2 minutes)

I've opened the Netlify environment variables page in your browser.

**Check that you have these 2 variables**:
- [ ] `STRIPE_SECRET_KEY` = `sk_live_...`
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_live_...`

**If they're there**: ✅ Great! Move to Step 2.

**If they're missing**: Add them now:
1. Click "Add a variable"
2. Key: `STRIPE_SECRET_KEY`, Value: (get from `backend/.env` file)
3. Click "Add a variable" again
4. Key: `STRIPE_PUBLISHABLE_KEY`, Value: (get from `backend/.env` file)
5. Redeploy: `netlify deploy --prod`

---

## ✅ Step 2: Configure Stripe Webhook (5 minutes)

This enables automatic subscription updates.

### 2.1 Open Stripe Webhooks Page
Go to: https://dashboard.stripe.com/webhooks

### 2.2 Add New Endpoint
1. Click **"Add endpoint"** button
2. **Endpoint URL**: Enter this exactly:
   ```
   https://litmusai.netlify.app/api/webhooks/stripe
   ```

### 2.3 Select Events to Listen To
Click **"Select events"** and choose these 6 events:

- [ ] `checkout.session.completed`
- [ ] `customer.subscription.created`
- [ ] `customer.subscription.updated`
- [ ] `customer.subscription.deleted`
- [ ] `invoice.payment_succeeded`
- [ ] `invoice.payment_failed`

### 2.4 Save the Endpoint
1. Click **"Add endpoint"**
2. You'll see your new webhook in the list

### 2.5 Get the Signing Secret
1. Click on your new webhook endpoint
2. Find **"Signing secret"** section
3. Click **"Reveal"**
4. Copy the secret (starts with `whsec_`)

### 2.6 Add to Netlify
1. Go back to: https://app.netlify.com/sites/litmusai/configuration/env
2. Click **"Add a variable"**
3. Key: `STRIPE_WEBHOOK_SECRET`
4. Value: Paste the `whsec_...` value you copied
5. Click **"Save"**

### 2.7 Redeploy
Run this command:
```bash
netlify deploy --prod
```

**✅ Done!** Webhooks are now configured.

---

## ✅ Step 3: Activate Stripe Customer Portal (2 minutes)

This allows users to manage their subscriptions.

### 3.1 Open Customer Portal Settings
Go to: https://dashboard.stripe.com/settings/billing/portal

### 3.2 Activate the Portal
1. Click **"Activate test link"** (or **"Activate"** if in production mode)

### 3.3 Configure Settings
Enable these options:
- [x] **Allow customers to update payment methods**
- [x] **Allow customers to cancel subscriptions**

Optional settings:
- Cancellation behavior: Choose "Cancel immediately" or "Cancel at period end"
- Invoice history: Enable to show past invoices

### 3.4 Save
Click **"Save changes"**

**✅ Done!** Customer portal is now active.

---

## ✅ Step 4: Add Supabase Integration (3 minutes) - OPTIONAL

This enables automatic database updates when subscriptions change.

**Skip this if you don't want database integration yet.**

### 4.1 Get Supabase Credentials
1. Go to your Supabase project
2. Click **Settings** → **API**
3. Copy **"Project URL"** (looks like `https://xxx.supabase.co`)
4. Copy **"service_role"** key (⚠️ This is secret! Don't share it)

### 4.2 Add to Netlify
1. Go to: https://app.netlify.com/sites/litmusai/configuration/env
2. Add variable:
   - Key: `VITE_SUPABASE_URL`
   - Value: Your project URL
3. Add another variable:
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Your service role key

### 4.3 Update Database Schema
Run this SQL in Supabase SQL Editor:

```sql
-- Add subscription columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
```

### 4.4 Redeploy
```bash
netlify deploy --prod
```

**✅ Done!** Database integration is now active.

---

## 🧪 Test Everything

### Test 1: Checkout Flow
1. Go to: https://litmusai.netlify.app/billing
2. Click **"Upgrade to Premium"**
3. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
4. Click **"Subscribe"**
5. **Expected**: Redirected back to billing page with success message

### Test 2: Webhook (After Step 2)
1. Complete a test checkout
2. Go to: https://dashboard.stripe.com/webhooks
3. Click on your webhook
4. Check **"Events"** tab - you should see events received
5. Go to: https://app.netlify.com/sites/litmusai/logs/functions
6. Look for `stripe-webhook` logs

### Test 3: Customer Portal (After Step 3)
1. Complete a test checkout first
2. Go to: https://litmusai.netlify.app/billing
3. You should see a blue banner showing your subscription
4. Click **"Manage Subscription"**
5. **Expected**: Redirected to Stripe customer portal
6. Try updating payment method or cancelling

### Test 4: Database Update (After Step 4)
1. Complete a test checkout
2. Go to Supabase → Table Editor → users table
3. Find your user record
4. Check that these fields are updated:
   - `subscription_plan` = "premium" or "enterprise"
   - `stripe_customer_id` = "cus_..."
   - `stripe_subscription_id` = "sub_..."
   - `subscription_status` = "active"

---

## 📋 Quick Reference

### Environment Variables Needed:
```
✅ STRIPE_SECRET_KEY (Already set)
✅ STRIPE_PUBLISHABLE_KEY (Already set)
⏳ STRIPE_WEBHOOK_SECRET (Add in Step 2)
⏳ VITE_SUPABASE_URL (Optional - Step 4)
⏳ SUPABASE_SERVICE_ROLE_KEY (Optional - Step 4)
```

### Stripe Dashboard Links:
- Webhooks: https://dashboard.stripe.com/webhooks
- Customer Portal: https://dashboard.stripe.com/settings/billing/portal
- Payments: https://dashboard.stripe.com/payments
- Subscriptions: https://dashboard.stripe.com/subscriptions

### Netlify Links:
- Environment Variables: https://app.netlify.com/sites/litmusai/configuration/env
- Function Logs: https://app.netlify.com/sites/litmusai/logs/functions
- Deployments: https://app.netlify.com/sites/litmusai/deploys

### Your Site:
- Billing Page: https://litmusai.netlify.app/billing
- Homepage: https://litmusai.netlify.app

---

## ❓ Troubleshooting

### Checkout not working?
- Check that both Stripe keys are set in Netlify
- Check browser console for errors (F12)
- Check Netlify function logs

### Webhook not receiving events?
- Verify webhook URL is exactly: `https://litmusai.netlify.app/api/webhooks/stripe`
- Check that `STRIPE_WEBHOOK_SECRET` is set in Netlify
- Check Stripe dashboard → Webhooks → Events tab

### Customer portal not opening?
- Verify portal is activated in Stripe dashboard
- Check that you completed a checkout first
- Check Netlify function logs for errors

### Database not updating?
- Verify Supabase credentials are set in Netlify
- Check that database columns exist
- Check webhook logs for database errors

---

## ✅ Completion Checklist

- [ ] Step 1: Netlify environment variables verified
- [ ] Step 2: Stripe webhook configured
- [ ] Step 3: Customer portal activated
- [ ] Step 4: Supabase integration (optional)
- [ ] Test 1: Checkout works
- [ ] Test 2: Webhook receives events
- [ ] Test 3: Customer portal opens
- [ ] Test 4: Database updates (if Step 4 done)

---

## 🎉 You're Done!

Once you complete Steps 1-3, you'll have a fully functional subscription system!

**Need help?** Let me know which step you're on and I'll guide you through it.

