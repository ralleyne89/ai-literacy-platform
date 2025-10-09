# Push and Deploy Guide - Quick Start

**Status:** ✅ All commits ready to push  
**Branch:** feat/phase2-auth-dashboard  
**Commits:** 7 commits (ready)

---

## 🎯 Quick Summary

All your work has been committed to git with 7 well-organized commits:

1. ✅ Course content management system (backend)
2. ✅ Course viewer UI (frontend)
3. ✅ Course content (18 lessons)
4. ✅ Course recommendations
5. ✅ Video integration & certification
6. ✅ Documentation (25+ files)
7. ✅ Utility scripts

**Now you need to:**
1. Push to GitHub (requires authentication)
2. Deploy to Netlify (automatic after push)

---

## 🔐 Step 1: Authenticate with GitHub

You have **3 options** to authenticate:

### Option A: Use GitHub Personal Access Token (Easiest)

**1. Create a Personal Access Token:**
- Go to: https://github.com/settings/tokens
- Click "Generate new token" → "Generate new token (classic)"
- Give it a name: "LitmusAI Platform"
- Select scopes: ✅ `repo` (all repo permissions)
- Click "Generate token"
- **Copy the token immediately** (you won't see it again!)

**2. Push using the token:**
```bash
# Replace YOUR_TOKEN with the token you just copied
git push https://YOUR_TOKEN@github.com/ralleyne89/ai-literacy-platform.git feat/phase2-auth-dashboard
```

**Example:**
```bash
git push https://ghp_abc123xyz456@github.com/ralleyne89/ai-literacy-platform.git feat/phase2-auth-dashboard
```

---

### Option B: Use Git Credential Manager (Recommended for future)

**1. Install Git Credential Manager:**
```bash
brew install git-credential-manager
```

**2. Configure it:**
```bash
git config --global credential.helper manager
```

**3. Push (will prompt for authentication):**
```bash
git push origin feat/phase2-auth-dashboard
```

This will open a browser window for GitHub authentication.

---

### Option C: Set up SSH Keys (Best long-term solution)

**1. Generate SSH key:**
```bash
ssh-keygen -t ed25519 -C "42076311+ralleyne89@users.noreply.github.com"
# Press Enter to accept default location
# Enter a passphrase (or leave empty)
```

**2. Add SSH key to ssh-agent:**
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

**3. Copy public key:**
```bash
cat ~/.ssh/id_ed25519.pub
# Copy the output
```

**4. Add to GitHub:**
- Go to: https://github.com/settings/keys
- Click "New SSH key"
- Paste the public key
- Click "Add SSH key"

**5. Change remote to SSH:**
```bash
git remote set-url origin git@github.com:ralleyne89/ai-literacy-platform.git
```

**6. Push:**
```bash
git push origin feat/phase2-auth-dashboard
```

---

## 🚀 Step 2: Verify Push Success

After pushing, verify:

```bash
# Check remote status
git status

# View commits on GitHub
# Go to: https://github.com/ralleyne89/ai-literacy-platform/commits/feat/phase2-auth-dashboard
```

---

## 🌐 Step 3: Deploy to Netlify

### Automatic Deployment (If GitHub connected)

**Netlify should automatically:**
1. Detect the new commits
2. Start a build
3. Deploy to production

**Check deployment:**
- Go to: https://app.netlify.com/
- Find your site
- Check "Deploys" tab
- Wait for build to complete (~2-5 minutes)

---

### Manual Deployment (If needed)

**If automatic deployment doesn't work:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Link to your site (if not already linked)
netlify link

# Deploy to production
netlify deploy --prod
```

---

## 🗄️ Step 4: Run Database Migrations on Production

**Important:** After deployment, run migrations on production database.

### Option A: Using Netlify Functions (Recommended)

Create a migration endpoint and call it once:

```bash
# Call migration endpoint (create this if needed)
curl -X POST https://your-site.netlify.app/.netlify/functions/run-migrations
```

### Option B: Using Supabase SQL Editor

1. Go to Supabase dashboard
2. Open SQL Editor
3. Run these SQL commands:

```sql
-- Add lesson table
CREATE TABLE IF NOT EXISTS lesson (
    id SERIAL PRIMARY KEY,
    module_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content TEXT,
    estimated_duration_minutes INTEGER,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES training_module(module_id)
);

-- Add lesson_progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    lesson_id INTEGER NOT NULL,
    module_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'not_started',
    time_spent_minutes INTEGER DEFAULT 0,
    quiz_score INTEGER,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lesson_id) REFERENCES lesson(id),
    FOREIGN KEY (module_id) REFERENCES training_module(module_id),
    UNIQUE(user_id, lesson_id)
);

