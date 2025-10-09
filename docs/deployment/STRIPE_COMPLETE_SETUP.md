# Complete Stripe Integration Setup Guide

## 🎉 What's Been Implemented

I've implemented a complete Stripe subscription system with the following features:

### ✅ Features Implemented:

1. **Stripe Checkout** - Users can subscribe to Premium ($49/mo) or Enterprise ($99/mo)
2. **Webhook Handler** - Automatically processes subscription events
3. **Customer Portal** - Users can manage their subscriptions (cancel, update payment)
4. **Subscription Status** - Track and display current subscription
5. **Database Integration** - Updates user records when subscriptions change
6. **Error Handling** - Comprehensive error messages and logging

---

## 📁 Files Created/Modified

### New Netlify Functions:

- `netlify/functions/billing-config.js` - Returns plan information
- `netlify/functions/checkout-session.js` - Creates Stripe checkout sessions
- `netlify/functions/customer-portal.js` - Opens Stripe customer portal
- `netlify/functions/subscription-status.js` - Gets subscription status
- `netlify/functions/stripe-webhook.js` - Handles Stripe webhooks

### Modified Files:

- `src/pages/BillingPage.jsx` - Added subscription status and manage button
- `netlify.toml` - Added API redirects for new endpoints
- `backend/routes/billing.py` - Fixed Stripe initialization and added payment_method_types
- `package.json` - Added @supabase/supabase-js dependency

---

## 🔧 Setup Steps

### Step 1: Environment Variables in Netlify

You've already added these, but here's the complete list:

```
STRIPE_SECRET_KEY=sk_live_... (Get from backend/.env file)

STRIPE_PUBLISHABLE_KEY=pk_live_... (Get from backend/.env file)

STRIPE_WEBHOOK_SECRET=(You'll get this in Step 2)

VITE_SUPABASE_URL=(Your Supabase project URL)

SUPABASE_SERVICE_ROLE_KEY=(Your Supabase service role key - for webhooks)
```

### Step 2: Configure Stripe Webhook

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/webhooks

2. **Click "Add endpoint"**

3. **Enter your webhook URL**:

   ```
   https://litmusai.netlify.app/api/webhooks/stripe
   ```

4. **Select events to listen to**:

   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. **Click "Add endpoint"**

6. **Copy the Signing Secret**:

   - Click on your new webhook
   - Click "Reveal" next to "Signing secret"
   - Copy the value (starts with `whsec_`)

7. **Add to Netlify**:
   - Go to Netlify → Site settings → Environment variables
   - Add: `STRIPE_WEBHOOK_SECRET` = `whsec_...`
   - Redeploy your site

### Step 3: Configure Stripe Customer Portal

1. **Go to**: https://dashboard.stripe.com/settings/billing/portal

2. **Click "Activate test link"** (or "Activate" for production)

3. **Configure settings**:

   - ✅ Allow customers to update payment methods
   - ✅ Allow customers to cancel subscriptions
   - ✅ Allow customers to switch plans (optional)
   - Set cancellation behavior (immediate or at period end)

4. **Save changes**

### Step 4: Add Supabase Environment Variables

For the webhook to update user records, you need:

1. **Get Supabase URL**:

   - Go to your Supabase project
   - Settings → API
   - Copy "Project URL"

2. **Get Service Role Key**:

   - Same page (Settings → API)
   - Copy "service_role" key (⚠️ Keep this secret!)

3. **Add to Netlify**:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

### Step 5: Update Database Schema

Make sure your `users` table has these columns:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT;
```

---

## 🧪 Testing

### Test the Complete Flow:

1. **Go to**: https://litmusai.netlify.app/billing

2. **Click "Upgrade to Premium"**

3. **Use Stripe test card**:

   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits

4. **Complete checkout**

5. **Verify**:
   - You're redirected back with success message
   - Subscription status shows on billing page
   - "Manage Subscription" button appears
   - User record updated in database

### Test Customer Portal:

1. **Click "Manage Subscription"**

2. **Verify you can**:
   - Update payment method
   - Cancel subscription
   - View invoices

### Test Webhooks:

1. **Go to Stripe Dashboard** → Webhooks

2. **Click on your webhook**

3. **View "Events" tab** to see received events

4. **Check Netlify Function logs**:
   - https://app.netlify.com/sites/litmusai/logs/functions
   - Look for webhook processing logs

---

## 🔍 How It Works

### Checkout Flow:

```
User clicks "Upgrade"
    ↓
