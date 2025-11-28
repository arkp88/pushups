# 🚀 Deployment Guide - Step by Step

This guide will walk you through deploying your quiz app completely for free.

## Overview

We'll deploy:
1. **Database + Auth** → Supabase (free)
2. **Backend API** → Render (free)
3. **Frontend** → Vercel (free)

Total time: ~30 minutes
Total cost: $0

---

## Step 1: Set Up Supabase (10 minutes)

### Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up with GitHub
3. Click "New Project"
4. Fill in:
   - **Name:** quiz-app
   - **Database Password:** (generate a strong one, save it!)
   - **Region:** Choose closest to you
   - **Pricing Plan:** Free
5. Click "Create new project"
6. Wait ~2 minutes for provisioning

### Get Your Credentials

Once provisioned:

1. Go to **Project Settings** (gear icon)
2. Click **API** section
3. Copy and save these values:
   ```
   Project URL: https://xxxxx.supabase.co
   Anon/Public key: eyJhbGc...
   ```
4. Scroll down to **JWT Settings**
5. Click "Reveal" and copy:
   ```
   JWT Secret: xxxxx
   ```
6. Click **Database** section
7. Under "Connection string" → Select **Transaction** mode
8. Copy the connection string:
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@xxxxx.pooler.supabase.com:6543/postgres
   ```
   **IMPORTANT:** Replace `[YOUR-PASSWORD]` with your actual database password!

### Initialize Database

1. On your computer, navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your values:
   ```env
   DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@xxxxx.pooler.supabase.com:6543/postgres
   SUPABASE_JWT_SECRET=your-jwt-secret-from-above
   JWT_SECRET_KEY=any-random-string-you-want
   PORT=5000
   ```

4. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Initialize the database:
   ```bash
   python database.py
   ```
   
   You should see: "Database initialized successfully!"

---

## Step 2: Deploy Backend to Render (10 minutes)

### Push Code to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   cd ..  # Back to quiz-app root
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/quiz-app.git
   git push -u origin main
   ```

### Deploy on Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Click "Connect account" to connect GitHub
5. Find and select your `quiz-app` repository
6. Configure:
   
   **Basic Settings:**
   - **Name:** `quiz-app-backend` (or any name you want)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** `Python 3`
   
   **Build & Deploy:**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   
   **Plan:** `Free`

7. Click "Advanced" and add environment variables:
   - Click "Add Environment Variable"
   - Add each of these (copy from your `.env` file):
     - `DATABASE_URL` = your Supabase connection string
     - `SUPABASE_JWT_SECRET` = your JWT secret
     - `JWT_SECRET_KEY` = any random string
     - `PORT` = `10000` (Render uses this)

8. Click "Create Web Service"

9. Wait for deployment (~5 minutes)
   - Watch the logs for any errors
   - When done, you'll see "Live" status

10. **Copy your backend URL:**
    - It will look like: `https://quiz-app-backend.onrender.com`
    - Save this! You'll need it for the frontend

### Test Your Backend

1. Open your browser
2. Visit: `https://quiz-app-backend.onrender.com/health`
3. You should see: `{"status":"healthy","timestamp":"..."}`

✅ Backend is deployed!

---

## Step 3: Deploy Frontend to Vercel (10 minutes)

### Configure Frontend Locally

1. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

2. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

3. Edit `.env.local`:
   ```env
   REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   REACT_APP_API_URL=https://quiz-app-backend.onrender.com
   ```
   Use your Supabase values and your Render backend URL!

4. Test locally:
   ```bash
   npm install
   npm start
   ```
   Open `http://localhost:3000` and try to sign up!

### Deploy to Vercel

1. Push your latest changes:
   ```bash
   cd ..  # Back to root
   git add .
   git commit -m "Add environment config"
   git push
   ```

