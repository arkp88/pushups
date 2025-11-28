# Quiz App Frontend

React-based frontend for the quiz practice application.

## Features

- 🔐 User authentication with Supabase
- 📤 Upload TSV question files
- 🃏 Flashcard-style question practice
- 📊 Progress tracking and statistics
- 📱 Mobile-responsive design
- ✅ Mark questions as correct/missed
- 🎯 Filter and practice specific question sets

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

You'll need:
- `REACT_APP_SUPABASE_URL`: Your Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `REACT_APP_API_URL`: Backend API URL (use `http://localhost:5000` for local development)

### 3. Run Development Server

```bash
npm start
```

App will run on `http://localhost:3000`

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Deployment to Vercel

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Add environment variables in Vercel dashboard

### Option 2: Using GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
   - `REACT_APP_API_URL` (your deployed backend URL)
6. Deploy!

## Usage

### Authentication
1. Sign up with email and password
2. Check your email for confirmation link (if email confirmation is enabled)
3. Sign in

### Uploading Questions
1. Click "Choose TSV File"
2. Select your TSV file
3. Enter a name for the question set
4. Questions will be imported automatically

### Practicing
1. Click on any question set
2. Use flashcard interface:
   - Click card to flip and see answer
   - Click "Got it right" if you answered correctly
   - Click "Missed it" to mark for review
   - Use Previous/Skip to navigate
3. Progress is automatically saved

### Viewing Stats
- Click "Stats" button to see your overall performance
- View total questions, attempts, accuracy, and missed questions

## TSV File Format

Your TSV files should have these columns:
```
roundNo	questionNo	questionText	imageUrl	answerText
```

Example:
```
Round 1	Question 1	What is 2+2?		4
Round 1	Question 2	Capital of France?		Paris
```

## Mobile Usage

The app is fully responsive and works great on mobile browsers. For a more app-like experience:

1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap the Share button
3. Select "Add to Home Screen"
4. The app will now appear like a native app!

## Troubleshooting

### CORS Errors
If you see CORS errors, make sure:
- Backend is running
- `REACT_APP_API_URL` is correctly set
- Backend has CORS configured for your frontend URL

### Authentication Issues
- Check Supabase credentials are correct
- Verify email confirmation settings in Supabase dashboard
- Check browser console for specific errors

### Upload Not Working
- Verify TSV file format is correct
- Check file has proper tab separation (not spaces)
- Look at browser network tab for error details
