# Stripe Checkout Troubleshooting Guide

## Current Status

You've successfully:
- ✅ Rotated your Stripe secret key in Stripe Dashboard
- ✅ Updated `STRIPE_SECRET_KEY` in Netlify environment variables
- ✅ Deployment completed successfully

**Issue**: Clicking "Upgrade to Premium" or "Upgrade to Enterprise" shows error: "We could not start the checkout session."

---

## Step-by-Step Diagnostic Process

### Step 1: Wait for Deployment to Complete

The latest code with enhanced error logging has been pushed. Wait for Netlify to deploy:

1. Go to: https://app.netlify.com/sites/litmusai/deploys
2. Wait for the build to complete (~2-3 minutes)
3. Look for "Published" status

---

### Step 2: Test Stripe Connection

Once deployed, test the Stripe API connection:

**Visit this URL in your browser:**
```
https://litmusai.netlify.app/.netlify/functions/test-stripe-connection
```

**Expected Response:**
```json
{
  "environment": {
    "STRIPE_SECRET_KEY": "SET (starts with: sk_live_51...)",
    "STRIPE_PUBLISHABLE_KEY": "SET (starts with: pk_live_51...)",
    "STRIPE_WEBHOOK_SECRET": "SET",
    "URL": "https://litmusai.netlify.app",
    "FRONTEND_URL": "https://litmusai.netlify.app"
  },
  "stripeConnection": {
    "status": "SUCCESS",
    "message": "Stripe API connection successful"
  }
}
```

**If you see errors:**

#### Error: "STRIPE_SECRET_KEY: NOT SET"
- The environment variable is not set in Netlify
- Go to: https://app.netlify.com/sites/litmusai/configuration/env
- Add `STRIPE_SECRET_KEY` with your new rotated key
- Trigger new deployment

#### Error: "StripeAuthenticationError"
- The API key is invalid or expired
- Double-check you copied the correct key from Stripe Dashboard
- Make sure you're using the **Secret key** (starts with `sk_live_` or `sk_test_`)
- NOT the Publishable key (starts with `pk_`)

---

### Step 3: Check Browser Console for Detailed Errors

1. Open https://litmusai.netlify.app/billing
2. Open browser DevTools (F12 or Right-click → Inspect)
3. Go to **Console** tab
4. Click "Upgrade to Premium"
5. Look for error messages

**What to look for:**

```javascript
// Good - Request is being sent
POST https://litmusai.netlify.app/api/billing/checkout-session

// Bad - Network error
Failed to fetch
net::ERR_CONNECTION_REFUSED

// Bad - CORS error
Access to XMLHttpRequest blocked by CORS policy
```

**Copy any error messages you see and check them against the solutions below.**

---

### Step 4: Check Netlify Function Logs

1. Go to: https://app.netlify.com/sites/litmusai/functions
2. Click on **"checkout-session"** function
3. Click **"Function log"** tab
4. Try the checkout again
5. Refresh the logs

**What to look for:**

#### Success Log:
```
Checkout request: { plan: 'premium', email: 'provided' }
```

#### Error Logs:

**"STRIPE_SECRET_KEY is not set in environment variables"**
- Solution: Add the environment variable in Netlify
- Go to: https://app.netlify.com/sites/litmusai/configuration/env

**"StripeAuthenticationError: Invalid API Key provided"**
- Solution: The API key is wrong
- Verify you copied the correct key from Stripe Dashboard
- Make sure it starts with `sk_live_` or `sk_test_`

**"StripeInvalidRequestError"**
- Solution: Check the error details for specific issue
- Could be invalid plan configuration
- Could be missing required fields

---

### Step 5: Verify Environment Variables in Netlify

Go to: https://app.netlify.com/sites/litmusai/configuration/env

**Required Variables:**

| Variable Name | Expected Value | Status |
|--------------|----------------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_51...` (your NEW rotated key) | ⚠️ CHECK |
| `STRIPE_PUBLISHABLE_KEY` | `pk_live_51...` | ✅ Should be set |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | ✅ Should be set |
| `VITE_SUPABASE_URL` | `https://...supabase.co` | ✅ Should be set |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | ✅ Should be set |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | ✅ Should be set |
| `FRONTEND_URL` | `https://litmusai.netlify.app` | ✅ Should be set |

**Important:**
- After adding/updating ANY environment variable, you MUST trigger a new deployment
- Go to: https://app.netlify.com/sites/litmusai/deploys
- Click "Trigger deploy" → "Deploy site"

---

