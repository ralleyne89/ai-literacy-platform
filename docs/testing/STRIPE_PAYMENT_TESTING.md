# Stripe Payment Integration - Testing Guide

## Pre-Testing Checklist

Before testing, ensure all fixes have been applied:

- [ ] Database migration has been run in Supabase
- [ ] Backend User model has new Stripe columns
- [ ] Webhook handler uses `subscription_tier` (not `subscription_plan`)
- [ ] Certification TIER_RANK includes "premium"
- [ ] SUPABASE_SERVICE_ROLE_KEY is set in Netlify
- [ ] All Stripe environment variables are configured
- [ ] Application has been redeployed

## Test Environment Setup

### 1. Stripe Test Mode

Use Stripe test keys for testing:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Test Cards

Use these test cards (no real charges):
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

Any future expiry date and any 3-digit CVC will work.

## Test Scenarios

### Test 1: Premium Plan Checkout

**Objective:** Verify user can successfully upgrade to Premium plan

**Steps:**
1. Log in to the application
2. Navigate to `/billing` page
3. Click "Upgrade to Premium" button
4. Verify redirect to Stripe checkout page
5. Fill in test card: `4242 4242 4242 4242`
6. Complete checkout
7. Verify redirect to `/billing?success=true`
8. Check success message is displayed

**Expected Results:**
- ✅ Checkout session created successfully
- ✅ Redirected to Stripe checkout
- ✅ Payment processed successfully
- ✅ Redirected back to billing page with success message
- ✅ No errors in browser console
- ✅ No errors in Netlify function logs

**Database Verification:**
```sql
SELECT 
  email,
  subscription_tier,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status
FROM users
WHERE email = 'your-test-email@example.com';
```

Expected values:
- `subscription_tier` = "premium"
- `stripe_customer_id` = "cus_..." (starts with cus_)
- `stripe_subscription_id` = "sub_..." (starts with sub_)
- `subscription_status` = "active"

### Test 2: Enterprise Plan Checkout

**Objective:** Verify user can successfully upgrade to Enterprise plan

**Steps:**
1. Log in to the application
2. Navigate to `/billing` page
3. Click "Upgrade to Enterprise" button
4. Complete checkout with test card
5. Verify success

**Expected Results:**
- Same as Test 1, but with `subscription_tier` = "enterprise"

### Test 3: Webhook Event Processing

**Objective:** Verify webhooks are received and processed correctly

**Steps:**
1. Complete a test checkout (Test 1 or Test 2)
2. Go to Stripe Dashboard → Developers → Webhooks
3. Click on your webhook endpoint
4. View recent deliveries
5. Find the `checkout.session.completed` event
6. Verify response is 200 OK

**Expected Results:**
- ✅ Webhook event received
- ✅ Response status: 200
- ✅ No errors in response body
- ✅ Database updated correctly

**Netlify Function Logs:**
```
Received webhook event: checkout.session.completed
Customer: test@example.com, Subscription: sub_..., Plan: premium
Updated subscription for user abc123 to premium
```

### Test 4: Premium Content Access

**Objective:** Verify premium users can access premium certifications

**Steps:**
1. Complete premium upgrade (Test 1)
2. Navigate to `/certifications` page
3. Find a premium certification (e.g., "LitmusAI Professional")
4. Click "Apply for Certification"
5. Verify access is granted

**Expected Results:**
- ✅ Premium certifications are accessible
- ✅ No "upgrade required" error
- ✅ User can proceed with certification application

**Database Check:**
```sql
SELECT 
  u.email,
  u.subscription_tier,
  ct.title,
  ct.access_tier,
  ct.is_premium
FROM users u
CROSS JOIN certification_type ct
WHERE u.email = 'your-test-email@example.com'
  AND ct.is_premium = true;
```

### Test 5: Subscription Cancellation

**Objective:** Verify subscription cancellation works correctly

**Steps:**
1. Have an active subscription (from Test 1 or Test 2)
2. Go to Stripe Dashboard → Customers
3. Find your test customer
4. Click on the subscription
5. Click "Cancel subscription"
6. Confirm cancellation
7. Wait for webhook to process (a few seconds)

**Expected Results:**
- ✅ Webhook `customer.subscription.deleted` received
- ✅ Database updated:
  - `subscription_tier` = "free"
  - `subscription_status` = "cancelled"
  - `stripe_subscription_id` = null

