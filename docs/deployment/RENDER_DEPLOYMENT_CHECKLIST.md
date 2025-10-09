# Render Deployment Checklist

## ✅ Step 1: Create Render Account
- [ ] Go to https://render.com (already opened in your browser)
- [ ] Click "Get Started for Free"
- [ ] Sign up with your GitHub account (@ralleyne89)
- [ ] Authorize Render to access your GitHub repositories

## ✅ Step 2: Create PostgreSQL Database FIRST
**Important: Create the database before the web service so you can link them**

- [ ] In Render Dashboard, click "New +" button (top right)
- [ ] Select "PostgreSQL"
- [ ] Fill in database details:
  - **Name**: `litmusai-db`
  - **Database**: `litmusai` (or leave default)
  - **User**: `litmusai` (or leave default)
  - **Region**: Oregon (US West)
  - **PostgreSQL Version**: 16 (or latest)
  - **Plan**: Free
- [ ] Click "Create Database"
- [ ] Wait for database to be created (1-2 minutes)
- [ ] **IMPORTANT**: Copy the "Internal Database URL" (you'll need this)
  - It looks like: `postgresql://user:password@host/database`
  - Keep this tab open or save it somewhere

## ✅ Step 3: Create Web Service
- [ ] Click "New +" button again
- [ ] Select "Web Service"
- [ ] Click "Build and deploy from a Git repository"
- [ ] Click "Next"

### Connect Repository
- [ ] Find and select: `ralleyne89/ai-literacy-platform`
- [ ] If you don't see it, click "Configure account" to grant access
- [ ] Click "Connect"

### Configure Service
Fill in these settings:

**Basic Settings:**
- [ ] **Name**: `litmusai-backend`
- [ ] **Region**: Oregon (US West) - same as database
- [ ] **Branch**: `feat/phase2-auth-dashboard`
- [ ] **Root Directory**: (leave blank)
- [ ] **Runtime**: Python 3

**Build & Deploy:**
- [ ] **Build Command**: 
  ```
  pip install -r requirements.txt && cd backend && flask db upgrade
  ```
- [ ] **Start Command**: 
  ```
  cd backend && gunicorn --bind 0.0.0.0:$PORT app:app
  ```

**Instance Type:**
- [ ] **Plan**: Free

## ✅ Step 4: Add Environment Variables
Click "Advanced" to expand the environment variables section.

**Add these variables one by one** (copy from `render_env_vars.txt`):

- [ ] `SECRET_KEY` = `cMbe{*"dCuAO&(HvIsZRyuRMS+=1Pb$S8k=f6?,k/@"V/|r}Yt`
- [ ] `JWT_SECRET_KEY` = `U65,P:b0~8+QYz@8Q:U&P(+5<,k+Dr>vpHlSem!i49~I_Jqc*.`
- [ ] `FLASK_ENV` = `production`
- [ ] `FLASK_DEBUG` = `0`
- [ ] `SUPABASE_JWT_SECRET` = `YqsVDz7gnGzTaynlSjC07Y4Uhwm1JonDTaX3VRKEYXCTosRqA0ZhWRws9yRqPblEuYaIXBmFE85l39BKuTICqQ==`
- [ ] `STRIPE_SECRET_KEY` = `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`
- [ ] `STRIPE_PUBLISHABLE_KEY` = `pk_live_51SCvSEChtGt8OBNUB5jaZ2qR3VeTL2nNCKwTSXjqVOhL6viLByGLG3ajSem3OggrP6VPrzaCDyWkw2bK5GH5N2ni00m4eSTLrQ`
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_xA2DcPHLHQayeaRn0jKEqqGqo5MGD5og`
- [ ] `FRONTEND_URL` = `https://litmusai.netlify.app`
- [ ] `DATABASE_URL` = (paste the Internal Database URL from Step 2)

**Tip**: Click "Add Environment Variable" for each one. Key on left, Value on right.

## ✅ Step 5: Deploy!
- [ ] Double-check all settings
- [ ] Click "Create Web Service" button at the bottom
- [ ] Wait for deployment (5-10 minutes)
  - You'll see build logs in real-time
  - First deployment takes longer
  - Look for "Your service is live 🎉"

## ✅ Step 6: Get Your Backend URL
- [ ] Once deployed, find your service URL at the top
  - It will be something like: `https://litmusai-backend.onrender.com`
- [ ] Copy this URL
- [ ] Test it by visiting: `https://litmusai-backend.onrender.com/api/health`
  - You should see: `{"status":"healthy","timestamp":"..."}`

## ✅ Step 7: Update Frontend Configuration
Now we need to point your Netlify frontend to the new backend.

### Update Local .env File
- [ ] Open `.env` file in your project root
- [ ] Change `VITE_API_URL` to your Render URL:
  ```
  VITE_API_URL=https://litmusai-backend.onrender.com
  ```
- [ ] Save the file

### Update Netlify Environment Variables
- [ ] Go to https://app.netlify.com
- [ ] Select your "LitmusAI" site
- [ ] Go to: Site settings → Environment variables
- [ ] Find `VITE_API_URL` or add it if it doesn't exist
- [ ] Set value to: `https://litmusai-backend.onrender.com`
- [ ] Click "Save"

### Rebuild and Deploy Frontend
Run these commands in your terminal:

```bash
npm run build
netlify deploy --prod
```

- [ ] Wait for build to complete
- [ ] Wait for deployment to finish
- [ ] You'll see: "Deployed to production URL: https://litmusai.netlify.app"

## ✅ Step 8: Test Everything!
- [ ] Visit https://litmusai.netlify.app
- [ ] Go to the Billing page
- [ ] Try to checkout with Premium or Enterprise plan
- [ ] You should be redirected to Stripe checkout (or see proper error messages)
- [ ] Check browser console - no more 500 errors!

## 🎉 Success Criteria
- ✅ Backend is live on Render
- ✅ Database is connected
- ✅ Frontend can reach backend
- ✅ Checkout flow works without 500 errors
- ✅ No CORS errors in browser console

## 🔧 Troubleshooting

### If deployment fails:
1. Check the build logs in Render dashboard
2. Look for error messages (usually Python import errors or missing dependencies)
3. Verify all environment variables are set correctly

### If you get database errors:
1. Make sure `DATABASE_URL` is set correctly
2. Check that it's the "Internal Database URL" not "External"
3. Verify the database is in the same region as the web service

### If you get CORS errors:
1. Check that `FRONTEND_URL` is set to `https://litmusai.netlify.app`
2. Verify CORS is enabled in `backend/app.py`

### If checkout still fails:
1. Check Render logs: Dashboard → Your Service → Logs
2. Look for error messages when you try to checkout
3. Verify all Stripe keys are correct

## 📝 Notes
- Free tier on Render: Service spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds (cold start)
- Database stays active on free tier
- You get 750 hours/month free (enough for one service running 24/7)

---

**Current Status**: Ready to deploy!
**Next Action**: Follow Step 1 above

