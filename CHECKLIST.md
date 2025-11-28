# ✅ Deployment Checklist

Use this checklist to deploy your quiz app step by step.

---

## Pre-Deployment

- [ ] All files downloaded from Claude
- [ ] Python 3.9+ installed
- [ ] Node.js 16+ installed
- [ ] Git installed
- [ ] GitHub account created
- [ ] Code editor ready (VS Code, Sublime, etc.)

---

## Phase 1: Supabase Setup

- [ ] Created Supabase account at supabase.com
- [ ] Created new project
- [ ] Saved database password securely
- [ ] Copied Project URL from Settings → API
- [ ] Copied Anon Key from Settings → API
- [ ] Revealed and copied JWT Secret from Settings → API
- [ ] Copied Database Connection String (Transaction mode) from Settings → Database
- [ ] Replaced `[YOUR-PASSWORD]` in connection string with actual password

**Credentials checklist:**
- [ ] `SUPABASE_URL`: https://xxxxx.supabase.co
- [ ] `SUPABASE_ANON_KEY`: eyJhbGc...
- [ ] `SUPABASE_JWT_SECRET`: xxxxx...
- [ ] `DATABASE_URL`: postgresql://postgres.xxxxx:PASSWORD@...

---

## Phase 2: Local Backend Setup

- [ ] Navigated to `backend/` folder
- [ ] Created `.env` file from `.env.example`
- [ ] Added `DATABASE_URL` to `.env`
- [ ] Added `SUPABASE_JWT_SECRET` to `.env`
- [ ] Added `JWT_SECRET_KEY` to `.env` (any random string)
- [ ] Set `PORT=5000` in `.env`
- [ ] Ran `pip install -r requirements.txt`
- [ ] Ran `python database.py` successfully
- [ ] Saw "Database initialized successfully!" message
- [ ] Ran `python app.py`
- [ ] Backend running on http://localhost:5000
- [ ] Visited http://localhost:5000/health and saw {"status":"healthy"}

---

## Phase 3: Local Frontend Setup

- [ ] Navigated to `frontend/` folder
- [ ] Created `.env.local` file from `.env.example`
- [ ] Added `REACT_APP_SUPABASE_URL` to `.env.local`
- [ ] Added `REACT_APP_SUPABASE_ANON_KEY` to `.env.local`
- [ ] Set `REACT_APP_API_URL=http://localhost:5000` in `.env.local`
- [ ] Ran `npm install`
- [ ] Ran `npm start`
- [ ] Frontend opened automatically at http://localhost:3000
- [ ] Can see login/signup page

---

## Phase 4: Local Testing

- [ ] Clicked "Sign Up" on frontend
- [ ] Created account with test email/password
- [ ] Checked email for confirmation (if required)
- [ ] Successfully signed in
- [ ] Can see "Upload New Question Set" section
- [ ] Uploaded `sample-questions.tsv` successfully
- [ ] Can see the question set appear
- [ ] Clicked on question set to practice
- [ ] Can see questions in flashcard format
- [ ] Can flip cards to see answers
- [ ] Can mark questions as correct/missed
- [ ] Can navigate with Previous/Skip buttons
- [ ] Progress saved (checked by refreshing page)

**If all above work → Ready to deploy!**

---

## Phase 5: GitHub Setup

- [ ] Created repository on GitHub
- [ ] Initialized git: `git init`
- [ ] Added files: `git add .`
- [ ] Committed: `git commit -m "Initial commit"`
- [ ] Added remote: `git remote add origin [YOUR-REPO-URL]`
- [ ] Pushed: `git push -u origin main`
- [ ] Verified files on GitHub

---

## Phase 6: Backend Deployment (Render)

- [ ] Created Render.com account
- [ ] Signed in with GitHub
- [ ] Clicked "New +" → "Web Service"
- [ ] Connected GitHub account
- [ ] Selected quiz-app repository
- [ ] Configured deployment:
  - [ ] Name: `quiz-app-backend`
  - [ ] Root Directory: `backend`
  - [ ] Runtime: Python 3
  - [ ] Build Command: `pip install -r requirements.txt`
  - [ ] Start Command: `gunicorn app:app`
  - [ ] Plan: Free
- [ ] Added environment variables:
  - [ ] `DATABASE_URL`
  - [ ] `SUPABASE_JWT_SECRET`
  - [ ] `JWT_SECRET_KEY`
  - [ ] `PORT=10000`
- [ ] Clicked "Create Web Service"
- [ ] Waited for deployment (~5 minutes)
- [ ] Deployment successful (green "Live" status)
- [ ] Copied backend URL: https://quiz-app-backend.onrender.com
- [ ] Tested: Visited `[BACKEND-URL]/health`
- [ ] Saw {"status":"healthy"} response

---

## Phase 7: Frontend Deployment (Vercel)

