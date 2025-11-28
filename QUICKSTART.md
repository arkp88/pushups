# 🚀 Quick Start Guide - Get Running in 5 Minutes

This is the fastest path to get your quiz app running locally. For deployment, see DEPLOYMENT.md.

## What You Need

- Python 3.9+
- Node.js 16+
- A Supabase account (free - takes 2 minutes to set up)

---

## 1. Set Up Supabase (2 minutes)

1. Go to [supabase.com](https://supabase.com) → Sign up
2. Create new project → Save the database password
3. Once ready, go to **Settings** → **API**
4. Copy these 3 values:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon key: `eyJhbGc...`
   - JWT Secret: (click "Reveal" in JWT Settings section)
5. Go to **Settings** → **Database**
6. Copy Connection String (Transaction mode)
   - Replace `[YOUR-PASSWORD]` with your actual password!

---

## 2. Set Up Backend (1 minute)

```bash
cd backend

# Create environment file
cp .env.example .env

# Edit .env with your Supabase values:
nano .env   # or use any text editor

# Install dependencies
pip install -r requirements.txt

# Initialize database
python database.py

# Start server
python app.py
```

Backend runs on: `http://localhost:5000`

---

## 3. Set Up Frontend (1 minute)

```bash
cd frontend

# Create environment file
cp .env.example .env.local

# Edit .env.local with your Supabase values:
nano .env.local   # or use any text editor

# Install dependencies
npm install

# Start app
npm start
```

Frontend opens automatically at: `http://localhost:3000`

---

## 4. Use the App! (1 minute)

1. **Sign Up:** Create account with any email/password
2. **Upload Questions:** Click "Choose TSV File" → Select `sample-questions.tsv`
3. **Practice:** Click the question set → Start answering!

---

## Your .env Files Should Look Like:

### backend/.env
```env
DATABASE_URL=postgresql://postgres.xxxxx:[YOUR-PASSWORD]@xxxxx.pooler.supabase.com:6543/postgres
SUPABASE_JWT_SECRET=your-jwt-secret-here
JWT_SECRET_KEY=any-random-string-you-want
PORT=5000
```

### frontend/.env.local
```env
REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
REACT_APP_API_URL=http://localhost:5000
```

---

## Troubleshooting

**Database initialization fails?**
- Check your DATABASE_URL has the correct password
- Make sure you're using the Transaction mode connection string

**Frontend can't connect to backend?**
- Make sure backend is running on port 5000
- Check `REACT_APP_API_URL=http://localhost:5000`

**Can't sign up?**
- Check Supabase credentials are correct
- Look at browser console (F12) for errors

---

## Next Steps

✅ **App is running locally!**

**To deploy for free:**
- Follow the step-by-step guide in `DEPLOYMENT.md`
- Takes ~30 minutes
- Backend → Render.com (free)
- Frontend → Vercel (free)
- Total cost: $0/month

**To share with friends:**
- Deploy first (see DEPLOYMENT.md)
- Send them the URL
- They sign up and start practicing!

---

## Project Structure

```
quiz-app/
├── backend/              # Python Flask API
│   ├── app.py           # Main API
│   ├── database.py      # DB setup
│   └── requirements.txt
├── frontend/            # React app
│   ├── src/
│   │   ├── App.js       # Main UI
│   │   ├── api.js       # API client
│   │   └── App.css      # Styles
│   └── package.json
├── README.md            # Main documentation
├── DEPLOYMENT.md        # Deploy to production
├── QUICKSTART.md        # This file
└── sample-questions.tsv # Test data
```

---

## Key Features

✅ Multi-user authentication
✅ Bulk TSV upload
✅ Flashcard practice interface
✅ Progress tracking per user
✅ Mark questions as correct/missed
✅ Statistics dashboard
✅ Mobile-responsive

---

**Need help?** Check README.md for full documentation!
