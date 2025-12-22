import { useState, useEffect, useRef, lazy, Suspense, useCallback, useMemo } from 'react';
import { supabase, api, setBackendWakingCallback } from './lib';
import { Auth, Navbar, ErrorBoundary } from './components/common';
import { useStats, useQuestionSets, usePractice, useUpload } from './hooks';
import './App.css';

// Lazy load view components for code splitting
const HomeView = lazy(() => import('./views/HomeView'));
const SetsView = lazy(() => import('./views/SetsView'));
const UploadView = lazy(() => import('./views/UploadView'));
const PracticeView = lazy(() => import('./views/PracticeView'));
const StatsView = lazy(() => import('./views/StatsView'));
const HelpView = lazy(() => import('./views/HelpView'));

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home');
  const [mixedFilter, setMixedFilter] = useState('all');
  const [uploadMode, setUploadMode] = useState('local');
  const [deleteNotification, setDeleteNotification] = useState('');
  const [deletingSetId, setDeletingSetId] = useState(null);
  const [setToDelete, setSetToDelete] = useState(null);
  const [renamingSet, setRenamingSet] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  // NEW: State for showing rename loading indicator
  const [renamingInProgressId, setRenamingInProgressId] = useState(null);

  // Global notification state for general errors/info outside of practice
  const [globalNotification, setGlobalNotification] = useState(null);
  const notificationRef = useRef(null);

  // Backend wake-up notification state
  const [backendWaking, setBackendWaking] = useState(false);

  // Dark mode state - persisted to localStorage
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Drive folder ID from environment
  const ROOT_FOLDER_ID = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID || '1WucWdJWvvRdqwY7y8r-B1VFBo0Bh8L9_';

  // Generic notification setter with auto-clear
  const setGlobalNotificationWrapper = useCallback((message, isError = false) => {
    const type = isError ? '❌ Error: ' : 'ℹ️ ';
    setGlobalNotification({ text: type + message, isError });

    // Notification is now fixed at top, so no need to scroll
    // Auto-dismiss after 5 seconds (longer for errors to ensure they're seen)
    setTimeout(() => setGlobalNotification(null), isError ? 6000 : 4000);
  }, []);

  // Custom hooks - pass new wrapper
  const { stats, loadStats } = useStats(session);
  const { questionSets, loading: setsLoading, error: setsError, loadQuestionSets } = useQuestionSets(session);
  const practice = usePractice(session, setGlobalNotificationWrapper); // Pass session and setter
  const upload = useUpload(ROOT_FOLDER_ID, view, uploadMode, session, setGlobalNotificationWrapper); // Pass setter

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      // Redirect to home on logout
      if (event === 'SIGNED_OUT') {
        setView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Set up backend wake detection callback
  useEffect(() => {
    setBackendWakingCallback((isWaking) => {
      setBackendWaking(isWaking);
    });
  }, []);

  // Apply dark mode to body and persist to localStorage
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

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
      setDeleteNotification('✅ Question set deleted successfully.');
      setTimeout(() => setDeleteNotification(''), 3000);
    } catch (error) {
      console.error(error);
      setDeleteNotification('❌ Error deleting set: ' + error.message);
    } finally {
      setDeletingSetId(null);
      setSetToDelete(null);
    }
  }, [loadQuestionSets]);

  const openRenameModal = useCallback((set) => {
    setRenamingSet(set);
    setRenameValue(set.name);
  }, []);

  const saveRename = useCallback(async () => {
    if (!renamingSet || !renameValue.trim()) return;
    
    // START loading state
    setRenamingInProgressId(renamingSet.id); 
    
    try {
      await api.renameSet(renamingSet.id, renameValue.trim());
      await loadQuestionSets();
      setRenamingSet(null);
      // Use global notification
      setGlobalNotificationWrapper('✅ Set renamed successfully.', false);
    } catch (error) {
      // Use global notification
      setGlobalNotificationWrapper('❌ Failed to rename: ' + error.message, true);
    } finally {
      // END loading state
      setRenamingInProgressId(null); 
    }
  }, [renamingSet, renameValue, loadQuestionSets, setGlobalNotificationWrapper]);

  // Loading component (must be defined before early returns)
  const LoadingFallback = useMemo(() => (
    <div style={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '400px',
      color: '#667eea',
      fontSize: '18px'
    }}>
      Loading...
    </div>
  ), []);

  if (loading) return <div className="loading">Loading...</div>;

  // Guest mode: Allow users to access the app without authentication
  // session can be null for guests
  return (
    <div className="App">
      <Navbar view={view} setView={setView} showNavbar={showNavbar} session={session} darkMode={darkMode} setDarkMode={setDarkMode} />

      <ErrorBoundary>
        <Suspense fallback={LoadingFallback}>
        {/* Backend Wake-Up Notification */}
        {backendWaking && (
          <div className="notification-banner wake-notification">
            Waking server up... ready in 30-40 seconds.
          </div>
        )}

        {/* Global Notification Banner for non-practice views */}
        {globalNotification && (
          <div
            ref={notificationRef}
            className={`notification-banner ${globalNotification.isError ? 'error-notification' : ''}`}
          >
            {globalNotification.text}
          </div>
        )}

        {/* HOME VIEW */}
        {view === 'home' && (
          setsLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
              gap: '20px'
            }}>
              <div style={{
                color: '#667eea',
                fontSize: '48px',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}>
                💪
              </div>
              <div style={{
                color: '#667eea',
                fontSize: '18px',
                fontWeight: '600'
              }}>
                Loading your pushups...
              </div>
            </div>
          ) : setsError ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '60vh',
              gap: '20px',
              padding: '20px'
            }}>
              <div style={{ fontSize: '48px' }}>⚠️</div>
              <div style={{
                color: '#dc2626',
                fontSize: '18px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                Failed to connect to server
              </div>
              <div style={{
                color: '#666',
                fontSize: '14px',
                textAlign: 'center',
                maxWidth: '400px'
              }}>
                {setsError}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => loadQuestionSets()}
                style={{ marginTop: '10px' }}
              >
                Retry Connection
              </button>
            </div>
          ) : stats ? (
            <HomeView
              setAppNotification={setGlobalNotificationWrapper}
              stats={stats}
              questionSets={questionSets}
              practice={practice}
              startPracticeWrapper={startPracticeWrapper}
              startMixedPracticeWrapper={startMixedPracticeWrapper}
              mixedFilter={mixedFilter}
              setMixedFilter={setMixedFilter}
              setView={setView}
              session={session}
              backendWaking={backendWaking}
            />
          ) : null
        )}

      {/* STATS VIEW */}
      {view === 'stats' && stats && <StatsView stats={stats} />}

      {/* HELP VIEW */}
      {view === 'help' && <HelpView />}

      {/* AUTH VIEW - Sign in/Sign up */}
      {view === 'auth' && (
        <div style={{
          maxWidth: '500px',
          margin: '80px auto',
          padding: '20px'
        }}>
          <Auth onSuccess={() => setView('home')} />
        </div>
      )}

      {/* SETS VIEW */}
      {view === 'sets' && (
        <SetsView
          questionSets={questionSets}
          practice={practice}
          startPracticeWrapper={startPracticeWrapper}
          backendWaking={backendWaking}
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
          deleteNotification={deleteNotification}
          setToDelete={setToDelete}
          setSetToDelete={setSetToDelete}
          deletingSetId={deletingSetId}
          handleDeleteSet={handleDeleteSet}
          openRenameModal={openRenameModal}
          // NEW PROP
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
      {renamingSet && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setRenamingSet(null)}>
          
          <div style={{
            background: 'white', padding: '25px', borderRadius: '12px', 
            width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            
            <h3 style={{marginTop: 0, color: '#333'}}>Rename Set</h3>
            
            <input 
              type="text" 
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              autoFocus
              style={{
                width: '100%', padding: '10px', margin: '15px 0', 
                borderRadius: '6px', border: '1px solid #ccc', fontSize: '16px'
              }}
            />
            
            <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setRenamingSet(null)}
                disabled={renamingInProgressId} // Disable Cancel during rename
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={saveRename}
                disabled={!renameValue.trim() || renameValue.trim() === renamingSet.name || renamingInProgressId}
              >
                {renamingInProgressId ? 'Renaming...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
      </Suspense>
      </ErrorBoundary>

    </div>
  );
}

export default App; 