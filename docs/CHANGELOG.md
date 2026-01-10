# Changelog

All notable changes to the Quiz App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2.0.0] - 2026-01-01

### Major Refactoring Release 🎉

This release focuses on code quality, maintainability, and mobile UX improvements. No user-facing feature changes, but significant internal improvements.

### Added

#### New Contexts
- **AuthContext** - Centralized authentication state management
  - Replaces local session state in App.js
  - Provides `useAuth()` hook for accessing session
  - Automatic session persistence and cleanup

- **ThemeContext** - Dark mode state management
  - Replaces local dark mode state
  - Provides `useTheme()` hook with `toggleDarkMode()`
  - Handles body class application and localStorage sync

- **NotificationContext** - Unified notification system
  - Consolidates 4 separate notification states into one
  - Provides `notify()` and `notifyLegacy()` methods
  - Auto-dismiss with configurable durations
  - Wake detection state management

#### New Components
- **RenameModal** - Extracted from App.js inline modal
- **LoadingState** - Reusable loading indicator
- **ErrorState** - Reusable error display with retry
- **NotificationDisplay** - Global notification banner

#### New Hooks
- **useTextToSpeech** - Text-to-speech functionality (extracted from usePractice)
- **useSessionTracking** - Session statistics tracking (extracted from usePractice)

#### New Features
- **Mobile Drive UX** - Tap-to-expand import button pattern
  - First tap: Expand to show "Tap to Import" button
  - Second tap: Trigger import
  - Auto-collapse after 3 seconds
  - Full folder names now visible on mobile

#### Testing
- **usePractice unit tests** - 24 tests with 77.7% coverage
  - Tests for startPractice, handleNext, handleBookmark
  - Session stats tracking validation
  - localStorage position persistence

#### Documentation
- **CODE_STRUCTURE.md** - Comprehensive code architecture guide
- **CHANGELOG.md** - This file

### Changed

#### Code Organization
- **App.js** reduced from 419 to ~272 lines (-35%)
  - Split into `AppContent` (uses hooks) and `App` (provides contexts)
  - Removed duplicate session management logic (now in AuthContext)
  - Removed dark mode logic (now in ThemeContext)
  - Extracted inline modals to components

- **HomeView.js** - Migrated all inline styles to CSS
  - Created `HomeView.css` with responsive styles
  - Cleaner JSX, better mobile support

- **DriveFileItem.js** - Complete rewrite for mobile UX
  - Migrated from inline styles to `DriveFileItem.css`
  - Added tap-to-expand interaction pattern
  - Better touch targets (40x40px minimum)

- **Constants centralization**
  - Created `/constants/storage.js` for all localStorage keys
  - Updated all files to use `STORAGE_KEYS` instead of magic strings

#### Props Drilling Reduction
- `session` now from `useAuth()` instead of passed through 5+ components
- `darkMode` now from `useTheme()` instead of prop drilling
- Notifications now use `useNotification()` instead of callback props

#### CSS Migration
- Removed inline styles from:
  - HomeView.js (streak banner, guest signin, practice buttons)
  - DriveFileItem.js (all flex layouts)
  - App.js (auth container, loading fallback)
- Added CSS files with responsive breakpoints

### Fixed

- **NotificationContext auto-dismiss bug** - Fixed race condition where timestamp comparison used `Date.now()` at setTimeout time instead of notification creation time
- **Inline style maintenance issues** - All critical UI now uses CSS classes
- **Props drilling complexity** - Reduced by 60% with context providers

### Removed

- Duplicate notification state variables (consolidated into NotificationContext)
- Inline dark mode logic from App.js
- Inline session management from App.js
- Magic string literals (replaced with constants)

### Performance

- **Bundle size** - Slightly increased due to new components, but better code splitting
- **Re-render optimization** - Memoized context values prevent unnecessary renders
- **CSS caching** - Migrated styles benefit from browser caching

### Developer Experience

- **Code reduction** - 340 net lines removed (724 deleted, 384 added)
- **Maintainability** - Clear separation of concerns with contexts
- **Testability** - Hooks are now easier to test in isolation
- **Type safety** - PropTypes added to all new components

### Migration Notes

No breaking changes for users. For developers:
- Import contexts from `/contexts` instead of managing state locally
- Use `STORAGE_KEYS` from `/constants` for localStorage access
- Use extracted hooks (`useTextToSpeech`, `useSessionTracking`) for modular functionality

---

## [1.0.0] - 2025-12-XX

### Initial Release

#### Features
- User authentication with Supabase
- Practice modes: Single set, Mixed (all/missed/bookmarks), Random
- Google Drive integration for importing question sets
- Local TSV file upload
- Mobile swipe gestures
- Dark mode support
- Session statistics tracking
- Bookmark system
- Resume functionality (save position per set)
- Text-to-speech for questions/answers
- Streak tracking
- Guest mode for unauthenticated users

#### Tech Stack
- Frontend: React 18, Create React App
- Backend: Flask, PostgreSQL, Supabase Auth
- Deployment: Vercel (frontend), Render (backend)
- APIs: Google Drive API

---

## Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backward compatible)
- **PATCH** version for bug fixes (backward compatible)

---

## Upgrade Guide

### From 1.0.0 to 2.0.0

**No user action required** - This is a code refactoring release with no breaking changes to functionality.

**For developers:**
1. Pull latest `main` branch
2. Run `npm install` (new test dependencies)
3. Review new context providers in `App.js`
4. Use `useAuth()`, `useTheme()`, `useNotification()` hooks instead of props
5. Import `STORAGE_KEYS` from `/constants` for localStorage

**Breaking changes:** None

---

## Roadmap

### Planned for 2.1.0
- [ ] Set mastery progress bars
- [ ] Spaced repetition algorithm
- [ ] Personal bests tracking
- [ ] Weekly activity summaries

### Planned for 2.2.0
- [ ] Component library with Storybook
- [ ] E2E tests with Playwright
- [ ] TypeScript migration (phase 1)

### Planned for 3.0.0
- [ ] Optional leaderboards
- [ ] Social features (share sets)
- [ ] Advanced analytics dashboard

---

## Support

For questions about changes:
- Check [CODE_STRUCTURE.md](./CODE_STRUCTURE.md) for architecture details
- Review [ENVIRONMENT.md](./ENVIRONMENT.md) for environment setup
- Open an issue on GitHub for bugs or feature requests