2. Go to [vercel.com](https://vercel.com)
3. Sign up with GitHub
4. Click "Add New..." → "Project"
5. Import your GitHub repository
6. Configure:
   
   **Project Settings:**
   - **Framework Preset:** Create React App (auto-detected)
   - **Root Directory:** `frontend`
   
   **Environment Variables:** Click "Environment Variables"
   Add each of these:
   - `REACT_APP_SUPABASE_URL` = your Supabase URL
   - `REACT_APP_SUPABASE_ANON_KEY` = your Supabase anon key
   - `REACT_APP_API_URL` = your Render backend URL

7. Click "Deploy"

8. Wait for deployment (~2 minutes)
   - Vercel will build your React app
   - When done, you'll see "Congratulations!"

9. **Copy your frontend URL:**
   - It will look like: `https://quiz-app-xxxxx.vercel.app`

### Configure Supabase for Your Domain

1. Go back to Supabase Dashboard
2. Go to **Authentication** → **URL Configuration**
3. Add your Vercel URL to:
   - **Site URL:** `https://quiz-app-xxxxx.vercel.app`
4. Click "Save"

---

## Step 4: Test Your Deployed App

1. Visit your Vercel URL: `https://quiz-app-xxxxx.vercel.app`
2. Click "Sign Up"
3. Enter email and password
4. Check your email for confirmation (check spam!)
5. Click the confirmation link
6. Sign in
7. Upload a test TSV file
8. Practice some questions!

---

## Step 5: Share with Friends

Send your friends:
- Your app URL: `https://quiz-app-xxxxx.vercel.app`
- They just need to sign up!
- They'll see all your uploaded question sets
- Their progress is tracked separately

---

## Troubleshooting

### "Failed to fetch" errors
- **Cause:** Backend is sleeping (Render free tier)
- **Solution:** Wait 30 seconds, try again. First request wakes it up!

### "Invalid token" errors
- **Cause:** Supabase credentials mismatch
- **Solution:** Double-check all environment variables match

### Upload doesn't work
- **Cause:** TSV format issue
- **Solution:** Ensure tabs separate columns, not spaces

### Can't sign up
- **Cause:** Email confirmation required
- **Solution:** Check email (and spam folder) for confirmation link

### Backend errors
- **Check Render logs:** Dashboard → Your service → Logs
- **Common issue:** DATABASE_URL missing or incorrect

### Frontend errors
- **Check browser console:** Press F12 → Console tab
- **Common issue:** REACT_APP_API_URL pointing to localhost instead of Render

---

## Maintenance

### Updating Your App

When you make changes:

```bash
git add .
git commit -m "Your changes"
git push
```

Both Render and Vercel will automatically redeploy!

### Monitoring

- **Render:** Check logs in dashboard for backend errors
- **Vercel:** Check deployments tab for build errors
- **Supabase:** Check dashboard for database usage

### Free Tier Limits

**Supabase:**
- 500MB database
- 2GB bandwidth/month
- 50,000 monthly active users

**Render:**
- Sleeps after 15min inactivity
- 750 hours/month (enough for 24/7 for one service)

**Vercel:**
- 100GB bandwidth/month
- 1000 builds/month

For your use case, these are very generous!

---

## Next Steps

✅ App is deployed!
✅ You can upload questions
✅ Friends can sign up and practice

**Future enhancements:**
- Set up custom domain (free with Vercel)
- Add Anki export feature
- Build native mobile apps
- Add more features!

---

## Quick Reference

| Service | URL | Purpose |
|---------|-----|---------|
| Supabase Dashboard | https://app.supabase.com | Database & Auth |
| Render Dashboard | https://dashboard.render.com | Backend API |
| Vercel Dashboard | https://vercel.com/dashboard | Frontend |
| Your App | `https://quiz-app-xxxxx.vercel.app` | Live app! |

**Need help?** 
- Check the README.md for troubleshooting
- Check service-specific dashboards for logs
- Browser console (F12) for frontend errors

---

🎉 **You're done! Enjoy your quiz app!**