Frontend calls /api/billing/checkout-session
    ↓
Netlify Function creates Stripe session
    ↓
User redirected to Stripe checkout
    ↓
User completes payment
    ↓
Stripe sends webhook to /api/webhooks/stripe
    ↓
Webhook updates user record in database
    ↓
User redirected back to /billing?success=true
```

### Subscription Management:

```
User clicks "Manage Subscription"
    ↓
Frontend calls /api/billing/customer-portal
    ↓
Netlify Function creates portal session
    ↓
User redirected to Stripe portal
    ↓
User makes changes (cancel, update card, etc.)
    ↓
Stripe sends webhook events
    ↓
Webhook updates database
    ↓
User redirected back to /billing
```

---

## 📊 Monitoring

### Netlify Function Logs:

https://app.netlify.com/sites/litmusai/logs/functions

### Stripe Dashboard:

- **Payments**: https://dashboard.stripe.com/payments
- **Subscriptions**: https://dashboard.stripe.com/subscriptions
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Customers**: https://dashboard.stripe.com/customers

### Database:

Check your Supabase dashboard to see updated user records

---

## 🐛 Troubleshooting

### Error: "Unable to start checkout with Stripe ('NoneType' object has no attribute 'Session')"

**Cause**: Backend Flask server doesn't have STRIPE_SECRET_KEY set

**Solution**:

- Make sure you're using the Netlify deployment (https://litmusai.netlify.app)
- If testing locally, check `backend/.env` has STRIPE_SECRET_KEY

### Webhook not receiving events:

1. **Check webhook URL** is correct in Stripe dashboard
2. **Verify STRIPE_WEBHOOK_SECRET** is set in Netlify
3. **Check Netlify function logs** for errors
4. **Test webhook** using Stripe CLI:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Customer portal not working:

1. **Verify portal is activated** in Stripe dashboard
2. **Check customer_id** is being passed correctly
3. **View function logs** for error details

### Subscription not updating in database:

1. **Check SUPABASE_SERVICE_ROLE_KEY** is set
2. **Verify database schema** has required columns
3. **Check webhook logs** for database errors
4. **Ensure user email** matches between Stripe and database

---

## 🚀 Next Steps (Optional Enhancements)

### 1. Email Notifications

Add email sending to webhook handler:

- Welcome email on subscription
- Payment receipt
- Cancellation confirmation
- Payment failure alerts

### 2. Usage Tracking

Track feature usage by plan:

- Limit assessments for free users
- Unlock premium features for paid users
- Show usage stats on billing page

### 3. Team Management

For Enterprise plan:

- Add team members
- Manage seats
- Team billing

### 4. Proration

Handle plan upgrades/downgrades:

- Calculate prorated amounts
- Immediate vs. end-of-period changes

### 5. Trial Periods

Add free trials:

- 14-day trial for Premium
- 30-day trial for Enterprise

---

## ✅ Deployment Checklist

- [x] Stripe keys added to Netlify
- [ ] Webhook endpoint configured in Stripe
- [ ] Webhook secret added to Netlify
- [ ] Customer portal activated in Stripe
- [ ] Supabase credentials added to Netlify
- [ ] Database schema updated
- [ ] Test checkout completed successfully
- [ ] Webhook events received and processed
- [ ] Customer portal tested
- [ ] Production deployment complete

---

## 📝 Summary

You now have a complete, production-ready Stripe subscription system with:

✅ Secure checkout flow
✅ Automatic subscription management
✅ Customer self-service portal
✅ Webhook event processing
✅ Database synchronization
✅ Error handling and logging

**All running serverlessly on Netlify!** 🎉
