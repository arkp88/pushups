# Quiz App Backend

Flask API server for the quiz practice application.

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

You'll need:
- `DATABASE_URL`: PostgreSQL connection string from Supabase
- `SUPABASE_JWT_SECRET`: JWT secret from Supabase Project Settings > API
- `JWT_SECRET_KEY`: Any random string for additional security

### 3. Initialize Database

```bash
python database.py
```

### 4. Run Development Server

```bash
python app.py
```

Server will run on `http://localhost:5000`

## API Endpoints

### Authentication
All endpoints except `/health` require `Authorization: Bearer <token>` header with Supabase JWT token.

### Endpoints

- `GET /health` - Health check
- `POST /api/upload-tsv` - Upload TSV file with questions
- `GET /api/question-sets` - Get all question sets
- `GET /api/question-sets/<set_id>/questions` - Get questions for a set
- `POST /api/questions/<question_id>/progress` - Update question progress
- `POST /api/questions/<question_id>/mark-missed` - Mark question as missed
- `POST /api/questions/<question_id>/unmark-missed` - Unmark missed question
- `GET /api/missed-questions` - Get all missed questions
- `GET /api/stats` - Get user statistics

## Deployment to Render

1. Create account on [Render.com](https://render.com)
2. Create new Web Service
3. Connect your Git repository
4. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
   - Add environment variables from `.env`
5. Deploy!

## TSV File Format

The app expects TSV files with these columns:
- `roundNo` - Round identifier
- `questionNo` - Question number
- `questionText` - The question
- `imageUrl` - Optional image URL (can be in markdown format `__url__`)
- `answerText` - The answer

Example:
```
roundNo	questionNo	questionText	imageUrl	answerText
Round 1	Question 1	What is the capital of France?		Paris
```
