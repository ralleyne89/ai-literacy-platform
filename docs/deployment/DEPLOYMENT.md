# Backend Deployment Guide

## Option 1: Deploy to Render (Recommended - Free Tier)

### Step 1: Create a Render Account

1. Go to https://render.com and sign up with your GitHub account
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `ralleyne89/ai-literacy-platform`

### Step 2: Configure the Web Service

- **Name**: `litmusai-backend`
- **Region**: Oregon (US West)
- **Branch**: `feat/phase2-auth-dashboard` (or `main` after merging)
- **Root Directory**: Leave blank
- **Environment**: Python 3
- **Build Command**: `pip install -r requirements.txt && cd backend && flask db upgrade`
- **Start Command**: `cd backend && gunicorn --bind 0.0.0.0:$PORT app:app`
- **Plan**: Free

### Step 3: Add Environment Variables

Click "Advanced" and add these environment variables:

```
SECRET_KEY=<generate-a-random-secret-key>
JWT_SECRET_KEY=<generate-a-random-jwt-secret>
FLASK_ENV=production
FLASK_DEBUG=0
SUPABASE_JWT_SECRET=<copy-from-your-local-.env-file>
STRIPE_SECRET_KEY=<copy-from-your-local-backend/.env-file>
STRIPE_PUBLISHABLE_KEY=<copy-from-your-local-.env-file>
STRIPE_WEBHOOK_SECRET=<copy-from-your-local-backend/.env-file>
FRONTEND_URL=https://litmusai.netlify.app
```

### Step 4: Add PostgreSQL Database

1. In Render dashboard, click "New +" → "PostgreSQL"
2. **Name**: `litmusai-db`
3. **Plan**: Free
4. Click "Create Database"
5. Once created, copy the "Internal Database URL"
6. Go back to your web service → Environment
7. Add environment variable: `DATABASE_URL=<paste-internal-database-url>`

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete (5-10 minutes)
3. Copy your backend URL (e.g., `https://litmusai-backend.onrender.com`)

### Step 6: Update Frontend

1. Update `.env` file:
   ```
   VITE_API_URL=https://litmusai-backend.onrender.com
   ```
2. Rebuild and deploy frontend:
   ```bash
   npm run build
   netlify deploy --prod
   ```

---

## Option 2: Deploy to Railway (Alternative - Free Tier)

### Step 1: Create a Railway Account

1. Go to https://railway.app and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select `ralleyne89/ai-literacy-platform`

### Step 2: Configure the Service

1. Railway will auto-detect Python
2. Click on the service → Settings
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `gunicorn app:app`
5. Click "Generate Domain" to get a public URL

### Step 3: Add PostgreSQL Database

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically add `DATABASE_URL` to your service

### Step 4: Add Environment Variables

Click on your service → Variables → Add these:

```
SECRET_KEY=<generate-a-random-secret-key>
JWT_SECRET_KEY=<generate-a-random-jwt-secret>
FLASK_ENV=production
FLASK_DEBUG=0
SUPABASE_JWT_SECRET=<copy-from-your-local-.env-file>
STRIPE_SECRET_KEY=<copy-from-your-local-backend/.env-file>
STRIPE_PUBLISHABLE_KEY=<copy-from-your-local-.env-file>
STRIPE_WEBHOOK_SECRET=<copy-from-your-local-backend/.env-file>
FRONTEND_URL=https://litmusai.netlify.app
PORT=8080
```

### Step 5: Deploy

1. Railway will automatically deploy
2. Copy your backend URL from the "Deployments" tab
3. Update frontend `.env` with the Railway URL
4. Rebuild and deploy frontend

---

## After Deployment

### Test the Backend

```bash
curl https://your-backend-url.onrender.com/api/health
curl https://your-backend-url.onrender.com/api/billing/config
```

### Update Netlify Environment Variables

1. Go to Netlify dashboard → Site settings → Environment variables
2. Add: `VITE_API_URL=https://your-backend-url.onrender.com`
3. Trigger a new deploy

### Run Database Migrations (if needed)

For Render:

1. Go to your web service → Shell
2. Run: `cd backend && flask db upgrade`

For Railway:

1. Click on your service → Settings → Deploy
2. Add to build command: `cd backend && flask db upgrade`

---

## Troubleshooting

### Backend won't start

- Check logs in Render/Railway dashboard
- Verify all environment variables are set
- Make sure `DATABASE_URL` is set correctly

### Database connection errors

- Ensure PostgreSQL database is created
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- For Render, use "Internal Database URL" not "External"

### CORS errors

- Verify `FRONTEND_URL` is set to `https://litmusai.netlify.app`
- Check CORS configuration in `backend/app.py`

### Stripe errors

- Verify all Stripe keys are set correctly
- Check if using test keys vs live keys
- Ensure webhook secret matches Stripe dashboard
