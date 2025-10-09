# Netlify Environment Variables Checklist

## ⚠️ CRITICAL: Missing Environment Variables Detected

Your production site is missing critical environment variables. This is causing:
1. ❌ Dashboard not loading data (missing Supabase credentials)
2. ⚠️ Potential Stripe issues (if not set)

## Required Actions

### Step 1: Go to Netlify Environment Variables Page
🔗 https://app.netlify.com/sites/litmusai/configuration/env

### Step 2: Add ALL of the following variables

Copy and paste these EXACT values from your `.env` file:

---

#### **VITE_SUPABASE_URL** (CRITICAL - Dashboard won't work without this)
```
https://sybctfhasyazoryzxjcg.supabase.co
```
- Scope: **All scopes** (or at least "Production")
- This is your Supabase project URL

---

#### **VITE_SUPABASE_ANON_KEY** (CRITICAL - Dashboard won't work without this)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5YmN0Zmhhc3lhem9yeXp4amNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjcwODUsImV4cCI6MjA3NTAwMzA4NX0.xycRoUaa1KIOUWLrlo--O4yoecT5eKo-jWy5DeLFQhI
```
- Scope: **All scopes** (or at least "Production")
- This is your Supabase anonymous/public key (safe to expose to frontend)

---

#### **VITE_STRIPE_PUBLISHABLE_KEY** (For billing page)
```
pk_live_51SCvSEChtGt8OBNUB5jaZ2qR3VeTL2nNCKwTSXjqVOhL6viLByGLG3ajSem3OggrP6VPrzaCDyWkw2bK5GH5N2ni00m4eSTLrQ
```
- Scope: **All scopes** (or at least "Production")
- This is your Stripe publishable key (safe to expose to frontend)

---

#### **FRONTEND_URL** (For redirects)
```
https://litmusai.netlify.app
```
- Scope: **All scopes** (or at least "Production")
- This is your production site URL

---

### Step 3: Verify Backend/Function Variables

These should already be set (you added them earlier), but verify they exist:

#### **STRIPE_SECRET_KEY**
- Should start with `sk_live_` or `sk_test_`
- ⚠️ **DO NOT** start with `VITE_` (this is a secret key)
- Used by Netlify Functions for Stripe API calls

#### **STRIPE_PUBLISHABLE_KEY**
- Should start with `pk_live_` or `pk_test_`
- Used by Netlify Functions to return to frontend

#### **STRIPE_WEBHOOK_SECRET**
- Should start with `whsec_`
- Used to validate Stripe webhook signatures

#### **SUPABASE_URL**
- Same as `VITE_SUPABASE_URL` but for backend functions
- Example: `https://sybctfhasyazoryzxjcg.supabase.co`

#### **SUPABASE_SERVICE_ROLE_KEY**
- ⚠️ **SECRET KEY** - DO NOT expose to frontend
- Used by Netlify Functions to update user data
- Find in: Supabase Dashboard → Project Settings → API → Service Role Key

---

## Step 4: Trigger New Deployment

After adding ALL variables:

### Option A: Via Netlify Dashboard
1. Go to https://app.netlify.com/sites/litmusai/deploys
2. Click **"Trigger deploy"** → **"Clear cache and deploy site"**

### Option B: Via Git Push
```bash
# Make a small change to trigger rebuild
git commit --allow-empty -m "Trigger rebuild with environment variables"
git push origin main
```

---

## Step 5: Verify Deployment

### Wait for Build to Complete
- Monitor: https://app.netlify.com/sites/litmusai/deploys
- Should take 2-5 minutes

### Check for New Bundle Hash
```bash
# Run this command to see if bundle changed
curl -s https://litmusai.netlify.app/ | grep 'index-.*\.js'

# OLD (broken): index-b9e8a070.js
# NEW (fixed): index-<different-hash>.js
```

### Test the Site

#### Test 1: Billing Page
1. Go to https://litmusai.netlify.app/billing
2. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
3. ✅ Should see "Upgrade to Premium" and "Upgrade to Enterprise" buttons
4. ❌ Should NOT see "Stripe plan is not yet configured" error