### Step 6: Test with Browser Network Tab

1. Open https://litmusai.netlify.app/billing
2. Open DevTools (F12) → **Network** tab
3. Click "Upgrade to Premium"
4. Look for the request to `/api/billing/checkout-session`

**Click on the request and check:**

#### Request Tab:
```json
{
  "plan": "premium",
  "email": "your-email@example.com"
}
```

#### Response Tab:

**Success Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error Response:**
```json
{
  "error": "Unable to start checkout with Stripe",
  "details": "Invalid API Key provided",
  "hint": "Verify STRIPE_SECRET_KEY is correct..."
}
```

**Copy the exact error response and use it to diagnose the issue.**

---

## Common Issues and Solutions

### Issue 1: "Stripe authentication failed - Invalid API key"

**Cause**: The `STRIPE_SECRET_KEY` in Netlify doesn't match your rotated key

**Solution:**
1. Go to Stripe Dashboard: https://dashboard.stripe.com/apikeys
2. Copy your **Secret key** (click "Reveal test key" or "Reveal live key")
3. Go to Netlify: https://app.netlify.com/sites/litmusai/configuration/env
4. Find `STRIPE_SECRET_KEY`
5. Click "Options" → "Edit"
6. Paste the NEW key
7. Click "Save"
8. Trigger new deployment

---

### Issue 2: "STRIPE_SECRET_KEY is not set"

**Cause**: Environment variable is missing or not deployed

**Solution:**
1. Add the variable in Netlify (see Issue 1)
2. **IMPORTANT**: Trigger a new deployment
3. Wait for deployment to complete
4. Test again

---

### Issue 3: "Email is required to start checkout"

**Cause**: User is not logged in and didn't provide email

**Solution:**
- This is expected behavior
- A prompt should appear asking for email
- If not, check browser console for JavaScript errors

---

### Issue 4: Network Error / Cannot connect

**Cause**: Netlify Functions not deployed or network issue

**Solution:**
1. Check deployment status: https://app.netlify.com/sites/litmusai/deploys
2. Verify functions are deployed: https://app.netlify.com/sites/litmusai/functions
3. Should see: `checkout-session`, `billing-config`, `stripe-webhook`, etc.

---

### Issue 5: CORS Error

**Cause**: Cross-origin request blocked

**Solution:**
- This shouldn't happen since frontend and functions are on same domain
- If you see this, check that you're accessing `https://litmusai.netlify.app` (not localhost)
- Clear browser cache and try again

---

## Quick Diagnostic Checklist

Run through this checklist:

- [ ] Deployment completed successfully
- [ ] Test Stripe connection endpoint returns "SUCCESS"
- [ ] `STRIPE_SECRET_KEY` is set in Netlify (starts with `sk_live_` or `sk_test_`)
- [ ] `STRIPE_SECRET_KEY` matches the rotated key from Stripe Dashboard
- [ ] Triggered new deployment after updating environment variables
- [ ] Browser console shows no JavaScript errors
- [ ] Network tab shows request to `/api/billing/checkout-session`
- [ ] Response includes specific error message (not generic)
- [ ] Netlify function logs show the request

---

## Next Steps

### After Deployment Completes:

1. **Test the diagnostic endpoint:**
   ```
   https://litmusai.netlify.app/.netlify/functions/test-stripe-connection
   ```
   - Copy the full response
   - Share it if you need help

2. **Try checkout again:**
   - Go to: https://litmusai.netlify.app/billing
   - Click "Upgrade to Premium"
   - Note the EXACT error message

3. **Check function logs:**
   - Go to: https://app.netlify.com/sites/litmusai/functions/checkout-session
   - Look at the logs
   - Copy any error messages

4. **Share the following if issue persists:**
   - Response from test-stripe-connection endpoint
   - Exact error message from billing page
   - Error from browser console (if any)
   - Error from Netlify function logs (if any)

---

## Expected Behavior (When Working)

1. User clicks "Upgrade to Premium"
2. If not logged in, prompt appears for email
3. Loading spinner shows "Redirecting..."
4. User is redirected to Stripe Checkout page
5. URL changes to `https://checkout.stripe.com/c/pay/cs_...`

---

## Contact Information

If you've gone through all steps and still have issues, provide:

1. ✅ Response from: `https://litmusai.netlify.app/.netlify/functions/test-stripe-connection`
2. ✅ Screenshot of error message on billing page
3. ✅ Browser console errors (if any)
4. ✅ Netlify function logs (if any)

This will help diagnose the exact issue quickly.