-- Add target_domains to training_module
ALTER TABLE training_module 
ADD COLUMN IF NOT EXISTS target_domains TEXT[];
```

### Option C: Using Local Script with Production DB

```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Run migrations
cd backend
python3 migrations/add_course_content_tables.py
python3 migrations/add_target_domains_to_training_modules.py
```

---

## 📊 Step 5: Seed Course Content on Production

**After migrations, seed the course content:**

### Option A: Using Netlify Function

```bash
# Call seeding endpoint (create this if needed)
curl -X POST https://your-site.netlify.app/.netlify/functions/seed-courses
```

### Option B: Using Local Script with Production DB

```bash
# Set production database URL
export DATABASE_URL="your-production-database-url"

# Seed courses
cd backend
python3 seeders/course_content.py --force

# Optional: Seed enhanced content
python3 seeders/course_content_enhanced.py --force
```

---

## ✅ Step 6: Test Production Deployment

**Test these URLs on your production site:**

### 1. Course Viewer
```
https://your-site.netlify.app/training/modules/module-ai-fundamentals-intro/learn
https://your-site.netlify.app/training/modules/module-prompt-master/learn
https://your-site.netlify.app/training/modules/module-elements-of-ai/learn
```

### 2. Dashboard Recommendations
```
1. Go to: https://your-site.netlify.app/dashboard
2. Complete assessment if not done
3. Verify recommendations appear
4. Click "Start Learning"
5. Verify course viewer opens
```

### 3. Video Lessons
```
1. Open Prompt Engineering Mastery
2. Navigate to Lesson 2 (Video: Introduction)
3. Verify video plays
4. Check metadata displays
```

### 4. Quizzes
```
1. Take any quiz
2. Verify 8 questions appear
3. Submit answers
4. Check feedback
```

---

## 🐛 Troubleshooting

### Push Fails with Authentication Error

**Error:** `Authentication failed`

**Solution:** Use Personal Access Token (Option A above)

---

### Build Fails on Netlify

**Check:**
1. Netlify build logs
2. Environment variables are set
3. Dependencies in package.json

**Common fixes:**
```bash
# Locally test build
npm run build

# Check for errors
npm run lint
```

---

### Database Migration Fails

**Check:**
1. Database connection string
2. Table doesn't already exist
3. Foreign key constraints

**Fix:**
```sql
-- Drop tables if needed (CAREFUL!)
DROP TABLE IF EXISTS lesson_progress;
DROP TABLE IF EXISTS lesson;

-- Then re-run migrations
```

---

### Course Content Not Showing

**Check:**
1. Migrations ran successfully
2. Course content was seeded
3. API endpoints are working
4. Browser console for errors

**Fix:**
```bash
# Re-seed content
python3 seeders/course_content.py --force
```

---

## 📋 Complete Checklist

### Pre-Push
- [x] All changes committed (7 commits)
- [x] Commits have descriptive messages
- [x] Documentation created
- [ ] Local testing complete

### Push to GitHub
- [ ] Authenticate with GitHub (choose option A, B, or C)
- [ ] Push commits: `git push origin feat/phase2-auth-dashboard`
- [ ] Verify commits on GitHub
- [ ] (Optional) Create Pull Request

### Deploy to Netlify
- [ ] Verify Netlify build starts
- [ ] Wait for build to complete
- [ ] Check deployment logs
- [ ] Verify site is live

### Database Setup
- [ ] Run course content migrations
- [ ] Run target domains migration
- [ ] Seed course content
- [ ] Verify data in database

### Testing
- [ ] Test course viewer (3 courses)
- [ ] Test video lessons (2 videos)
- [ ] Test quizzes (8 questions each)
- [ ] Test recommendations
- [ ] Test progress tracking
- [ ] Check mobile responsiveness
- [ ] Verify no console errors

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Document any issues
- [ ] Plan next iteration

---

## 🎯 Quick Commands Reference

```bash
# Push to GitHub (with token)
git push https://YOUR_TOKEN@github.com/ralleyne89/ai-literacy-platform.git feat/phase2-auth-dashboard

# Check deployment status
netlify status

# View deployment logs
netlify logs

# Deploy manually
netlify deploy --prod

# Run migrations locally
cd backend
python3 migrations/add_course_content_tables.py
python3 migrations/add_target_domains_to_training_modules.py

# Seed content
python3 seeders/course_content.py --force
```

---

## 📞 Need Help?

**GitHub Authentication:**
- https://docs.github.com/en/authentication

**Netlify Deployment:**
- https://docs.netlify.com/site-deploys/overview/

**Supabase Migrations:**
- https://supabase.com/docs/guides/database/migrations

---

## 🎉 Success!

**You'll know deployment is successful when:**
- ✅ Commits visible on GitHub
- ✅ Netlify build completes (green checkmark)
- ✅ Site loads at production URL
- ✅ All 3 courses accessible
- ✅ Videos play correctly
- ✅ Quizzes work
- ✅ Recommendations appear
- ✅ No console errors

---

**Next Steps After Successful Deployment:**
1. Share with beta testers
2. Gather feedback
3. Monitor analytics
4. Continue enhancement (see NEXT_STEPS_GUIDE.md)
5. Build certificate system
6. Add more courses

---

**Status:** Ready to Push  
**Action Required:** Authenticate with GitHub and push commits  
**Estimated Time:** 5-10 minutes

