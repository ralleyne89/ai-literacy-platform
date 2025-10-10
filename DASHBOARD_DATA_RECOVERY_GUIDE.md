# 🔍 Dashboard Data Recovery Guide

## Current Situation

Your Stripe checkout is now working! ✅

However, your assessment results and training progress are not showing on the dashboard. This guide will help diagnose and fix the issue.

---

## 📋 Step-by-Step Diagnostic Process

### **Step 1: Run the Dashboard Diagnostic Tool**

Visit: **https://litmusai.netlify.app/dashboard-debug.html**

This tool will automatically:
- ✅ Check if Supabase environment variables are set
- ✅ Test Supabase connection
- ✅ Check if you're logged in
- ✅ Query your assessment results
- ✅ Query your training progress
- ✅ Check if ANY data exists in the database

**What to do:**
1. Make sure you're logged in to the main app first
2. Visit the diagnostic page
3. It will auto-run all tests
4. **Copy the ENTIRE page output** (all test results)
5. Share it with me

---

### **Step 2: Check Browser Console on Dashboard Page**

1. Go to: **https://litmusai.netlify.app/dashboard**
2. Open DevTools (F12) → Console tab
3. Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
4. Look for logs starting with `[Dashboard]`

**Expected logs if working correctly:**
```javascript
[Dashboard] Starting data fetch
[Dashboard] User: {id: "...", email: "..."}
[Dashboard] User ID: abc-123-def
[Dashboard] Supabase client: initialized
[Dashboard] Fetching assessment history for user: abc-123-def
[Dashboard] Assessment query result: {assessments: [...], assessmentError: null}
[Dashboard] Assessments fetched: 5 records
[Dashboard] Fetching training progress for user: abc-123-def
[Dashboard] Training progress fetched: 3 records
```

**If Supabase not initialized:**
```javascript
[Dashboard] Supabase client: NOT initialized
[Dashboard] Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables
```

**If no data found:**
```javascript
[Dashboard] Assessments fetched: 0 records
[Dashboard] Training progress fetched: 0 records
```

**Copy ALL the `[Dashboard]` logs and share them.**

---

## 🔍 Possible Scenarios and Solutions

### **Scenario A: Environment Variables Not Set**

**Symptoms:**
- Dashboard diagnostic shows: `VITE_SUPABASE_URL: NOT SET ❌`
- Console shows: `Supabase client: NOT initialized`

**Solution:**
1. Go to: https://app.netlify.com/sites/litmusai/configuration/env
2. Add these environment variables:
   - `VITE_SUPABASE_URL` = `https://sybctfhasyazoryzxjcg.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5YmN0Zmhhc3lhem9yeXp4amNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjcwODUsImV4cCI6MjA3NTAwMzA4NX0.xycRoUaa1KIOUWLrlo--O4yoecT5eKo-jWy5DeLFQhI`
3. Trigger new deployment
4. Test again

---

### **Scenario B: Not Logged In**

**Symptoms:**
- Dashboard diagnostic shows: `Session: No active session ⚠️`
- Console shows: `User: null` or `User ID: undefined`

**Solution:**
1. Go to: https://litmusai.netlify.app/login
2. Log in with your credentials
3. Return to dashboard
4. Data should appear

---

### **Scenario C: Logged In as Different User**

**Symptoms:**
- Dashboard diagnostic shows: `Records Found: 0`
- But database-wide check shows: `Total Assessment Records: 10+`
- Console shows a different User ID than expected

**Solution:**
1. Check the User ID in the diagnostic output
2. Compare it to the User ID you used when creating assessments
3. If different, you need to:
   - Log out
   - Log in with the correct account
   - Or migrate data to the new user ID

---

### **Scenario D: Data Never Created / Lost**

**Symptoms:**
- Dashboard diagnostic shows: `Records Found: 0`
- Database-wide check shows: `Total Assessment Records: 0`
- Console shows: `Assessments fetched: 0 records`

**This means the database is empty. Possible reasons:**

1. **Data was never created**
   - You never completed assessments in production
   - You only tested locally (local database ≠ production database)

2. **Data was lost during migration**
   - Database was reset
   - Tables were dropped and recreated
   - Data migration failed

3. **Wrong database**
   - Connected to a different Supabase project
   - Using test database instead of production

**Solution:**
- If data was never created: Complete new assessments
- If data was lost: Check Supabase backups or recreate data
- If wrong database: Verify Supabase URL in environment variables

---

### **Scenario E: Row Level Security (RLS) Blocking Access**

**Symptoms:**
- Dashboard diagnostic shows: `Query failed: permission denied`
- Console shows: `assessmentError: {code: "42501", message: "permission denied"}`

**Solution:**
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project
3. Go to **Authentication** → **Policies**
4. Check RLS policies on `assessment_results` and `user_progress` tables
5. Ensure policies allow users to read their own data:
   ```sql
   -- Policy should be something like:
   (auth.uid() = user_id)
   ```

---

## 🛠️ Recovery Steps

### **If Data Exists But Not Showing:**

1. Check environment variables are set
2. Verify you're logged in
3. Verify User ID matches
4. Check RLS policies
5. Check for JavaScript errors in console

### **If Data Was Lost:**

1. **Check Supabase Backups:**
   - Go to Supabase Dashboard
   - Check if backups exist
   - Restore from backup if available

2. **Recreate Data:**
   - Complete new assessments
   - Start new training modules
   - Data will be saved going forward

3. **Migrate from Local Database (if applicable):**
   - If you have data in local development
   - Export from local Supabase
   - Import to production Supabase

---

## 📊 What to Share with Me

After running the diagnostic tool, please share:

1. **Full output from dashboard-debug.html**
   - All test results
   - Copy/paste or screenshot

2. **Console logs from dashboard page**
   - All `[Dashboard]` logs
   - Any error messages

3. **Answer these questions:**
   - Did you complete assessments in production or only locally?
   - Do you remember your User ID or email used for assessments?
   - When did you last see the data (approximate date)?
   - Did anything change recently (database migration, new deployment, etc.)?

---

## 🎯 Next Steps

1. ✅ Run dashboard diagnostic tool
2. ✅ Check browser console logs
3. ✅ Share all results with me
4. ✅ I'll analyze and provide specific fix

---

## 📝 Important Notes

- **Production vs Local**: Local development uses a different database than production
- **User ID**: Data is tied to specific user IDs - must be logged in as the same user
- **RLS**: Supabase Row Level Security controls who can access data
- **Environment Variables**: Frontend needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

**Run the diagnostic tool and share the results. I'll provide a targeted fix based on what we find!** 🚀

