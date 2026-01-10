# 💪 Pushups Quiz App

A modern, production-ready flashcard quiz application with multi-user support, mobile-first design, and premium UI.

![React](https://img.shields.io/badge/React-18-blue)
![Python](https://img.shields.io/badge/Python-3.9-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

### Core Features
- 🔐 **Multi-user authentication** via Supabase (with guest mode for browsing)
- 📥 **Smart Import Options:**
  - Upload TSV files from your device (single or multiple)
  - Import from Google Drive (single file or multi-select)
  - **Recursive folder import** - Import all TSV files from a folder and all its subfolders with one click (up to 50 files)
  - Multi-file review with preview before import
  - File selection/deselection before importing
- 🃏 Flashcard interface with smooth animations
- ⭐ Bookmark important questions
- 📊 Personal progress tracking & session statistics
- 🎲 **6 Practice Modes:**
  - Continue Last Set
  - Browse Question Sets
  - Random Unplayed Set
  - Random Mode (All Questions)
  - Retry Missed Questions
  - Review Bookmarks
- 📱 Mobile-first responsive design with bottom navigation
- 🔥 Daily streak tracker to encourage consistent practice
- ✨ Premium UI with gradients and glassmorphism
- 🏷️ **Set Management:**
  - Tag question sets for organization
  - Search by name or tags
  - Filter by completion status (All, Completed, In-Progress, Unattempted)
  - Sort by upload date, alphabetically, or last played
  - Rename or delete question sets
- 📋 **Set-level instructions** - Add custom instructions/context for each question set
- 🌓 **Dark mode toggle** - Full dark theme support with smooth transitions

### Mobile Experience
- 📲 **Advanced Swipe Gestures** - Swipe right for correct, left for wrong
  - Real-time card movement following your finger
  - Smooth fly-off animation with 300ms transition on successful swipe
  - Visual direction indicators (✅/❌) that move opposite to card
  - First-time tutorial overlay (auto-dismisses after 7 seconds)
  - 30% swipe threshold for natural feel
- 🔊 **Text-to-Speech** - Listen to questions and answers with natural voice
- ⌨️ **Keyboard Shortcuts** - Power-user navigation
  - Space/Enter: Flip card
  - ↑: "Got it" (answer side)
  - ↓: "Missed it" (answer side)
  - ←: Previous question
  - →: Next/Got it
  - Esc: Exit to sets
- 📱 **Auto-hiding mobile header** - Header hides on scroll for distraction-free practice

### Session Features
- 📈 **Session Summary ** - Post-session stats showing:
  - Correct/Wrong/Passed counts with color-coded cards
  - Accuracy percentage calculation
  - Quick actions: Practice Again, Review Misses, Back to Home
- 🎯 **Smart Progress Tracking** - Distinguishes between wrong answers and passed questions
- 📝 **Markdown Support** - **Bold**, *italic* formatting in questions/answers
- 🖼️ **HTML Tag Support** - `<br>`, `<hr>`, `<p>` tags preserved in content
- 🔒 **HTTPS Image Upgrade** - Auto-upgrades HTTP images to prevent mixed content issues

### Technical Excellence
- 🛡️ **Security hardened** - XSS protection, rate limiting, file validation, sanitized inputs
- ⚡ **Performance optimized** - Optimized queries, error boundaries, code splitting, connection pooling
- 🎨 **Frontend markdown conversion** - Reduced upload time by 15-18 seconds
- 💤 **Backend wake detection** - Shows loading state when Render backend wakes from sleep
- ☁️ **100% free hosting** - Supabase + Vercel + Render (all free tiers)

## 🚀 Quick Start

**[📖 Read API Documentation](./docs/API_REFERENCE.md)**

### 5-Minute Local Setup

```bash
# Clone & Install
git clone <your-repo>
cd quiz-app

# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # Add your Supabase credentials
python database.py    # Initialize database

# Frontend
cd ../frontend
npm install
cp .env.example .env.local  # Add your Supabase credentials

# Run
python backend/app.py          # Terminal 1 (port 5000)
npm run dev --prefix frontend  # Terminal 2 (port 3000)
```

Visit `http://localhost:3000` and sign up!

## 📚 Documentation

- **[Code Structure](./docs/CODE_STRUCTURE.md)** - Architecture, patterns, and data flow
- **[Changelog](./docs/CHANGELOG.md)** - Version history and upgrade notes
- **[API Reference](./docs/API_REFERENCE.md)** - Complete API endpoints documentation
- **[Backend README](./backend/README.md)** - Backend-specific details
- **[Frontend README](./frontend/README.md)** - Frontend-specific details
- **[Development Docs](./docs/)** - Refactoring notes, testing guides, troubleshooting

## 🛠️ Tech Stack

**Frontend:** React 18, Vite, Vitest, Lucide Icons, Lazy Loading, React.memo, Inter Typography
**Backend:** Python Flask, Connection Pooling, Structured Logging, PostgreSQL
**Integrations:** Google Drive API (recursive folder import)
**Hosting:** Vercel + Render.com + Supabase (all free tiers)

## 📋 Detailed Setup

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

### 2. Set Up Google Drive (Optional)

If you want to use Google Drive import:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Drive API**:
   - Go to "APIs & Services" > "Enable APIs and Services"
   - Search for "Google Drive API"
   - Click "Enable"
4. Create API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key
5. Make your Google Drive folder public:
   - Right-click folder > "Share" > "Anyone with the link can view"
   - Copy the folder ID from the URL (the long string after `/folders/`)

### 3. Set Up Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your values:
# DATABASE_URL=postgresql://...  (from Supabase)
# SUPABASE_JWT_SECRET=...  (from Supabase)
# JWT_SECRET_KEY=any-random-string
# GOOGLE_DRIVE_API_KEY=...  (optional, from Google Cloud)
# FRONTEND_URL=http://localhost:3000  (for local dev)

# Initialize database
python database.py

# Run locally to test
python app.py
```

Backend will run on `http://localhost:5000`

### 4. Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local:
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
# VITE_API_URL=http://localhost:5000
# VITE_GOOGLE_DRIVE_FOLDER_ID=...  (optional, your public folder ID)

# Run locally
npm run dev
```

Frontend will run on `http://localhost:3000`

### 5. Test Locally

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

**Advanced Formatting:**
```tsv
questionText	answerText
**Bold text** in question	Answer with *italic* text
Question with line break<br>Second line	Answer with horizontal rule<hr>Below the line
Multiple **bold** and *italic*	Combined **bold** and *italic* _text_
```

**Notes:**
- Use TAB character (not spaces) to separate columns
- `imageUrl` can be empty or contain a URL
- Image URLs can be wrapped in `__url__` format (will be cleaned)
- **Markdown formatting supported:**
  - `**text**` for **bold**
  - `*text*` or `_text_` for *italic*
- **HTML tags preserved:**
  - `<br>` for line breaks
  - `<hr>` for horizontal rules
  - `<p>` for paragraphs
- HTTP image URLs automatically upgraded to HTTPS

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
   - **Environment Variables:** Add all from your `.env` file:
     - `DATABASE_URL`
     - `SUPABASE_JWT_SECRET`
     - `JWT_SECRET_KEY`
     - `GOOGLE_DRIVE_API_KEY` (optional)
     - `FRONTEND_URL` (your Vercel URL after deployment)
6. Click "Create Web Service"
7. Copy the deployed URL (e.g., `https://quiz-app-backend.onrender.com`)

### Deploy Frontend to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Environment Variables:**
     - `VITE_SUPABASE_URL`: Your Supabase URL
     - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
     - `VITE_API_URL`: Your Render backend URL
     - `VITE_GOOGLE_DRIVE_FOLDER_ID`: Your public Google Drive folder ID (optional)
6. Click "Deploy"
7. Your app is live! 🎉

### Enable Authentication in Supabase

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL to "Site URL" (e.g., `https://quiz-app.vercel.app`)
3. Add redirect URLs if needed

## Usage Guide

### Guest Mode

Users can browse and practice question sets without signing in. Guest mode has limited features:
- ✅ Browse all question sets
- ✅ Practice with flashcards
- ❌ No progress tracking or statistics
- ❌ No bookmarks
- ❌ Cannot upload question sets

Sign in to unlock full features!

### For Authenticated Users

1. **Upload Questions:**
   - **Local Upload:** Click "Choose TSV File" to upload from your device (single or multiple files)
   - **Google Drive:**
     - Browse folders and select individual files
     - Select multiple files at once
     - **Recursive Import:** Click "📥 Import All" on any folder to import ALL TSV files from that folder and all its subfolders with one click (up to 50 files)
   - Review and deselect files before importing.
   - Enter a descriptive name and add tags (optional)
   - Set-level instructions can be added for context
   - Questions are imported and formatted automatically
   - Supports markdown (**bold**, *italic*) and HTML tags (`<br>`, `<hr>`)

2. **Practice:**
   - Choose from multiple modes:
     - **Continue Last Set** - Resume where you left off
     - **Browse Question Sets** - Select any specific set
     - **Random Unplayed Set** - Jump into an untouched set
     - **Random Mode** - Shuffle all questions
     - **Retry Missed** - Review wrong answers
     - **Review Bookmarks** - Practice saved questions

3. **Manage Question Sets:**
   - Browse all sets in Library view
   - Search by name or filter by tags
   - Filter by status: All, Completed, In-Progress, Unattempted
   - Sort by upload date, alphabetically, or last played
   - Rename or delete sets as needed

4. **During Practice:**
   - **Desktop:** Click card to flip, use keyboard shortcuts (Space, Arrows, Esc)
   - **Mobile:** Tap to flip, swipe right for correct, left for wrong
   - **Features:**
     - Bookmark important questions (⭐)
     - Text-to-Speech for accessibility (🔊)
     - Previous/Next navigation
     - View set instructions if available
   - Progress auto-saves after each question
   - Toggle dark mode anytime (🌓)

5. **After Session:**
   - View session summary with detailed stats (Correct/Wrong/Passed)
   - See accuracy percentage calculation
   - Choose to practice again, review only misses, or return home
   - Track your daily streak (🔥)

6. **Help & Documentation:**
   - Access help view from the navigation menu
   - Learn keyboard shortcuts and features

### Sharing with Others

1. Share your deployed URL (e.g., `https://quiz-app.vercel.app`)
2. Users can browse and practice without signing up (guest mode)
3. For full features, they sign up with email/password
4. They can see all question sets you upload (read-only)
5. Each person has their own progress tracking, streaks, and bookmarks
6. Full mobile support with swipe gestures and responsive design

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
│   ├── app.py              # Flask API entry point
│   ├── database.py         # Database schema
│   ├── routes/             # API route blueprints
│   ├── requirements.txt    # Python dependencies
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.js          # Root component with providers
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── views/          # Page-level components
│   │   ├── lib/            # API client & utilities
│   │   ├── constants/      # App constants
│   │   └── styles/         # Global styles
│   ├── package.json
│   └── README.md
├── docs/                   # Documentation
│   ├── CODE_STRUCTURE.md   # Architecture guide
│   ├── CHANGELOG.md        # Version history
│   └── API_REFERENCE.md    # API documentation
└── README.md               # This file
```

**For detailed structure, see [CODE_STRUCTURE.md](./docs/CODE_STRUCTURE.md).**

## 🎯 Security & Performance

**Security Features:**
- XSS Protection - All user input is sanitized
- Rate Limiting - Upload limits to prevent abuse
- File Validation - Only valid TSV files are accepted
- Secure Authentication - Powered by Supabase Auth

**Performance:**
- Fast loading with code splitting
- Optimized database queries
- Mobile-optimized interface
- Efficient connection handling

## 🔮 Future Enhancements

- [ ] Set mastery progress bars
- [ ] Spaced repetition algorithm
- [ ] Personal bests tracking
- [ ] Weekly activity summaries
- [ ] Optional leaderboards
- [ ] Export missed questions to Anki deck
- [ ] Category filtering
- [ ] Offline support (PWA)
- [ ] Native mobile apps

**See [CHANGELOG.md](./docs/CHANGELOG.md) for detailed roadmap.**

## Troubleshooting

For detailed troubleshooting guides, see **[docs/troubleshooting/](./docs/troubleshooting/)**

### Common Issues

**Backend won't connect to database**
- Check DATABASE_URL is correct (use Transaction mode connection string)
- Verify database is running in Supabase dashboard

**CORS errors**
- Check REACT_APP_API_URL points to correct backend
- Make sure backend is deployed and running

**Authentication not working**
- See [Authentication Issue Fix](./docs/troubleshooting/AUTH_ISSUE_FIX.md)
- Verify Supabase credentials are correct
- Check browser console for errors

**Upload fails**
- Check TSV format (tabs, not spaces)
- Verify file has correct headers

For more help, check:
1. Backend logs on Render dashboard
2. Browser console (F12) for frontend errors
3. [Troubleshooting guides](./docs/troubleshooting/)

## License

MIT - Feel free to use and modify!

---