**Database Verification:**
```sql
SELECT 
  email,
  subscription_tier,
  subscription_status,
  stripe_subscription_id
FROM users
WHERE email = 'your-test-email@example.com';
```

### Test 6: Failed Payment

**Objective:** Verify failed payment handling

**Steps:**
1. Start checkout process
2. Use decline test card: `4000 0000 0000 0002`
3. Attempt to complete checkout

**Expected Results:**
- ✅ Payment declined by Stripe
- ✅ User shown error message
- ✅ User not charged
- ✅ Database not updated (subscription remains free)

### Test 7: Billing Config API

**Objective:** Verify billing configuration endpoint works

**Steps:**
1. Open browser console
2. Navigate to `/billing` page
3. Check network tab for `/api/billing/config` request

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes:
  - `publishable_key` (Stripe publishable key)
  - `plans` array with 3 plans (free, premium, enterprise)
  - Each plan has `checkout_enabled: true`

**Sample Response:**
```json
{
  "publishable_key": "pk_test_...",
  "plans": [
    {
      "id": "free",
      "name": "Free",
      "amount": 0,
      "checkout_enabled": false,
      "is_free": true
    },
    {
      "id": "premium",
      "name": "Premium",
      "amount": 49,
      "checkout_enabled": true,
      "is_free": false
    },
    {
      "id": "enterprise",
      "name": "Enterprise",
      "amount": 99,
      "checkout_enabled": true,
      "is_free": false
    }
  ]
}
```

## Troubleshooting Tests

### Test Fails: "Stripe is not configured"

**Check:**
1. Verify `STRIPE_SECRET_KEY` is set in Netlify
2. Check key starts with `sk_test_` or `sk_live_`
3. Redeploy after adding environment variable

### Test Fails: Database not updating after payment

**Check:**
1. Verify webhook endpoint is configured in Stripe
2. Check `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify
3. Run database migration script
4. Check Netlify function logs for errors
5. Verify webhook signature secret matches

**Debug Steps:**
```bash
# Check Netlify function logs
netlify functions:log stripe-webhook

# Check Stripe webhook deliveries
# Go to: Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Recent deliveries
```

### Test Fails: "Error updating user subscription"

**Check:**
1. Verify user exists in database with matching email
2. Check database has all required columns
3. Verify SUPABASE_SERVICE_ROLE_KEY has write permissions
4. Check Netlify function logs for detailed error

### Test Fails: Premium content still locked after upgrade

**Check:**
1. Verify `subscription_tier` in database is "premium" or "enterprise"
2. Check TIER_RANK includes "premium" in certification.py
3. Clear browser cache and reload
4. Check user session is refreshed

## Success Criteria

All tests should pass with:
- ✅ No errors in browser console
- ✅ No errors in Netlify function logs
- ✅ Database correctly updated after each action
- ✅ Webhooks successfully processed (200 responses)
- ✅ Premium content accessible after upgrade
- ✅ Subscription cancellation works correctly

## Post-Testing Cleanup

After testing with test mode:

1. **Clean up test data in Stripe:**
   - Delete test customers
   - Cancel test subscriptions

2. **Clean up test data in database:**
   ```sql
   -- Optional: Remove test users
   DELETE FROM users WHERE email LIKE '%test%';
   ```

3. **Switch to production mode** (when ready):
   - Update environment variables to use live keys
   - Test with small real transaction first
   - Monitor webhook logs closely

## Production Testing

Before going live:

1. **Test with live mode and real card:**
   - Use a real card with small amount
   - Verify entire flow works
   - Immediately cancel subscription if testing

2. **Monitor for 24 hours:**
   - Check webhook delivery success rate
   - Monitor for any errors
   - Verify database updates are consistent

3. **Set up alerts:**
   - Stripe webhook failures
   - Database update errors
   - Payment failures

## Reporting Issues

If tests fail, collect this information:

1. **Error messages** from browser console
2. **Netlify function logs** for webhook processing
3. **Stripe webhook delivery logs**
4. **Database state** (subscription_tier, stripe_customer_id, etc.)
5. **Steps to reproduce** the issue

Include all this information when reporting bugs or requesting support.

