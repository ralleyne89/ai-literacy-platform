# Add Environment Variables to Netlify

## ✅ Deployment Successful!

Your site is deployed at: **https://litmusai.netlify.app**

But the Stripe checkout won't work yet because we need to add the Stripe API keys.

## 🔑 Add These Environment Variables

I've opened the Netlify environment variables page in your browser:
https://app.netlify.com/sites/litmusai/configuration/env

### Click "Add a variable" and add these TWO variables:

**Variable 1:**

- **Key**: `STRIPE_SECRET_KEY`
- **Value**: `sk_live_...` (Get from backend/.env file)
- **Scopes**: All scopes (default)

**Variable 2:**

- **Key**: `STRIPE_PUBLISHABLE_KEY`
- **Value**: `pk_live_...` (Get from backend/.env file)
- **Scopes**: All scopes (default)

### Add Auth Provider Variables

- If your `VITE_AUTH_MODE` is `supabase`, add:
  - **Variable**: `VITE_SUPABASE_URL` = Supabase project URL (e.g. `https://your-project-id.supabase.co`)
  - **Variable**: `VITE_SUPABASE_ANON_KEY` = Supabase public anon key

- If your `VITE_AUTH_MODE` is `auth0`, add:
  - **Variable**: `VITE_AUTH0_DOMAIN` = Auth0 domain (e.g. `https://your-domain.auth0.com`)
  - **Variable**: `VITE_AUTH0_CLIENT_ID` = Auth0 app client ID
  - **Variable**: `VITE_AUTH0_AUDIENCE` = Auth0 audience
  - **Variable**: `VITE_AUTH0_REDIRECT_URI` = OAuth callback URL (`https://litmusai.netlify.app/auth/callback`)
  - **Variable**: `AUTH0_DOMAIN` = Auth0 domain for backend token verification (no trailing slash)
  - **Variable**: `AUTH0_CLIENT_ID` = Auth0 app client ID for backend code exchange
  - **Variable**: `AUTH0_AUDIENCE` = Auth0 audience for backend token verification
  - **Variable**: `AUTH0_REDIRECT_URI` = backend fallback redirect URI (`https://litmusai.netlify.app/auth/callback`)

#### Auth0 Dashboard URLs (must match exactly)

- **Allowed Callback URLs**: `https://litmusai.netlify.app/auth/callback`
- **Allowed Web Origins**: `https://litmusai.netlify.app`
- **Allowed Logout URLs**: `https://litmusai.netlify.app`

- If your `VITE_AUTH_MODE` is `backend`, neither set is required for baseline backend email/password authentication.

### After adding variables:

1. Click "Save" or the variables will save automatically
2. **Trigger a new deploy** (Netlify should prompt you, or go to Deploys → Trigger deploy → Deploy site)
3. Wait 2-3 minutes for the new deployment to complete

## 🎉 Test It!

Once the new deployment is complete:

1. Go to https://litmusai.netlify.app/billing
2. Click "Upgrade to Premium" or "Upgrade to Enterprise"
3. Enter your email when prompted
4. You should be redirected to Stripe checkout!

## 🔍 If It Doesn't Work:

### Check Function Logs:

1. Go to https://app.netlify.com/sites/litmusai/logs/functions
2. Try to checkout again
3. Look for errors in the logs

### Common Issues:

**"Function not found"**

- Make sure you triggered a new deploy after adding environment variables
- Check that both functions are deployed (billing-config and checkout-session)

**"Stripe error"**

- Verify both environment variables are set correctly
- Check for typos in the keys
- Make sure you saved the variables

**Still getting 500 error**

- Check the function logs for detailed error messages
- Verify the Stripe keys are valid (not expired)

## 📊 Monitor Your Functions:

- **Function logs**: https://app.netlify.com/sites/litmusai/logs/functions
- **Deployment logs**: https://app.netlify.com/sites/litmusai/deploys

---

**Current Status**: Deployed successfully, waiting for environment variables
**Next Step**: Add the two Stripe environment variables above
