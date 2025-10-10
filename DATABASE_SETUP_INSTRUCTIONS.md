# 🗄️ Database Setup Instructions

## Problem Identified

The dashboard is failing because the database tables don't exist in Supabase:

```
Error: "Could not find the table 'public.assessment_results' in the schema cache"
```

This means the database schema was never created in your Supabase project.

---

## ✅ Solution: Create Database Tables

You need to run the SQL migration script to create all required tables.

---

## 📋 Step-by-Step Instructions

### **Option A: Run Migration via Supabase Dashboard (Recommended)**

#### **Step 1: Go to Supabase SQL Editor**

1. Go to: https://supabase.com/dashboard
2. Select your project: **sybctfhasyazoryzxjcg**
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New query"**

#### **Step 2: Copy and Paste the Migration Script**

1. Open the file: `supabase/migrations/001_create_tables.sql`
2. Copy the ENTIRE contents
3. Paste into the SQL Editor

#### **Step 3: Run the Migration**

1. Click **"Run"** button (or press Cmd/Ctrl + Enter)
2. Wait for execution to complete
3. You should see: **"Success. No rows returned"**

#### **Step 4: Verify Tables Were Created**

1. Click on **"Table Editor"** in the left sidebar
2. You should now see these tables:
   - ✅ `users`
   - ✅ `assessment_results`
   - ✅ `training_modules`
   - ✅ `user_progress`

---

### **Option B: Run Migration via Supabase CLI (Advanced)**

If you have Supabase CLI installed:

```bash
# Make sure you're in the project directory
cd /Users/reggiealleyne/Projects/ai-literacy-platform

# Link to your Supabase project (if not already linked)
supabase link --project-ref sybctfhasyazoryzxjcg

# Run the migration
supabase db push
```

---

## 🔍 What the Migration Creates

### **1. Tables**

**`users` table:**
- Extends Supabase auth.users
- Stores user profile and subscription info
- Fields: email, first_name, last_name, organization, role, subscription_tier, stripe_customer_id, etc.

**`assessment_results` table:**
- Stores completed assessment results
- Fields: user_id, score, total_questions, domain_scores (JSON), time_taken, created_at

**`training_modules` table:**
- Stores available training modules
- Fields: title, description, difficulty_level, estimated_duration, content (JSON), learning_objectives
- Pre-populated with 4 sample modules

**`user_progress` table:**
- Tracks user progress through training modules
- Fields: user_id, module_id, progress_percentage, status, last_accessed, completed_at

### **2. Indexes**
- Performance indexes on user_id, created_at, email, stripe_customer_id

### **3. Row Level Security (RLS)**
- Users can only view/edit their own data
- Training modules are publicly readable
- Prevents unauthorized access

### **4. Triggers**
- Auto-update `updated_at` timestamp on record changes

---

## 🎯 After Running the Migration

### **Step 1: Verify Tables Exist**

Visit the dashboard diagnostic tool:
```
https://litmusai.netlify.app/dashboard-debug.html
```

You should now see:
- ✅ Supabase Connection: OK
- ✅ Assessment Data Check: 0 records (but no error)
- ✅ Training Progress Check: 0 records (but no error)

### **Step 2: Create Your User Record**

The `users` table needs a record for your account. Run this SQL in Supabase SQL Editor:

```sql
-- Insert your user record (if it doesn't exist)
INSERT INTO public.users (id, email, first_name, last_name, subscription_tier)
VALUES (
  '15b8ce3e-f759-40ca-a1c9-5a79075ae054',  -- Your user ID from console log
  'reggiealleyne89@gmail.com',              -- Your email
  'Reggie',                                  -- Your first name
  'Alleyne',                                 -- Your last name
  'free'                                     -- Your subscription tier
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();
```

### **Step 3: Test the Dashboard**

1. Go to: https://litmusai.netlify.app/dashboard
2. Hard refresh (Cmd+Shift+R)
3. You should see:
   - No errors in console
   - "No assessments yet" message (instead of error)
   - Training modules available

### **Step 4: Complete a New Assessment**

Since your old data doesn't exist, you'll need to:
1. Go to: https://litmusai.netlify.app/assessment
2. Complete a new assessment
3. Results will be saved to the database
4. Dashboard will show your results

---

## 🔧 Troubleshooting

### **Error: "permission denied for table users"**

**Cause:** RLS policies are blocking access

**Solution:** Make sure you're logged in as the authenticated user. The policies allow users to access their own data.

### **Error: "relation 'public.users' already exists"**

**Cause:** Tables already exist

**Solution:** This is fine! The migration uses `CREATE TABLE IF NOT EXISTS`, so it won't fail if tables exist.

### **Error: "foreign key constraint violation"**

**Cause:** Trying to insert data with invalid references

**Solution:** Make sure the user record exists in `public.users` before inserting assessment results or progress.

---

## 📊 Expected Database State After Migration

### **Tables Created:**
- ✅ `users` (0 records initially)
- ✅ `assessment_results` (0 records initially)
- ✅ `training_modules` (4 sample modules)
- ✅ `user_progress` (0 records initially)

### **RLS Policies:**
- ✅ Users can only access their own data
- ✅ Training modules are publicly readable
- ✅ Authenticated users can insert their own records

### **Indexes:**
- ✅ Performance indexes on frequently queried columns

---

## 🎉 What Happens Next

After running the migration:

1. **Dashboard will load without errors** ✅
2. **You can complete new assessments** ✅
3. **Assessment results will be saved** ✅
4. **Training progress will be tracked** ✅
5. **Data will persist across sessions** ✅

---

## ⚠️ Important Notes

### **About Your Old Data:**

Your previous assessment results and training progress **cannot be recovered** because:
- The tables never existed in the Supabase database
- Data was likely only in local development (if anywhere)
- No backups exist because tables were never created

### **Going Forward:**

- All new assessments will be saved
- All training progress will be tracked
- Data will be properly stored in Supabase
- Dashboard will display your data correctly

---

## 📝 Summary

**Problem:** Database tables don't exist
**Solution:** Run the SQL migration script
**Result:** Tables created, dashboard will work

**Steps:**
1. ✅ Go to Supabase SQL Editor
2. ✅ Copy/paste migration script
3. ✅ Run the script
4. ✅ Verify tables exist
5. ✅ Insert your user record
6. ✅ Test dashboard
7. ✅ Complete new assessment

---

**Run the migration now and let me know if you encounter any errors!** 🚀

