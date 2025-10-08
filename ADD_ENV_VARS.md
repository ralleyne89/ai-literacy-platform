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

### After Adding Both Variables:

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