- [ ] Created Vercel.com account
- [ ] Signed in with GitHub
- [ ] Clicked "Add New..." → "Project"
- [ ] Imported quiz-app repository
- [ ] Configured deployment:
  - [ ] Framework Preset: Create React App (auto-detected)
  - [ ] Root Directory: `frontend`
- [ ] Added environment variables:
  - [ ] `REACT_APP_SUPABASE_URL`
  - [ ] `REACT_APP_SUPABASE_ANON_KEY`
  - [ ] `REACT_APP_API_URL` (your Render backend URL)
- [ ] Clicked "Deploy"
- [ ] Waited for deployment (~2 minutes)
- [ ] Deployment successful ("Congratulations!" message)
- [ ] Copied frontend URL: https://quiz-app-xxxxx.vercel.app

---

## Phase 8: Supabase Configuration

- [ ] Went back to Supabase Dashboard
- [ ] Navigated to Authentication → URL Configuration
- [ ] Added Vercel URL to Site URL
- [ ] Clicked "Save"

---

## Phase 9: Production Testing

- [ ] Visited deployed frontend URL
- [ ] Created new account (different from test account)
- [ ] Received confirmation email (checked spam)
- [ ] Clicked confirmation link
- [ ] Signed in successfully
- [ ] Uploaded a TSV file
- [ ] Questions imported successfully
- [ ] Started practice session
- [ ] Can flip cards
- [ ] Can mark as correct/missed
- [ ] Navigation works (previous/next/skip)
- [ ] Signed out
- [ ] Signed back in
- [ ] Progress persisted
- [ ] Checked stats page
- [ ] Stats showing correctly

**If all above work → Deployment successful!**

---

## Phase 10: Share with Friends

- [ ] Sent app URL to friends: https://quiz-app-xxxxx.vercel.app
- [ ] Friends can sign up
- [ ] Friends can see question sets
- [ ] Friends have separate progress tracking
- [ ] Multiple users can use simultaneously

---

## Troubleshooting Checklist

### Backend Issues
- [ ] Checked Render logs for errors
- [ ] Verified all environment variables are set
- [ ] Confirmed DATABASE_URL has correct password
- [ ] Backend status shows "Live" in Render dashboard

### Frontend Issues
- [ ] Checked browser console (F12) for errors
- [ ] Verified all environment variables are set in Vercel
- [ ] REACT_APP_API_URL points to Render backend (not localhost)
- [ ] No CORS errors in browser console

### Authentication Issues
- [ ] Supabase credentials match in all places
- [ ] Site URL configured in Supabase
- [ ] Email confirmation emails arriving (check spam)
- [ ] JWT_SECRET matches between backend and Supabase

### Database Issues
- [ ] Database initialized (ran database.py)
- [ ] Can connect from backend
- [ ] Tables exist in Supabase dashboard (Table Editor)
- [ ] Connection string uses Transaction mode

---

## Post-Deployment

### Monitoring
- [ ] Bookmarked Render dashboard (for backend logs)
- [ ] Bookmarked Vercel dashboard (for frontend logs)
- [ ] Bookmarked Supabase dashboard (for database monitoring)

### Documentation
- [ ] Saved all URLs in a secure note:
  - Frontend URL
  - Backend URL
  - Supabase project URL
- [ ] Saved all credentials securely
- [ ] Shared frontend URL with friends

### Maintenance
- [ ] Know how to check logs (Render, Vercel, Browser console)
- [ ] Know how to redeploy (just `git push`)
- [ ] Know where to find documentation (README.md, DEPLOYMENT.md)

---

## Success Criteria

✅ **All of these should be true:**

1. Can visit frontend URL and see app
2. Can sign up and sign in
3. Can upload TSV files
4. Can practice questions
5. Progress saves correctly
6. Multiple users can use app simultaneously
7. Each user has separate progress
8. Backend doesn't crash (check Render logs)
9. Frontend loads quickly
10. Works on mobile browser

---

## Next Steps

Once everything is working:

- [ ] Customize frontend colors/branding (edit App.css)
- [ ] Add more features (see README.md "Future Enhancements")
- [ ] Set up custom domain (free on Vercel)
- [ ] Upload your full question bank
- [ ] Invite more friends!

---

## Quick Reference

| What | Where |
|------|-------|
| Backend logs | Render dashboard → Your service → Logs |
| Frontend logs | Browser F12 → Console |
| Database | Supabase dashboard → Table Editor |
| Redeploy | `git push` (auto-deploys) |
| Environment vars | Render/Vercel dashboards |

---

## Emergency Contacts

Having issues?

1. **Check logs first** (Render, Vercel, Browser)
2. **Review documentation** (README.md, DEPLOYMENT.md)
3. **Check this checklist** (did you miss a step?)

Most common issues:
- ❌ Wrong environment variables
- ❌ DATABASE_URL missing password
- ❌ REACT_APP_API_URL pointing to localhost
- ❌ Supabase Site URL not configured

---

🎉 **Congratulations on deploying your quiz app!**

You now have a production-ready, multi-user quiz practice application running completely for free!
