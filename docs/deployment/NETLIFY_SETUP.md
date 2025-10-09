# Netlify Setup for Stripe Checkout

## ✅ What I've Done

I've created a **serverless solution** using Netlify Functions instead of deploying a separate backend. This means:

- ✅ No need to deploy to Render or Railway
- ✅ Everything runs on Netlify (frontend + API)
- ✅ Completely free
- ✅ Auto-scales
- ✅ Works immediately after setup

## 🔧 Setup Steps

### Step 1: Add Environment Variables to Netlify

1. Go to https://app.netlify.com
2. Select your **LitmusAI** site
3. Go to: **Site settings** → **Environment variables**
4. Click **Add a variable** and add these:

```
STRIPE_SECRET_KEY = sk_live_... (Get from backend/.env file)

STRIPE_PUBLISHABLE_KEY = pk_live_... (Get from backend/.env file)
```

**Important**: Make sure to add both variables!

### Step 2: Deploy

The code is already pushed to GitHub. Netlify will automatically deploy when it detects the push.

**OR** you can manually deploy:

```bash
netlify deploy --prod
```

### Step 3: Test

1. Wait for deployment to complete (2-3 minutes)
2. Visit https://litmusai.netlify.app/billing
3. Try to checkout with Premium or Enterprise
4. You should be redirected to Stripe checkout!

## 🎯 How It Works

### Netlify Functions Created:

1. **`/.netlify/functions/billing-config`** - Returns plan information

   - Mapped to: `/api/billing/config`

2. **`/.netlify/functions/checkout-session`** - Creates Stripe checkout session
   - Mapped to: `/api/billing/checkout-session`

### Frontend Changes:

- Updated `src/main.jsx` to use Netlify Functions in production
- Updated `netlify.toml` to redirect `/api/*` calls to functions
- No changes needed to `BillingPage.jsx` - it already uses the right endpoints!

## 🔍 Troubleshooting

### If checkout doesn't work:

1. **Check Netlify Functions logs**:

   - Go to Netlify Dashboard → Functions
   - Click on the function to see logs
   - Look for errors

2. **Verify environment variables**:

   - Go to Site settings → Environment variables
   - Make sure both `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` are set
   - No typos in the keys

3. **Check browser console**:
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

### If you see "Function not found":

- Make sure the deployment completed successfully
- Check that `netlify/functions/` directory exists in your repo
- Verify `netlify.toml` has the correct redirects

### If you get CORS errors:

- The functions already have CORS headers enabled
- Make sure you're accessing from `https://litmusai.netlify.app` (not localhost)

## 📊 Monitoring

### View Function Logs:

1. Go to Netlify Dashboard
2. Click on your site
3. Go to **Functions** tab
4. Click on a function to see invocations and logs

### View Deployment Logs:

1. Go to Netlify Dashboard
2. Click on your site
3. Go to **Deploys** tab
4. Click on a deployment to see build logs

## 🎉 Success!

Once deployed, your Stripe checkout will work completely without needing a separate backend server!

The checkout flow:

1. User clicks "Upgrade to Premium"
2. Frontend calls `/api/billing/checkout-session`
3. Netlify Function creates Stripe session
4. User is redirected to Stripe checkout
5. After payment, user returns to your site

---

**Status**: Ready to deploy!
**Next**: Add environment variables to Netlify, then deploy
