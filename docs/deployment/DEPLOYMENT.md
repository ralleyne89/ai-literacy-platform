# Backend Deployment Guide

## Recommended PR -> main merge flow

For frontend-hosted Netlify releases, use the same pattern:

1. Deploy and validate your backend changes on a feature branch.
2. Open a pull request targeting `main`.
3. Merge the PR after checks.
4. Netlify redeploys frontend production from `main` automatically once the merged branch updates.

## Option 1: Deploy to Render (Recommended - Free Tier)

### Step 1: Create a Render Account

1. Go to https://render.com and sign up with your GitHub account
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `ralleyne89/ai-literacy-platform`

### Step 2: Configure the Web Service

- **Name**: `litmusai-backend`
- **Region**: Oregon (US West)
- **Branch**: your feature branch (or `main` after merge)
- **Root Directory**: Leave blank
- **Environment**: Python 3
- **Build Command**: `cd backend && pip install -r requirements.txt && flask db upgrade`
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
ALLOWED_ORIGINS=https://litmusai.netlify.app
AUTH0_DOMAIN=<your-auth0-domain>
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_AUDIENCE=<your-auth0-audience>
AUTH0_REDIRECT_URI=https://litmusai.netlify.app/auth/callback
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
3. Copy your backend URL (for example `https://ai-literacy-platform.onrender.com`)

### Step 6: Update Frontend

1. Update `.env` file:
   ```
   VITE_API_URL=https://ai-literacy-platform.onrender.com
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
AUTH0_DOMAIN=<your-auth0-domain>
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_AUDIENCE=<your-auth0-audience>
AUTH0_REDIRECT_URI=https://litmusai.netlify.app/auth/callback
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
curl https://your-backend-url.onrender.com/api/auth/login
curl https://your-backend-url.onrender.com/api/auth/exchange
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

### Backend endpoints return 404

- Verify the Render service is pointed at the current repository revision and is running the Flask service defined by `backend/app.py`.
- Confirm `buildCommand` in Render has succeeded (or `pip install -r backend/requirements.txt` in the same block).
- Confirm `ALLOWED_ORIGINS`, `FRONTEND_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`, `AUTH0_REDIRECT_URI`, and `JWT_SECRET_KEY` are set in the Render Environment Variables.

### Stripe errors

- Verify all Stripe keys are set correctly
- Check if using test keys vs live keys
- Ensure webhook secret matches Stripe dashboard

---

## Auth mode and database option notes

Authentication can run in three modes:

- `backend` (recommended on constrained Supabase plans): set `VITE_AUTH_MODE=backend` so the app uses `/api/auth/register` and `/api/auth/login`.
- `supabase` (social login enabled): set `VITE_AUTH_MODE=supabase`.
- `auto` is not supported in production; use explicit `backend`, `supabase`, or `auth0`.
- `auth0` (delegated identity): set `VITE_AUTH_MODE=auth0` and configure `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`, and `VITE_AUTH0_REDIRECT_URI`.

Required environment notes by mode (production):

- Backend mode requires `VITE_API_URL` plus backend secrets (`JWT_SECRET_KEY` or `SUPABASE_JWT_SECRET`) for issued tokens.
- Supabase mode requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_JWT_SECRET` for token validation.
- Auth0 mode requires the frontend `VITE_AUTH0_*` values, the backend `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_AUDIENCE`, and `AUTH0_REDIRECT_URI` values, and a backend token signing secret (`JWT_SECRET_KEY` or `SUPABASE_JWT_SECRET`).
- Keep `VITE_AUTH0_CLIENT_ID`/`AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`/`AUTH0_AUDIENCE`, and `VITE_AUTH0_REDIRECT_URI`/`AUTH0_REDIRECT_URI` identical across frontend and backend config.
- Keep `VITE_AUTH0_DOMAIN` and `AUTH0_DOMAIN` pointed at the same Auth0 tenant. The backend accepts either a bare hostname or the full `https://...` URL.

Low-cost PostgreSQL hosting alternatives for `DATABASE_URL`:

- Neon (strong free tier for small projects)
- Render PostgreSQL (free and paid plans)
- Railway PostgreSQL (free credits, then low-cost paid)
- Supabase Postgres
- Aiven PostgreSQL
- ElephantSQL

Migration checklist for switching providers:

1. Update `DATABASE_URL` in your backend host
2. `cd backend && flask db upgrade`
3. Re-run seeders (`flask seed-training-modules --force`, `flask seed-certifications --force`, `flask seed-course-content --force`) where required
