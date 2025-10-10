# 🔍 Debugging Instructions for Checkout & Dashboard Issues

## What I've Done

I've added comprehensive logging and diagnostic tools to help identify and fix both issues:

### 1. Enhanced Logging
- **Billing Page**: Added detailed console logging for every step of the checkout process
- **Dashboard Page**: Added detailed console logging for Supabase queries and data fetching

### 2. Diagnostic Pages
- **Environment Check**: `https://litmusai.netlify.app/env-check.html`
- **Checkout Test**: `https://litmusai.netlify.app/test-checkout.html`
- **Stripe Connection Test**: `https://litmusai.netlify.app/.netlify/functions/test-stripe-connection`

---

## 🚀 Step-by-Step Debugging Process

### **Step 1: Wait for Deployment (2-3 minutes)**

Monitor deployment at: https://app.netlify.com/sites/litmusai/deploys

Wait for "Published" status before proceeding.

---

### **Step 2: Run Environment Check**

Visit: **https://litmusai.netlify.app/env-check.html**

This page will automatically test:
- ✅ Frontend environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, etc.)
- ✅ Axios configuration
- ✅ Billing Config API
- ✅ Checkout Session API
- ✅ Stripe Connection
- ✅ Supabase Connection
- ✅ All Netlify Functions

**What to look for:**
- All tests should show **green "OK"** status
- If any show **red "ERROR"**, that's the problem
- Copy the entire page output and share it with me

---

### **Step 3: Test Checkout with Diagnostic Page**

Visit: **https://litmusai.netlify.app/test-checkout.html**

1. Enter your email
2. Select a plan (Premium or Enterprise)
3. Click **"2. Test Checkout Session"**

**Expected Result:**
```
✅ SUCCESS!
Status: 200
Checkout URL: https://checkout.stripe.com/c/pay/cs_live_...
```

**If it works:**
- Click **"3. Test Full Flow"** to be redirected to Stripe
- This confirms the API is working

**If it fails:**
- Copy the error message
- Share it with me

---

### **Step 4: Test Main Billing Page with Console Open**

1. Go to: **https://litmusai.netlify.app/billing**
2. Open DevTools (F12)
3. Go to **Console** tab
4. **Hard refresh** the page (Cmd+Shift+R or Ctrl+Shift+R)
5. Click **"Upgrade to Premium"**

**Look for console logs starting with `[Checkout]`:**

```javascript
[Checkout] Starting checkout for plan: premium email: your@email.com
[Checkout] Axios baseURL: https://litmusai.netlify.app
[Checkout] Current origin: https://litmusai.netlify.app
[Checkout] Making POST request to: /api/billing/checkout-session
[Checkout] Request data: {plan: "premium", email: "your@email.com"}
[Checkout] Response status: 200
[Checkout] Response data: {url: "https://checkout.stripe.com/..."}
[Checkout] Redirecting to: https://checkout.stripe.com/...
```

**If you see an error:**
```javascript
[Checkout] Error caught: ...
[Checkout] Error type: ...
[Checkout] Error message: ...
```

**Copy ALL the console logs and share them with me.**

---

### **Step 5: Test Dashboard with Console Open**

1. Go to: **https://litmusai.netlify.app/dashboard**
2. Keep DevTools open (F12)
3. Go to **Console** tab
4. **Hard refresh** the page (Cmd+Shift+R or Ctrl+Shift+R)

**Look for console logs starting with `[Dashboard]`:**

```javascript
[Dashboard] Starting data fetch
[Dashboard] User: {id: "...", email: "..."}
[Dashboard] User ID: ...
[Dashboard] Supabase client: initialized
[Dashboard] Fetching assessment history for user: ...
[Dashboard] Assessment query result: {assessments: [...], assessmentError: null}
[Dashboard] Assessments fetched: 5 records
[Dashboard] Fetching training progress for user: ...
[Dashboard] Training progress fetched: 3 records
```

**If Supabase is not initialized:**
```javascript
[Dashboard] Supabase client: NOT initialized
[Dashboard] Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables
```

**If no data is found:**
```javascript
[Dashboard] Assessments fetched: 0 records
[Dashboard] Training progress fetched: 0 records
```

**Copy ALL the console logs and share them with me.**

---

## 📊 What to Share with Me

After completing all steps, please share:

### 1. **Environment Check Results**
- Full output from: https://litmusai.netlify.app/env-check.html
- Screenshot or copy/paste the entire page

### 2. **Checkout Test Results**
- Result from clicking "Test Checkout Session" on test-checkout.html
- Did it succeed or fail?
- Copy the exact error message if failed

### 3. **Billing Page Console Logs**
- All logs starting with `[Checkout]`
- Any red error messages
- Screenshot of console is helpful

### 4. **Dashboard Console Logs**
- All logs starting with `[Dashboard]`
- Any red error messages
- Screenshot of console is helpful

### 5. **Network Tab (Optional but helpful)**
- Open DevTools → Network tab
- Try checkout again
- Find the request to `/api/billing/checkout-session`
- Share the status code and response

---

## 🔧 Common Issues and Quick Fixes

### Issue: "Supabase client: NOT initialized"

**Cause**: Missing environment variables

**Fix**:
1. Go to: https://app.netlify.com/sites/litmusai/configuration/env
2. Verify these are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. If missing, add them
4. Trigger new deployment

---

### Issue: "Axios baseURL: undefined"

**Cause**: Axios not configured properly

**Fix**: This should auto-configure, but if it's undefined, we need to check main.jsx

---

### Issue: "Assessments fetched: 0 records"

**Possible Causes**:
1. No data in database (data was never created)
2. Wrong user ID (logged in as different user)
3. Database query error

**To Check**:
- Look at the `[Dashboard] User ID:` log
- Compare it to the user ID you used when creating assessments
- Check if there's an error in the query result

---

### Issue: Checkout works on test page but not main page

**Cause**: React app issue, not API issue

**Fix**: Check browser console for JavaScript errors in the React app

---

## 🎯 Next Steps

1. **Wait for deployment** (~2-3 minutes)
2. **Run all diagnostic tests** (Steps 2-5 above)
3. **Share the results** with me (all console logs and test outputs)
4. **I'll analyze** the logs and provide specific fixes

---

## 📝 Notes

- The enhanced logging will help us see exactly where things fail
- The diagnostic pages test the APIs directly (bypassing React)
- If diagnostic pages work but main pages don't, it's a frontend issue
- If diagnostic pages fail, it's a backend/API issue
- Console logs will show us the exact error and where it occurs

---

**Once you share the diagnostic results, I can provide targeted fixes!** 🚀

