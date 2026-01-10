# Quiz App - Code Structure Documentation

**Last Updated:** January 2026
**Version:** 2.0 (Post-Refactoring)

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Frontend Structure](#frontend-structure)
- [Backend Structure](#backend-structure)
- [Key Patterns](#key-patterns)
- [Data Flow](#data-flow)

---

## Overview

The Quiz App is a full-stack flashcard application built with:
- **Frontend:** React 18 with functional components and hooks
- **Backend:** Python Flask with Supabase for authentication and PostgreSQL database
- **Deployment:** Frontend on Vercel, Backend on Render

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Frontend                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐      │
│  │   Views    │──│   Hooks    │──│   Contexts   │      │
│  └────────────┘  └────────────┘  └──────────────┘      │
│         │              │                  │              │
│         └──────────────┴──────────────────┘              │
│                        │                                 │
│                  ┌─────▼──────┐                          │
│                  │  API Layer │                          │
│                  └─────┬──────┘                          │
└────────────────────────┼────────────────────────────────┘
                         │ HTTP/REST
┌────────────────────────▼────────────────────────────────┐
│                      Backend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Flask API  │──│  Supabase    │──│  PostgreSQL  │  │
│  │  (Blueprints)│  │    Auth      │  │   Database   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Frontend Structure

### Directory Layout

```
frontend/src/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Auth.js          # Authentication form
│   │   ├── ErrorState.js    # Error display component
│   │   ├── LoadingState.js  # Loading indicator
│   │   ├── Navbar.js        # Navigation bar
│   │   ├── RenameModal.js   # Modal for renaming sets
│   │   ├── NotificationDisplay.js  # Global notifications
│   │   └── index.js         # Barrel exports
│   ├── practice/            # Practice/flashcard components
│   │   ├── Flashcard.js     # Main flashcard display
│   │   ├── FlashcardControls.js
│   │   ├── SessionSummaryModal.js
│   │   └── index.js
│   └── upload/              # Upload/import components
│       ├── DriveBrowser.js  # Google Drive file browser
│       ├── DriveFileItem.js # Individual file/folder item
│       ├── ImportView.js    # Import tab content
│       ├── LibraryView.js   # User's uploaded sets
│       └── index.js
├── contexts/                # React Context providers
│   ├── AuthContext.js       # Authentication state
│   ├── ThemeContext.js      # Dark mode state
│   ├── NotificationContext.js # Global notifications
│   └── index.js
├── hooks/                   # Custom React hooks
│   ├── usePractice.js       # Practice session logic
│   ├── useQuestionSets.js   # Question sets management
│   ├── useStats.js          # User statistics
│   ├── useUpload.js         # Upload/import logic
│   ├── useTextToSpeech.js   # TTS functionality
│   ├── useSessionTracking.js # Session stats tracking
│   ├── useSwipeGestures.js  # Mobile swipe detection
│   ├── __tests__/           # Hook unit tests
│   └── index.js
├── views/                   # Page-level components
│   ├── HomeView.js          # Home page with practice modes
│   ├── PracticeView.js      # Practice session view
│   ├── SetsView.js          # Browse all question sets
│   ├── StatsView.js         # User statistics dashboard
│   ├── UploadView.js        # Upload/import management
│   ├── HelpView.js          # Help/instructions
│   └── index.js
├── lib/                     # Utilities and API clients
│   ├── api.js               # Backend API client
│   ├── supabase.js          # Supabase client setup
│   └── utils.js             # Helper functions
├── constants/               # App constants
│   └── storage.js           # localStorage keys
├── styles/                  # Global styles
│   ├── base.css
│   ├── variables.css
│   ├── animations.css
│   ├── components/          # Component-specific styles
│   └── utils/               # Utility classes
└── App.js                   # Root component with providers
```

### Component Hierarchy

```
App (AuthProvider > ThemeProvider > NotificationProvider)
├── Navbar
├── ErrorBoundary
│   └── Suspense
│       ├── HomeView
│       ├── PracticeView
│       │   ├── Flashcard
│       │   ├── FlashcardControls
│       │   └── SessionSummaryModal
│       ├── SetsView
│       ├── UploadView
│       │   ├── ImportView
│       │   │   ├── LocalUploadSection
│       │   │   └── DriveBrowser
│       │   │       └── DriveFileItem
│       │   └── LibraryView
│       │       └── LibrarySetCard
│       ├── StatsView
│       └── HelpView
├── RenameModal
└── NotificationDisplay
```

---

## Backend Structure

### Directory Layout

```
backend/
├── app.py                   # Flask app entry point
├── routes/
│   ├── questions.py         # Question CRUD endpoints
│   ├── sets.py              # Question set management
│   ├── stats.py             # User statistics
│   ├── upload.py            # File upload handling
│   └── drive.py             # Google Drive integration
├── middleware/
│   └── auth.py              # Supabase JWT verification
├── utils/
│   ├── db.py                # Database connection pooling
│   └── parsers.py           # TSV/file parsing
└── requirements.txt
```

### API Endpoints

#### Question Sets
- `GET /api/sets` - List all question sets
- `POST /api/sets` - Create new set
- `PUT /api/sets/<id>` - Rename set
- `DELETE /api/sets/<id>` - Delete set
- `POST /api/sets/<id>/mark-opened` - Mark set as opened

#### Questions
- `GET /api/sets/<id>/questions` - Get questions for a set
- `GET /api/questions/mixed/<filter>` - Get mixed questions (all/missed/bookmarks)
- `PUT /api/questions/<id>/progress` - Update question progress
- `POST /api/questions/<id>/bookmark` - Toggle bookmark

#### Statistics
- `GET /api/stats` - Get user statistics

#### Upload
- `POST /api/upload/local` - Upload local TSV file
- `POST /api/upload/drive` - Import from Google Drive

#### Google Drive
- `GET /api/drive/list/<folder_id>` - List Drive folder contents
- `POST /api/drive/fetch-recursive` - Recursively fetch TSV files from folder

---

## Key Patterns

### 1. Context Providers Pattern

All global state is managed through React Context:

```javascript
// App.js
<AuthProvider>
  <ThemeProvider>
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  </ThemeProvider>
</AuthProvider>
```

**Why:** Eliminates props drilling, centralizes state management.

### 2. Custom Hooks Pattern

Business logic is extracted into custom hooks:

```javascript
// Example: usePractice hook
const practice = usePractice(session, notifyLegacy);

// Usage
practice.startPractice(set);
practice.handleNext(isCorrect);
practice.handleBookmark();
```

**Why:** Reusable, testable, separates UI from logic.

### 3. Lazy Loading Pattern

Views are loaded on-demand:

```javascript
const HomeView = lazy(() => import('./views/HomeView'));
const PracticeView = lazy(() => import('./views/PracticeView'));
```

**Why:** Faster initial load, better code splitting.

### 4. Optimistic UI Updates

User actions update UI immediately, rollback on error:

```javascript
// Bookmark toggle - instant feedback
setQuestions(optimisticUpdate);
try {
  await api.toggleBookmark(id);
} catch (error) {
  setQuestions(rollback); // Revert on failure
}
```

**Why:** Better UX, feels more responsive.

### 5. localStorage Position Persistence

Quiz position is saved locally for each set:

```javascript
const key = getQuizPositionKey(setId); // "pushups-quiz-position-123"
localStorage.setItem(key, currentIndex);
```

**Why:** Users can resume where they left off across sessions.

---

## Data Flow

### Practice Session Flow

```
1. User clicks "Start Practice"
   ↓
2. usePractice.startPractice(set)
   ↓
3. api.getQuestions(setId)
   ↓
4. Backend: Fetch questions + mark set as opened
   ↓
5. Frontend: Load questions, check localStorage for saved position
   ↓
6. Render Flashcard component
   ↓
7. User answers (correct/wrong)
   ↓
8. Track in session stats + save progress to backend
   ↓
9. Move to next question, save position to localStorage
   ↓
10. End of set: Show SessionSummaryModal
```

### Authentication Flow

```
1. User signs in with email
   ↓
2. Supabase Auth creates session
   ↓
3. AuthContext stores session state
   ↓
4. Session token included in all API requests (Authorization header)
   ↓
5. Backend verifies JWT with Supabase
   ↓
6. Returns user-specific data
```

### Notification Flow

```
1. Component calls notify() or notifyLegacy()
   ↓
2. NotificationContext updates state
   ↓
3. NotificationDisplay renders banner
   ↓
4. Auto-dismiss after duration (or manual dismiss)
   ↓
5. Notification cleared from state
```

---

## State Management

### Global State (Contexts)

| Context | Manages | Used By |
|---------|---------|---------|
| AuthContext | User session, authentication status | All authenticated features |
| ThemeContext | Dark mode toggle | Navbar, all views |
| NotificationContext | Global notifications, wake detection | All components |

### Local State (Hooks)

| Hook | Manages | Shared Via |
|------|---------|------------|
| usePractice | Practice session, questions, stats | Props to PracticeView |
| useQuestionSets | All question sets, loading state | Props to views |
| useStats | User statistics | Props to HomeView, StatsView |
| useUpload | Upload/import state, Drive browser | Props to UploadView |

### Component State

Each component manages its own UI state (modals, dropdowns, etc).

---

## Constants

All magic strings are centralized in `/constants/storage.js`:

```javascript
export const STORAGE_KEYS = {
  DARK_MODE: 'darkMode',
  LAST_SET_ID: 'pushups-last-set-id',
  QUIZ_POSITION: 'pushups-quiz-position',
  SEEN_SWIPE_TUTORIAL: 'hasSeenSwipeTutorial',
};
```

**Usage:**
```javascript
localStorage.getItem(STORAGE_KEYS.DARK_MODE);
```

---

## Testing Strategy

### Unit Tests
- Custom hooks (`usePractice.test.js` - 24 tests, 77% coverage)
- Pure utility functions

### Integration Tests
- End-to-end user flows (planned)

### Manual Testing Checklist
- [ ] Guest mode access
- [ ] Sign in/sign out
- [ ] Practice all modes (single, mixed, missed, bookmarks)
- [ ] Upload local TSV
- [ ] Import from Google Drive
- [ ] Mobile swipe gestures
- [ ] Dark mode toggle
- [ ] Session resume after page refresh

---

## Performance Optimizations

1. **Code Splitting:** Lazy-loaded views reduce initial bundle size
2. **Memoization:** `useMemo`, `useCallback` prevent unnecessary re-renders
3. **CSS-in-CSS:** Migrated from inline styles for better caching
4. **Connection Pooling:** Backend reuses database connections
5. **Optimistic Updates:** UI responds instantly, syncs in background

---

## Mobile Responsiveness

### Key Features
- Swipe gestures for correct/wrong answers
- Touch-optimized buttons (min 40x40px)
- Tap-to-expand pattern for Drive import (prevents accidental clicks)
- Responsive layouts (<480px, <768px breakpoints)
- Auto-hiding navbar on scroll

---

## Security Considerations

### Frontend
- No secrets in code (env variables for API keys)
- JWT token stored in httpOnly cookies by Supabase
- Input sanitization before API calls

### Backend
- JWT verification on all protected endpoints
- Rate limiting on upload endpoints
- SQL injection prevention (parameterized queries)
- CORS whitelist for allowed origins
- File size limits (16MB max)

---

## Future Improvements

### Code Quality
- [ ] Increase test coverage to 80%+
- [ ] Add E2E tests with Playwright
- [ ] TypeScript migration for better type safety
- [ ] Component documentation with Storybook

### Features
- [ ] Spaced repetition algorithm
- [ ] Set mastery progress bars
- [ ] Personal bests tracking
- [ ] Optional leaderboards

---

## Getting Started (Development)

### Frontend
```bash
cd frontend
npm install
npm start  # Development server on localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
python app.py  # Development server on localhost:5000
```

### Environment Variables
See [ENVIRONMENT.md](./ENVIRONMENT.md) for required variables.

---

## Deployment

### Frontend (Vercel)
```bash
npm run build
# Vercel auto-deploys from main branch
```

### Backend (Render)
```bash
# Render auto-deploys from main branch
# Uses Dockerfile or build.sh
```

---

## Contributing

1. Create feature branch from `main`
2. Make changes, add tests
3. Run `npm test` and `npm run build`
4. Create PR with description
5. Merge after review

---

## Support

For issues or questions:
- GitHub Issues: [Quiz App Issues](https://github.com/yourusername/quiz-app/issues)
- Documentation: `/docs` folder

---

**Last Refactor:** January 2026 - Major code cleanup, context providers, mobile UX improvements
