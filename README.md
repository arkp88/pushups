# 🎯 Quiz Practice App

A full-stack quiz practice application with flashcard-style learning, progress tracking, and multi-user support.

## Features

- 🔐 **Multi-user authentication** with Supabase
- 📤 **Bulk TSV upload** for questions
- 🃏 **Flashcard interface** for practice
- 📊 **Progress tracking** per user
- ✅ **Mark questions** as correct/missed
- 📱 **Mobile-responsive** design
- 🎯 **Personal review deck** for missed questions
- 📈 **Statistics dashboard**
- ☁️ **100% Free hosting** with Supabase + Vercel

## Tech Stack

**Frontend:**
- React 18
- Supabase Auth
- Responsive CSS

**Backend:**
- Python Flask
- PostgreSQL (via Supabase)
- JWT authentication

**Hosting:**
- Frontend: Vercel (free)
- Backend: Render.com (free)
- Database: Supabase (free)

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- Supabase account (free)
- Vercel account (free)
- Render.com account (free)

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create account
2. Create a new project
3. Wait for database to provision (~2 minutes)
4. Go to Project Settings > API
5. Copy these values:
   - Project URL (looks like: `https://xxxxx.supabase.co`)
   - Anon/Public key
   - JWT Secret (under "JWT Settings")
6. Go to Project Settings > Database
7. Copy the connection string (Connection pooling > Transaction mode)

### 2. Set Up Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your Supabase values:
# DATABASE_URL=postgresql://...  (from Supabase)
# SUPABASE_JWT_SECRET=...  (from Supabase)
# JWT_SECRET_KEY=any-random-string

# Initialize database
python database.py

# Run locally to test
python app.py
```

Backend will run on `http://localhost:5000`

### 3. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local:
# REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=your-anon-key
# REACT_APP_API_URL=http://localhost:5000

# Run locally
npm start
```

Frontend will run on `http://localhost:3000`

### 4. Test Locally

1. Open `http://localhost:3000`
2. Sign up with an email and password
3. Upload a TSV file (see format below)
4. Start practicing!

## TSV File Format

Your question files should be tab-separated with these columns:

```
roundNo	questionNo	questionText	imageUrl	answerText
```

**Example:**
```tsv
roundNo	questionNo	questionText	imageUrl	answerText
Round 1	Question 1	What is the capital of France?		Paris
Round 1	Question 2	What is 2+2?		4
Round 2	Question 1	Who painted the Mona Lisa?	https://example.com/image.jpg	Leonardo da Vinci
```

**Notes:**
- Use TAB character (not spaces) to separate columns
- `imageUrl` can be empty or contain a URL
- Image URLs can be wrapped in `__url__` format (will be cleaned)

## Deployment

### Deploy Backend to Render

1. Push your code to GitHub
2. Go to [render.com](https://render.com) and sign in
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name:** quiz-app-backend
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`
   - **Environment Variables:** Add all from your `.env` file
6. Click "Create Web Service"
7. Copy the deployed URL (e.g., `https://quiz-app-backend.onrender.com`)

### Deploy Frontend to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Environment Variables:**
     - `REACT_APP_SUPABASE_URL`: Your Supabase URL
     - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `REACT_APP_API_URL`: Your Render backend URL
6. Click "Deploy"
7. Your app is live! 🎉

### Enable Authentication in Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL" (e.g., `https://quiz-app.vercel.app`)
3. Add redirect URLs if needed

## Usage Guide

### For Admin (You)

1. **Upload Questions:**
   - Click "Choose TSV File"
   - Select your file
   - Enter a descriptive name
   - Questions are imported instantly

2. **Practice:**
   - Click any question set to start
   - Click card to flip between question and answer
   - Mark as "Got it right" or "Missed it"
   - Progress saves automatically

3. **Review Missed Questions:**
   - View stats to see missed count
   - (Future: Export to Anki)

### For Friends

1. Share your deployed URL (e.g., `https://quiz-app.vercel.app`)
2. They sign up with email/password
3. They can see all question sets you upload
4. Each person has their own progress tracking

## Cost Breakdown

| Service | Tier | Cost |
|---------|------|------|
| Supabase | Free | $0/month |
| Render | Free | $0/month |
| Vercel | Free | $0/month |
| **Total** | | **$0/month** |

**Limits:**
- Supabase: 500MB database, 2GB bandwidth/month
- Render: Sleeps after 15min inactivity (30sec wake time)
- Vercel: 100GB bandwidth/month

For your use case (you + friends + 1000s of questions), this is plenty!

## Project Structure

```
quiz-app/
├── backend/
│   ├── app.py              # Flask API
│   ├── database.py         # Database schema
│   ├── requirements.txt    # Python dependencies
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css         # Styles
│   │   ├── api.js          # API client
│   │   └── supabaseClient.js
│   ├── package.json
│   └── README.md
└── README.md               # This file
```

## Future Enhancements

- [ ] Export missed questions to Anki deck
- [ ] Spaced repetition algorithm
- [ ] Category filtering
- [ ] Leaderboards
- [ ] Dark mode
- [ ] Offline support (PWA)
- [ ] Native mobile apps

## Troubleshooting

### Backend won't connect to database
- Check DATABASE_URL is correct (use Transaction mode connection string)
- Verify database is running in Supabase dashboard
- Check network/firewall settings

### CORS errors
- Verify backend CORS is enabled (already in code)
- Check REACT_APP_API_URL points to correct backend
- Make sure backend is deployed and running

### Authentication not working
- Verify Supabase credentials are correct
- Check email confirmation settings in Supabase
- Look at browser console for errors

### Upload fails
- Check TSV format (tabs, not spaces)
- Verify file has correct headers
- Check backend logs for specific errors

## Support

Having issues? Check:
1. Backend logs on Render dashboard
2. Browser console (F12) for frontend errors
3. Supabase dashboard for database issues

## License

MIT - Feel free to use and modify!

---

Built with ❤️ for quiz enthusiasts