#### Test 2: Dashboard
1. Login to https://litmusai.netlify.app
2. Go to Dashboard
3. Open browser console (F12)
4. ✅ Should NOT see "Supabase environment variables are missing" warning
5. ✅ Should see assessment results and training progress (if data exists)
6. ❌ Should NOT see errors about failed API calls

#### Test 3: Browser Console
1. Open DevTools (F12) → Console tab
2. Look for:
   - ✅ No Supabase warnings
   - ✅ No failed API calls to `/api/assessment/history`
   - ✅ No failed API calls to `/api/training/progress`

---

## Troubleshooting

### Issue: "Supabase environment variables are missing" warning in console

**Cause**: `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` not set in Netlify

**Solution**:
1. Double-check you added the variables with the **exact names** (including `VITE_` prefix)
2. Make sure you selected "All scopes" or at least "Production"
3. Trigger a new deployment after adding variables
4. Clear browser cache and hard refresh

### Issue: Dashboard shows no data

**Possible Causes**:
1. Environment variables not set → Check console for warnings
2. No data in database → Check Supabase tables
3. User not logged in → Check authentication

**Solution**:
```sql
-- Check if data exists in Supabase
SELECT * FROM assessment_results LIMIT 5;
SELECT * FROM user_progress LIMIT 5;
SELECT * FROM training_modules LIMIT 5;
```

### Issue: Billing page still shows error

**Possible Causes**:
1. Browser cache → Hard refresh (Cmd+Shift+R)
2. CDN cache → Wait 5-10 minutes
3. Old deployment still active → Check bundle hash

**Solution**:
1. Clear cache and redeploy in Netlify
2. Wait for new bundle hash
3. Hard refresh browser

---

## Summary

### What You Need to Do:

1. ✅ **Add 4 frontend variables** to Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `FRONTEND_URL`

2. ✅ **Verify 5 backend variables** exist in Netlify:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. ✅ **Trigger new deployment** (clear cache)

4. ✅ **Wait 5-10 minutes** for deployment + CDN update

5. ✅ **Test both pages** (billing + dashboard)

### Expected Timeline:
- Adding variables: **2 minutes**
- Deployment: **3-5 minutes**
- CDN cache update: **5-10 minutes**
- **Total: ~15 minutes**

---

## Quick Copy-Paste for Netlify

If you're adding variables via Netlify CLI:

```bash
netlify env:set VITE_SUPABASE_URL "https://sybctfhasyazoryzxjcg.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5YmN0Zmhhc3lhem9yeXp4amNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjcwODUsImV4cCI6MjA3NTAwMzA4NX0.xycRoUaa1KIOUWLrlo--O4yoecT5eKo-jWy5DeLFQhI"
netlify env:set VITE_STRIPE_PUBLISHABLE_KEY "pk_live_51SCvSEChtGt8OBNUB5jaZ2qR3VeTL2nNCKwTSXjqVOhL6viLByGLG3ajSem3OggrP6VPrzaCDyWkw2bK5GH5N2ni00m4eSTLrQ"
netlify env:set FRONTEND_URL "https://litmusai.netlify.app"

# Then trigger deployment
netlify deploy --prod
```

---

## ⚠️ IMPORTANT NOTES

1. **VITE_ prefix is required** for frontend variables
   - Vite only exposes variables starting with `VITE_` to the browser
   - Without this prefix, the variables won't be available in production

2. **Rebuild is required** after adding variables
   - Environment variables are baked into the build at build time
   - Just adding them won't update the live site
   - You MUST trigger a new deployment

3. **These are public keys** (safe to expose)
   - `VITE_SUPABASE_ANON_KEY` - Public Supabase key (row-level security protects data)
   - `VITE_STRIPE_PUBLISHABLE_KEY` - Public Stripe key (can't charge cards)
   - Never expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to frontend!

---

**Once you've added the variables and triggered a deployment, both issues should be resolved! 🎉**

