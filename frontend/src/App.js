import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { api, setBackendWakingCallback } from '@/lib';
import { Auth, Navbar, ErrorBoundary, RenameModal, LoadingState, ErrorState, NotificationDisplay } from '@/components/common';
import { useStats, useQuestionSets, usePractice, useUpload } from '@/hooks';
import { NotificationProvider, useNotification, AuthProvider, useAuth, ThemeProvider, useTheme } from '@/contexts';

// Lazy load view components for code splitting
const HomeView = lazy(() => import('@/views/HomeView'));
const SetsView = lazy(() => import('@/views/SetsView'));
const UploadView = lazy(() => import('@/views/UploadView'));
const PracticeView = lazy(() => import('@/views/PracticeView'));
const StatsView = lazy(() => import('@/views/StatsView'));
const HelpView = lazy(() => import('@/views/HelpView'));

function AppContent() {
  // Use auth context
  const { session, loading } = useAuth();

  const [view, setView] = useState('home');
  const [mixedFilter, setMixedFilter] = useState('all');
  const [uploadMode, setUploadMode] = useState('local');
  const [deletingSetId, setDeletingSetId] = useState(null);
  const [setToDelete, setSetToDelete] = useState(null);
  const [renamingSet, setRenamingSet] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renamingInProgressId, setRenamingInProgressId] = useState(null);

  // Use notification context
  const { notifyLegacy, setWaking, isWaking } = useNotification();

  // Use theme context
  const { darkMode, setDarkMode } = useTheme();

  // Drive folder ID from environment
  const ROOT_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID || '1WucWdJWvvRdqwY7y8r-B1VFBo0Bh8L9_';

  // Custom hooks - pass notification callback
  const { stats, loadStats } = useStats(session);
  const { questionSets, loading: setsLoading, error: setsError, loadQuestionSets } = useQuestionSets(session);
  const practice = usePractice(session, notifyLegacy);
  const upload = useUpload(ROOT_FOLDER_ID, view, uploadMode, session, notifyLegacy);

  // Redirect to home on logout
  const prevSessionRef = useRef(session);
  useEffect(() => {
    if (prevSessionRef.current && !session) {
      // User just logged out
      setView('home');
    }
    prevSessionRef.current = session;
  }, [session]);

  // Set up backend wake detection callback
  useEffect(() => {
    setBackendWakingCallback(setWaking);
  }, [setWaking]);

  // Scroll logic for header
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hide on scroll down, show on scroll up (works for both mobile header and desktop navbar)
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Wrapper functions that call hook methods and handle view transitions (memoized)
  const startPracticeWrapper = useCallback(async (set, isRandomSession = false) => {
    const success = await practice.startPractice(set, isRandomSession);
    if (success) {
      setView('practice');
    }
  }, [practice]);

  const startMixedPracticeWrapper = useCallback(async (filter) => {
    const success = await practice.startMixedPractice(filter);
    if (success) {
      setView('practice');
    }
  }, [practice]);

  const handleNextWrapper = useCallback(async (markAsCorrect = null) => {
    await practice.handleNext(markAsCorrect, () => {
      // Don't auto-navigate to home - let the session summary modal handle navigation
      // Just refresh the data in case user wants to see updated stats
      loadQuestionSets();
      loadStats();
    });
  }, [practice, loadQuestionSets, loadStats]);

  const handleBookmarkWrapper = useCallback(async (e) => {
    await practice.handleBookmark(e);
    loadStats();
  }, [practice, loadStats]);

  const handleDeleteSet = useCallback(async (setId) => {
    try {
      setDeletingSetId(setId);
      await api.deleteQuestionSet(setId);
      await loadQuestionSets();
      notifyLegacy('Question set deleted successfully.', false);
    } catch (error) {
      console.error(error);
      notifyLegacy('Error deleting set: ' + error.message, true);
    } finally {
      setDeletingSetId(null);
      setSetToDelete(null);
    }
  }, [loadQuestionSets, notifyLegacy]);

  const openRenameModal = useCallback((set) => {
    setRenamingSet(set);
    setRenameValue(set.name);
  }, []);

  const saveRename = useCallback(async () => {
    if (!renamingSet || !renameValue.trim()) return;

    setRenamingInProgressId(renamingSet.id);

    try {
      await api.renameSet(renamingSet.id, renameValue.trim());
      await loadQuestionSets();
      setRenamingSet(null);
      notifyLegacy('Set renamed successfully.', false);
    } catch (error) {
      notifyLegacy('Failed to rename: ' + error.message, true);
    } finally {
      setRenamingInProgressId(null);
    }
  }, [renamingSet, renameValue, loadQuestionSets, notifyLegacy]);

  // Loading fallback for Suspense - use the shared LoadingState component
  const SuspenseFallback = useMemo(() => (
    <LoadingState message="Loading..." />
  ), []);

  if (loading) return <div className="loading">Loading...</div>;

  // Guest mode: Allow users to access the app without authentication
  // session can be null for guests
  return (
    <div className="App">
      <Navbar view={view} setView={setView} showNavbar={showNavbar} session={session} darkMode={darkMode} setDarkMode={setDarkMode} />

      <ErrorBoundary>
        <Suspense fallback={SuspenseFallback}>
        {/* Notifications */}
        <NotificationDisplay />

        {/* HOME VIEW */}
        {view === 'home' && (
          setsLoading ? (
            <LoadingState message="Loading your pushups..." />
          ) : setsError ? (
            <ErrorState
              message={setsError}
              onRetry={() => loadQuestionSets()}
            />
          ) : stats ? (
            <HomeView
              setAppNotification={notifyLegacy}
              stats={stats}
              questionSets={questionSets}
              practice={practice}
              startPracticeWrapper={startPracticeWrapper}
              startMixedPracticeWrapper={startMixedPracticeWrapper}
              mixedFilter={mixedFilter}
              setMixedFilter={setMixedFilter}
              setView={setView}
              session={session}
              backendWaking={isWaking}
            />
          ) : null
        )}

      {/* STATS VIEW */}
      {view === 'stats' && stats && <StatsView stats={stats} />}

      {/* HELP VIEW */}
      {view === 'help' && <HelpView />}

      {/* AUTH VIEW - Sign in/Sign up */}
      {view === 'auth' && (
        <div className="auth-container">
          <Auth onSuccess={() => setView('home')} />
        </div>
      )}

      {/* SETS VIEW */}
      {view === 'sets' && (
        <SetsView
          questionSets={questionSets}
          practice={practice}
          startPracticeWrapper={startPracticeWrapper}
          backendWaking={isWaking}
        />
      )}

      {/* UPLOAD VIEW */}
      {view === 'upload' && (
        <UploadView
          upload={upload}
          uploadMode={uploadMode}
          setUploadMode={setUploadMode}
          loadQuestionSets={loadQuestionSets}
          questionSets={questionSets}
          session={session}
          setToDelete={setToDelete}
          setSetToDelete={setSetToDelete}
          deletingSetId={deletingSetId}
          handleDeleteSet={handleDeleteSet}
          openRenameModal={openRenameModal}
          renamingInProgressId={renamingInProgressId}
        />
      )}

      {/* PRACTICE VIEW */}
      {view === 'practice' && practice.questions.length > 0 && (
        <PracticeView
          practice={practice}
          questionSets={questionSets}
          startPracticeWrapper={startPracticeWrapper}
          startMixedPracticeWrapper={startMixedPracticeWrapper}
          handleNextWrapper={handleNextWrapper}
          handleBookmarkWrapper={handleBookmarkWrapper}
          setView={setView}
        />
      )}

      {/* RENAME MODAL */}
      <RenameModal
        set={renamingSet}
        value={renameValue}
        onChange={setRenameValue}
        onSave={saveRename}
        onClose={() => setRenamingSet(null)}
        isLoading={renamingInProgressId}
      />
      </Suspense>
      </ErrorBoundary>

    </div>
  );
}

// Wrap AppContent with providers
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App; 