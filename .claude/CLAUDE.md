# CLAUDE.md

## 🛠 Project Commands
- **Install All:** `npm install --prefix frontend && pip install -r backend/requirements.txt`
- **Dev Frontend:** `cd frontend && npm run dev`
- **Dev Backend:** `cd backend && python app.py`
- **Test All:** `./run_all_tests.sh`
- **Test Frontend:** `cd frontend && npm test`
- **Lint/Fix:** `cd frontend && npm run lint:fix`

## 🏗 Architecture & Logic
- **Auth Flow:** Supabase JWT. Backend routes must use the `@token_required` decorator.
- **Database:** PostgreSQL (Supabase). Always use the connection pooler in `backend/services/database.py`.
- **Uploads:** 16MB limit. TSV parser requires **literal TAB characters**.
- **Mobile UI:** Custom swipe gestures are in `frontend/src/lib/gestures.js`.

## 🎯 Project Context & Strategy
- **Scale:** Hobbyist app, ~150 users max, low concurrency.
- **Priority:** Simplicity and maintainability for a solo developer.
- **Philosophy:** Avoid over-engineering. Favor readable, standard patterns over complex optimizations (YAGNI - You Ain't Gonna Need It).
- **Resource Constraints:** Running on Free Tiers (Render/Supabase). Keep the footprint small and handle cold starts gracefully.

## 📏 Code Style
- **Frontend:** React 18 (Functional), Lucide Icons, PascalCase components.
- **Backend:** Flask Blueprints, snake_case, strict JSON error responses.
- **Git:** Conventional commits (e.g., `feat:`, `fix:`, `refactor:`).

## ⚠️ Known Constraints
- **Cold Starts:** Render.com free tier sleeps after 15m.
- **Public Routes:** Only `health.py` and `public.py` bypass auth.
- **Sanitization:** All inputs must pass through `lib/sanitizer.js` logic.