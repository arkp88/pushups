import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { api } from './api';
import Auth from './components/Auth';
import { useStats } from './hooks/useStats';
import { useQuestionSets } from './hooks/useQuestionSets';
import { usePractice } from './hooks/usePractice';
import { useUpload } from './hooks/useUpload';
import HomeView from './views/HomeView';
import SetsView from './views/SetsView';
import UploadView from './views/UploadView';
import PracticeView from './views/PracticeView';
import StatsView from './views/StatsView';
import HelpView from './views/HelpView';
import './App.css';

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
  
  // Drive folder ID from environment
  const ROOT_FOLDER_ID = process.env.REACT_APP_GOOGLE_DRIVE_FOLDER_ID || '1WucWdJWvvRdqwY7y8r-B1VFBo0Bh8L9_';
  
  // Custom hooks
  const { stats, loadStats } = useStats(session);
  const { questionSets, loadQuestionSets } = useQuestionSets(session);
  const practice = usePractice();
  const upload = useUpload(ROOT_FOLDER_ID, view, uploadMode, session);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

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

  // Wrapper functions that call hook methods and handle view transitions
  const startPracticeWrapper = async (set) => {
    const success = await practice.startPractice(set);
    if (success) {
      setView('practice');
    }
  };

  const startMixedPracticeWrapper = async (filter) => {
    const success = await practice.startMixedPractice(filter);
    if (success) {
      setView('practice');
    }
  };

  const handleNextWrapper = async (markAsCorrect = null) => {
    await practice.handleNext(markAsCorrect, () => {
      setView('home');
      loadQuestionSets();
      loadStats();
    });
  };

  const handleBookmarkWrapper = async (e) => {
    await practice.handleBookmark(e);
    loadStats();
  };

  const handleDeleteSet = async (setId) => {
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
  };

  const openRenameModal = (set) => {
    setRenamingSet(set);
    setRenameValue(set.name);
  };

  const saveRename = async () => {
    if (!renamingSet || !renameValue.trim()) return;
    try {
      await api.renameSet(renamingSet.id, renameValue.trim());
      await loadQuestionSets();
      setRenamingSet(null);
    } catch (error) {
      alert('Failed to rename: ' + error.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!session) return <Auth />;

  return (
    <div className="App">
      {/* Mobile-only top header */}
      <div className={`mobile-header ${showNavbar ? '' : 'hidden'}`}>
        <div className="mobile-header-brand">
          <span className="brand-icon">💪</span>
          <h1>Pushups</h1>
        </div>
        <div className="mobile-header-user">
          <span className="username">{session.user.email.split('@')[0]}</span>
          <button className="btn-logout-mobile" onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
        </div>
      </div>

      <nav className={`navbar ${showNavbar ? '' : 'hidden'}`}>
        {/* Logo & Quote */}
        <div className="nav-brand">
          <div className="brand-row">
            <span className="brand-icon">💪</span>
            <h1>Pushups</h1>
          </div>
          <span className="brand-quote"> Tired of being productive? </span>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-links">
          <button data-icon="🏠" onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>
            Home
          </button>
          <button data-icon="📚" onClick={() => setView('sets')} className={`nav-btn ${view === 'sets' ? 'active' : ''}`}>
            Sets
          </button>
          <button data-icon="📥" onClick={() => setView('upload')} className={`nav-btn ${view === 'upload' ? 'active' : ''}`}>
            Upload
          </button>
          <button data-icon="📊" onClick={() => setView('stats')} className={`nav-btn ${view === 'stats' ? 'active' : ''}`}>
            Stats
          </button>
          <button data-icon="❓" onClick={() => setView('help')} className={`nav-btn ${view === 'help' ? 'active' : ''}`}>
            Help
          </button>
        </div>

        {/* User & Logout */}
        <div className="nav-user">
          <span>{session.user.email.split('@')[0]}</span>
          <button className="btn-logout" onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
        </div>
      </nav>

      {/* HOME VIEW */}
      {view === 'home' && stats && (
        <HomeView 
          stats={stats}
          questionSets={questionSets}
          practice={practice}
          startPracticeWrapper={startPracticeWrapper}
          startMixedPracticeWrapper={startMixedPracticeWrapper}
          mixedFilter={mixedFilter}
          setMixedFilter={setMixedFilter}
          setView={setView}
        />
      )}

      {/* STATS VIEW */}
      {view === 'stats' && stats && <StatsView stats={stats} />}

      {/* HELP VIEW */}
      {view === 'help' && <HelpView />}

      {/* SETS VIEW */}
      {view === 'sets' && (
        <SetsView 
          questionSets={questionSets}
          practice={practice}
          startPracticeWrapper={startPracticeWrapper}
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
        />
      )}

      {/* PRACTICE VIEW */}
      {view === 'practice' && practice.questions.length > 0 && (
        <PracticeView 
          practice={practice}
          questionSets={questionSets}
          startPracticeWrapper={startPracticeWrapper}
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
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={saveRename}
                disabled={!renameValue.trim() || renameValue.trim() === renamingSet.name}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
