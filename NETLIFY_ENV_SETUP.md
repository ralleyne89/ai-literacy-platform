# Netlify Environment Variables Setup

## Required Environment Variables for Stripe Integration

To enable the Stripe payment system on your Netlify deployment, you need to configure the following environment variables:

### 1. Stripe Keys

Go to **Netlify Dashboard** → **Site Settings** → **Environment Variables** and add:

#### **STRIPE_SECRET_KEY** (Required)
- **Value**: Your Stripe Secret Key (starts with `sk_live_` or `sk_test_`)
- **Purpose**: Used by Netlify Functions to create checkout sessions and process payments
- **Where to find**: Stripe Dashboard → Developers → API Keys

#### **STRIPE_PUBLISHABLE_KEY** (Required)
- **Value**: Your Stripe Publishable Key (starts with `pk_live_` or `pk_test_`)
- **Purpose**: Returned to the frontend for Stripe.js integration
- **Where to find**: Stripe Dashboard → Developers → API Keys

#### **STRIPE_WEBHOOK_SECRET** (Required)
- **Value**: Your Stripe Webhook Signing Secret (starts with `whsec_`)
- **Purpose**: Validates webhook events from Stripe
- **Where to find**: Stripe Dashboard → Developers → Webhooks → Select your webhook → Signing secret

### 2. Supabase Keys

#### **SUPABASE_URL** (Required)
- **Value**: Your Supabase project URL
- **Example**: `https://xxxxxxxxxxxxx.supabase.co`
- **Where to find**: Supabase Dashboard → Project Settings → API

#### **SUPABASE_SERVICE_ROLE_KEY** (Required)
- **Value**: Your Supabase Service Role Key
- **Purpose**: Allows Netlify Functions to update user subscription data
- **Where to find**: Supabase Dashboard → Project Settings → API → Service Role Key
- **⚠️ IMPORTANT**: This is a secret key with admin privileges. Never expose it to the frontend!

### 3. Optional Variables

#### **STRIPE_MOCK_MODE** (Optional)
- **Value**: `true` or `false`
- **Purpose**: Enable mock checkout for testing without real Stripe API calls
- **Default**: `false`

#### **URL** (Auto-set by Netlify)
- **Value**: Your site URL (e.g., `https://litmusai.netlify.app`)
- **Purpose**: Used for redirect URLs after checkout
- **Note**: Netlify sets this automatically, but you can override if needed

---

## How to Add Environment Variables to Netlify

### Method 1: Via Netlify Dashboard (Recommended)

1. Go to https://app.netlify.com/sites/litmusai/configuration/env
2. Click **"Add a variable"** or **"Add environment variables"**
3. For each variable:
   - Enter the **Key** (e.g., `STRIPE_SECRET_KEY`)
   - Enter the **Value** (paste your key)
   - Select **"All scopes"** (or specific deploy contexts if needed)
   - Click **"Create variable"**
4. After adding all variables, trigger a new deployment

### Method 2: Via Netlify CLI

```bash
# Install Netlify CLI if you haven't
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link to your site
netlify link

# Set environment variables
netlify env:set STRIPE_SECRET_KEY "sk_live_xxxxx"
netlify env:set STRIPE_PUBLISHABLE_KEY "pk_live_xxxxx"
netlify env:set STRIPE_WEBHOOK_SECRET "whsec_xxxxx"
netlify env:set SUPABASE_URL "https://xxxxx.supabase.co"
netlify env:set SUPABASE_SERVICE_ROLE_KEY "xxxxx"

# Trigger a new deployment
netlify deploy --prod
```

---

## Verification Steps

After adding the environment variables:

1. **Trigger a new deployment**:
   - Push a commit to GitHub, or
   - Go to Netlify Dashboard → Deploys → Trigger deploy → Deploy site

2. **Check the deployment logs**:
   - Look for any errors related to missing environment variables
   - Netlify Functions should build successfully

3. **Test the billing page**:
   - Visit https://litmusai.netlify.app/billing
   - You should see "Upgrade to Premium" and "Upgrade to Enterprise" buttons
   - No error messages about Stripe configuration

4. **Test a checkout flow** (use Stripe test mode):
   - Click "Upgrade to Premium"
   - You should be redirected to Stripe Checkout
   - Use test card: `4242 4242 4242 4242`, any future expiry, any CVC

5. **Verify webhook delivery**:
   - Complete a test checkout
   - Check Stripe Dashboard → Developers → Webhooks → Events
   - Verify the webhook was delivered successfully

---

## Current Status

Based on the API response, your Stripe integration is **configured and working**:

```json
{
  "publishable_key": "pk_live_51SCvSEChtGt8OBNUB5jaZ2qR3VeTL2nNCKwTSXjqVOhL6viLByGLG3ajSem3OggrP6VPrzaCDyWkw2bK5GH5N2ni00m4eSTLrQ",
  "plans": [
    {
      "id": "premium",
      "configured": true,
      "checkout_enabled": true
    }
  ]
}
```

✅ **STRIPE_PUBLISHABLE_KEY** is set
✅ **STRIPE_SECRET_KEY** is likely set (checkout sessions can be created)
✅ Plans are configured correctly

If you're still seeing the error message, it's likely a **caching issue**. Try:
1. Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Clear browser cache
3. Wait for the latest deployment to complete (check Netlify dashboard)

---

## Troubleshooting

### Error: "Stripe plan is not yet configured"

**Cause**: The frontend is using fallback plans instead of API plans

**Solution**: 
- This has been fixed in the latest commit
- Wait for Netlify to deploy the latest code
- Hard refresh your browser

### Error: "Unable to reach billing API"

**Cause**: API endpoint not responding or CORS issue

**Solution**:
- Check Netlify Functions logs
- Verify `netlify.toml` has correct redirects
- Ensure the latest code is deployed

### Error: "Unable to start checkout with Stripe"

**Cause**: Missing or invalid `STRIPE_SECRET_KEY`

**Solution**:
- Verify the key is set in Netlify environment variables
- Check it starts with `sk_live_` or `sk_test_`
- Ensure there are no extra spaces or quotes

### Webhook not updating subscription status

**Cause**: Missing `SUPABASE_SERVICE_ROLE_KEY` or invalid `STRIPE_WEBHOOK_SECRET`

**Solution**:
- Add `SUPABASE_SERVICE_ROLE_KEY` to Netlify
- Verify `STRIPE_WEBHOOK_SECRET` matches the webhook in Stripe Dashboard
- Check Netlify Functions logs for webhook errors

---

## Next Steps

1. ✅ **Environment variables are configured** (based on API response)
2. ✅ **Latest code has been pushed** (fallback plans fixed)
3. ⏳ **Wait for deployment** to complete (~2-5 minutes)
4. 🔄 **Hard refresh** the billing page
5. ✅ **Test the checkout flow**

The error message should disappear once the latest deployment is live!

