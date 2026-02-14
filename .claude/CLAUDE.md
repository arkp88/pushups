# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Commands
- **Install All:** `npm install --prefix frontend && pip install -r backend/requirements.txt`
- **Dev Frontend:** `cd frontend && npm run dev` (port 3000, proxies `/api` to backend)
- **Dev Backend:** `cd backend && python app.py` (port 5000)
- **Test All:** `./tests/run_all_tests.sh`
- **Test Frontend:** `cd frontend && npm test` (Vitest, watch mode)
- **Test Frontend (single run):** `cd frontend && npm run test:run`
- **Test Backend:** `cd backend && python -m pytest ../tests/backend/`
- **Lint/Fix:** `cd frontend && npx eslint src/ --fix`
- **Build Frontend:** `cd frontend && npm run build` (outputs to `frontend/build/`)

## Architecture

### Backend (Flask + PostgreSQL)
- **Entry:** `backend/app.py` → registers blueprints with `/api` prefix
- **Routes:** `backend/routes/` — Blueprint per domain (sets, questions, stats, drive, health, public)
- **Auth:** `backend/auth/middleware.py` — `@token_required` decorator verifies Supabase JWT, auto-creates user on first login, sets `request.current_user`
- **Database:** `backend/services/database.py` — ThreadedConnectionPool. Pattern: `conn = get_db()` → use with `RealDictCursor` → `return_db(conn)` in `finally`
- **TSV Parser:** `backend/services/tsv_parser.py` — handles uploads with SHA-256 dedup, batch inserts (100 rows), multi-encoding support. Requires **literal TAB characters** as delimiters.
- **Public routes (no auth):** Only `health.py` and `public.py`

### Frontend (React 18 + Vite)
- **Path alias:** `@/` → `frontend/src/` (configured in vite.config.js)
- **Icons:** Phosphor Icons (`@phosphor-icons/react`), not Lucide
- **State pattern:** React Context for global state (auth, theme, notifications) + custom hooks for domain logic (`usePractice`, `useUpload`, `useQuestionSets`, `useStats`)
- **Views:** Lazy-loaded via `React.lazy()` in `App.js`
- **API client:** `frontend/src/lib/api.js` — centralized, handles auth headers and Render.com wake detection
- **Mobile:** Custom swipe gestures in `frontend/src/hooks/useSwipeGestures.js`, keyboard shortcuts in `useKeyboardShortcuts.js`
- **CSS:** Plain CSS with CSS variables (`styles/variables.css`), component-specific files in `styles/components/`

## Project Context
- **Scale:** Hobbyist app, ~150 users max, solo developer. YAGNI — avoid over-engineering.
- **Hosting:** Free tiers (Render backend, Supabase DB). Handle cold starts gracefully (Render sleeps after 15m).
- **Sanitization:** All user inputs must be sanitized (backend uses `bleach`, frontend uses `lib/sanitizer.js`).

## Code Style
- **Frontend:** Functional components, PascalCase components, camelCase functions/variables
- **Backend:** Flask Blueprints, snake_case, JSON error responses (`{'error': '...', 'message': '...'}`)
- **Git:** Conventional commits (`feat:`, `fix:`, `refactor:`)
