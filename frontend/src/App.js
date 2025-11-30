import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import { api } from './api';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); 
  const [questionSets, setQuestionSets] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [practiceMode, setPracticeMode] = useState('single'); 
  const [mixedFilter, setMixedFilter] = useState('all'); 
  const [displayCount, setDisplayCount] = useState(10);
  
  // Upload State
  const [uploadMode, setUploadMode] = useState('local'); // 'local' or 'drive'
  const [uploadTags, setUploadTags] = useState(''); 
  const [customName, setCustomName] = useState(''); 
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  // Tracks if we are currently fetching a practice set
  const [startingPractice, setStartingPractice] = useState(false); 
  
  // Drive State - REPLACE THIS WITH YOUR FOLDER ID
  const ROOT_FOLDER_ID = '1WucWdJWvvRdqwY7y8r-B1VFBo0Bh8L9_'; 
  
  const [driveFiles, setDriveFiles] = useState([]);
  const [drivePath, setDrivePath] = useState([{ id: ROOT_FOLDER_ID, name: 'Root' }]);
  const [currentDriveFolder, setCurrentDriveFolder] = useState(ROOT_FOLDER_ID);
  const [driveSearchTerm, setDriveSearchTerm] = useState('');  
  const [driveLoading, setDriveLoading] = useState(false);
  const [uploadSubView, setUploadSubView] = useState('import'); // 'import' or 'library'
  const [setsFilter, setSetsFilter] = useState('all');
  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploading, setUploading] = useState(false); 
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [deletingSetId, setDeletingSetId] = useState(null);
  const [setToDelete, setSetToDelete] = useState(null); // Tracks which set is asking for confirmation
  const [deleteNotification, setDeleteNotification] = useState(''); // Success message for deletion

  // Reference to the top of the drive browser
  const driveTopRef = useRef(null);  // <--- ADD THIS

useEffect(() => {
    // We check !driveLoading to ensure we only scroll AFTER the new list is rendered
    if (uploadMode === 'drive' && driveTopRef.current && !driveLoading) {
      driveTopRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [driveLoading, uploadMode]);

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

  useEffect(() => {
    if (session) {
      loadQuestionSets();
      loadStats();
    }
  }, [session]);

  // Load Drive files when switching to Drive mode
  useEffect(() => {
    if (view === 'upload' && uploadMode === 'drive' && session) {
      loadDriveFiles(currentDriveFolder);
    }
  }, [view, uploadMode, currentDriveFolder, session]);

  const loadQuestionSets = async () => {
    try {
      const data = await api.getQuestionSets();
      setQuestionSets(data.sets);
    } catch (error) {
      console.error('Error loading question sets:', error);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

const loadDriveFiles = async (folderId) => {
    try {
      setDriveLoading(true); // <--- CHANGE THIS
      const data = await api.listDriveFiles(folderId);
      setDriveFiles(data.files);
    } catch (error) {
      console.error('Error loading Drive files:', error);
      alert('Failed to load Drive files. Check API key and folder ID.');
    } finally {
      setDriveLoading(false); // <--- CHANGE THIS
    }
  };

  const handleDriveFolderClick = (folder) => {
    setDrivePath([...drivePath, folder]);
    setCurrentDriveFolder(folder.id);
    setCustomName('');
  };

  const handleDriveBackClick = () => {
    if (drivePath.length <= 1) return;
    const newPath = [...drivePath];
    newPath.pop();
    setDrivePath(newPath);
    setCurrentDriveFolder(newPath[newPath.length - 1].id);
    setCustomName('');
  };

  const handleDriveRootClick = () => {
    setDrivePath([{ id: ROOT_FOLDER_ID, name: 'Root' }]);
    setCurrentDriveFolder(ROOT_FOLDER_ID);
    setCustomName('');
  };

const handleDriveFileClick = (file) => {
    // Generate auto-name suggestion based on folder path
    setUploadSuccess('');
    const cleanFileName = file.name.replace('.tsv', '');
    let autoName = cleanFileName;
    
    if (drivePath.length > 1) {
        const setterName = drivePath[1].name; // Use 2nd folder (Setter) as prefix
        autoName = `${setterName} - ${cleanFileName}`;
    }
    
    // Pre-fill the name field, but don't upload yet
    setCustomName(autoName);
    // Set pending state to switch UI to "Review" mode
    setPendingUpload({ type: 'drive', data: file });
  };

// This function runs ONLY when user clicks "Confirm Import"
const executeUpload = async () => {
    if (!pendingUpload) return;
    
    try {
      setUploading(true);      // Local loading
      setUploadError('');      // Clear previous errors

      // --- CASE 1: LOCAL FILES ---
      if (pendingUpload.type === 'local') {
        const files = pendingUpload.data;
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          let setName;
          if (customName.trim()) {
            setName = files.length > 1 ? `${customName.trim()} - ${i + 1}` : customName.trim();
          } else {
            setName = file.name.replace('.tsv', '');
          }
          
          // We await here to ensure sequential processing
          await api.uploadTSV(file, setName, '', uploadTags);
        }
      } 
      
      // --- CASE 2: DRIVE FILE ---
      else if (pendingUpload.type === 'drive') {
        const file = pendingUpload.data;
        const finalName = customName.trim() || file.name.replace('.tsv', '');
        await api.importDriveFile(file.id, file.name, uploadTags, finalName);
      }

      // Success! Refresh list and close modal
      await loadQuestionSets();
      setPendingUpload(null);

      // NEW: Set success message
      setUploadSuccess('✅ Import successful! Check the "Your Library" tab.'); // Show success message
      
      setCustomName('');
      setUploadTags('');
      setCustomName('');
      setUploadTags('');

    } catch (error) {
      console.error(error);
      setUploadError(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false); // Stop local loading
    }
  };

const handleLocalFileSelect = (event) => {
    setUploadSuccess('');
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // FIX: Convert live FileList to a static Array so it persists after reset
    const filesArray = Array.from(files);

    // Pre-fill name if single file
    if (filesArray.length === 1) {
      setCustomName(filesArray[0].name.replace('.tsv', ''));
    } else {
      setCustomName('');
    }
    
    setPendingUpload({ type: 'local', data: filesArray });
    
    // Now it's safe to clear the input because we saved a copy
    event.target.value = ''; 
  };

const handleDeleteSet = async (setId) => {
    try {
      setDeletingSetId(setId); // Start loading spinner on button
      await api.deleteQuestionSet(setId);
      await loadQuestionSets();
      setDeleteNotification('✅ Question set deleted successfully.');
      
      // Auto-hide notification after 3 seconds
      setTimeout(() => setDeleteNotification(''), 3000);
    } catch (error) {
      console.error(error);
      setDeleteNotification('❌ Error deleting set: ' + error.message);
    } finally {
      setDeletingSetId(null);
      setSetToDelete(null); // Reset confirmation state
    }
  };

const startPractice = async (set) => {
    try {
      setStartingPractice(true); // <--- Use Local State
      
      await api.markSetOpened(set.id);
      localStorage.setItem('last-set-id', set.id);
      
      const data = await api.getQuestions(set.id);
      setQuestions(data.questions);
      setCurrentSet(set);
      
      const savedPosition = localStorage.getItem(`quiz-position-${set.id}`);
      const startIndex = savedPosition ? parseInt(savedPosition) : 0;
      
      setCurrentQuestionIndex(startIndex);
      setIsFlipped(false);
      setPracticeMode('single');
      setView('practice');
      
      if (savedPosition) alert(`Resuming from question ${startIndex + 1}`);
    } catch (error) {
      alert('Error loading questions: ' + error.message);
    } finally {
      setStartingPractice(false); // <--- Stop Local State
    }
  };

const startMixedPractice = async (filter) => {
    try {
      setStartingPractice(true); // <--- Use Local State
      const data = await api.getMixedQuestions(filter);
      
      if (data.questions.length === 0) {
        alert(`No ${filter} questions found!`);
        return; // Note: finally block will still run
      }
      
      setQuestions(data.questions);
      setCurrentSet({ name: `Random Mode (${filter})`, id: 'mixed' });
      setCurrentQuestionIndex(0);
      setIsFlipped(false);
      setPracticeMode('mixed');
      setView('practice');
    } catch (error) {
      alert('Error loading randomized questions: ' + error.message);
    } finally {
      setStartingPractice(false); // <--- Stop Local State
    }
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleNext = async (markAsCorrect = null) => {
    const currentQuestion = questions[currentQuestionIndex];
    try {
      await api.updateProgress(currentQuestion.id, true, markAsCorrect);
      if (markAsCorrect === false) await api.markMissed(currentQuestion.id);
      if (markAsCorrect === true && currentQuestion.is_missed) await api.unmarkMissed(currentQuestion.id);
    } catch (error) {
      console.error('Error updating progress:', error);
    }

    if (currentQuestionIndex < questions.length - 1) {
      const newIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(newIndex);
      setIsFlipped(false);
      if (currentSet.id !== 'mixed') localStorage.setItem(`quiz-position-${currentSet.id}`, newIndex);
    } else {
      alert('Session complete!');
      if (currentSet.id !== 'mixed') localStorage.removeItem(`quiz-position-${currentSet.id}`);
      setView('home');
      loadQuestionSets();
      loadStats();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      const newIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(newIndex);
      setIsFlipped(false);
      localStorage.setItem(`quiz-position-${currentSet.id}`, newIndex);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!session) return <Auth />;

  return (
    <div className="App">
      <header className="header">
        <div>
          <h1 style={{margin: 0}}>🎯 Pushups</h1>
          <p style={{color: '#666', fontSize: '14px', margin: '5px 0 0 0'}}>
            Slightly too late for all this, no?
          </p>
        </div>
        <div className="user-info">
          <span className="user-email">{session.user.email}</span>
          <button className="btn btn-danger" onClick={() => supabase.auth.signOut()}>Logout</button>
        </div>
      </header>

      <nav className="tab-navigation">
        <button className={`tab-button ${view === 'home' ? 'active' : ''}`} onClick={() => setView('home')}>🏠 Home</button>
        <button className={`tab-button ${view === 'sets' ? 'active' : ''}`} onClick={() => setView('sets')}>📚 Browse Sets</button>
        <button className={`tab-button ${view === 'upload' ? 'active' : ''}`} onClick={() => setView('upload')}>⬆️ Add Sets</button>
        <button className={`tab-button ${view === 'stats' ? 'active' : ''}`} onClick={() => setView('stats')}>📊 Stats</button>
        <button className={`tab-button ${view === 'help' ? 'active' : ''}`} onClick={() => setView('help')}>❓ Help</button>
      </nav>

      {view === 'home' && stats && (
        <div className="home-container">
          <h2 style={{marginBottom: '30px', textAlign: 'center'}}>Ready to Play?</h2>
          <div className="quick-stats-grid">
            <div className="quick-stat-card">
              <div className="quick-stat-value">{stats.total_questions}</div>
              <div className="quick-stat-label">Questions Available</div>
            </div>
            <div className="quick-stat-card">
              <div className="quick-stat-value">{stats.attempted}</div>
              <div className="quick-stat-label">Attempted ({Math.round((stats.attempted / stats.total_questions) * 100) || 0}%)</div>
            </div>
            <div className="quick-stat-card">
              <div className="quick-stat-value">{stats.accuracy}%</div>
              <div className="quick-stat-label">Accuracy</div>
            </div>
          </div>

          <div className="practice-modes">
            <h3 style={{marginBottom: '20px'}}>Choose Mode</h3>
            <div className="practice-mode-grid">
              
              <button 
                className="practice-mode-button" 
                onClick={() => setView('sets')}
                disabled={startingPractice}
                style={{opacity: startingPractice ? 0.7 : 1, cursor: startingPractice ? 'wait' : 'pointer'}}
              >
                <div className="practice-mode-icon">📚</div>
                <div className="practice-mode-content">
                  <h4>Browse Question Sets</h4>
                  <p>Play individual question set ({questionSets.length} sets available)</p>
                </div>
              </button>

              <button 
                className="practice-mode-button"
                onClick={() => {
                  const unplayedSets = questionSets.filter(s => !s.directly_opened);
                  if (unplayedSets.length === 0) {
                    alert('No unplayed sets available! You\'ve started all sets.');
                    return;
                  }
                  const randomSet = unplayedSets[Math.floor(Math.random() * unplayedSets.length)];
                  startPractice(randomSet);
                }}
                disabled={startingPractice || questionSets.filter(s => !s.directly_opened).length === 0}
                style={{opacity: startingPractice ? 0.7 : 1, cursor: startingPractice ? 'wait' : 'pointer'}}
              >
                <div className="practice-mode-icon">🎰</div>
                <div className="practice-mode-content">
                  <h4>Random Unplayed Set</h4>
                  <p>Jump into a set you haven't started</p>
                </div>
              </button>

              <button 
                className="practice-mode-button" 
                onClick={() => { setMixedFilter('all'); startMixedPractice('all'); }}
                disabled={startingPractice}
                style={{opacity: startingPractice ? 0.7 : 1, cursor: startingPractice ? 'wait' : 'pointer'}}
              >
                <div className="practice-mode-icon">
                    {startingPractice && mixedFilter === 'all' ? '⏳' : '🎲'}
                </div>
                <div className="practice-mode-content">
                  <h4>Random Mode - All Questions</h4>
                  <p>Randomized questions from across sets</p>
                </div>
              </button>

              <button 
                className="practice-mode-button" 
                onClick={() => { setMixedFilter('unattempted'); startMixedPractice('unattempted'); }}
                disabled={startingPractice}
                style={{opacity: startingPractice ? 0.7 : 1, cursor: startingPractice ? 'wait' : 'pointer'}}
              >
                <div className="practice-mode-icon">
                  {startingPractice && mixedFilter === 'unattempted' ? '⏳' : '🆕'}
                </div>
                <div className="practice-mode-content">
                  <h4>Random Mode - Unattempted</h4>
                  <p>Only questions you haven't seen yet</p>
                </div>
              </button>

              <button 
                className="practice-mode-button" 
                onClick={() => { setMixedFilter('missed'); startMixedPractice('missed'); }} 
                disabled={startingPractice || stats.missed === 0}
                style={{opacity: startingPractice ? 0.7 : 1, cursor: startingPractice ? 'wait' : 'pointer'}}
              >
                <div className="practice-mode-icon">
                  {startingPractice && mixedFilter === 'missed' ? '⏳' : '❌'}
                </div>
                <div className="practice-mode-content">
                  <h4>Retry Missed Questions</h4>
                  <p>Review what you got wrong ({stats.missed} questions)</p>
                </div>
              </button>

              <button 
                className="practice-mode-button" 
                onClick={() => {
                  const lastSetId = localStorage.getItem('last-set-id');
                  if (!lastSetId) { alert('No recent set found.'); return; }
                  const lastSet = questionSets.find(s => s.id === parseInt(lastSetId));
                  if (!lastSet) { alert('Last practiced set not found.'); localStorage.removeItem('last-set-id'); return; }
                  startPractice(lastSet);
                }} 
                disabled={startingPractice || !localStorage.getItem('last-set-id')}
                style={{opacity: startingPractice ? 0.7 : 1, cursor: startingPractice ? 'wait' : 'pointer'}}
              >
                <div className="practice-mode-icon">🔄</div>
                <div className="practice-mode-content">
                  <h4>Continue Last Set</h4>
                  <p>Resume your most recent set</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'stats' && stats && (
        <div className="stats-container">
          <h2>Your Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-value">{stats.total_questions}</div><div className="stat-label">Total Questions</div></div>
            <div className="stat-card"><div className="stat-value">{stats.attempted}</div><div className="stat-label">Attempted</div></div>
            <div className="stat-card"><div className="stat-value">{stats.correct}</div><div className="stat-label">Correct</div></div>
            <div className="stat-card"><div className="stat-value">{stats.accuracy}%</div><div className="stat-label">Accuracy</div></div>
            <div className="stat-card"><div className="stat-value">{stats.missed}</div><div className="stat-label">Missed</div></div>
          </div>
        </div>
      )}

      {/* HELP VIEW RESTORED HERE */}
      {view === 'help' && (
        <div className="container">
          <h2>How to Use Pushups</h2>
          
          <div style={{marginTop: '30px'}}>
            <h3 style={{color: '#667eea', marginBottom: '15px'}}>📚 Getting Started</h3>
            <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
              <li><strong>Upload Sets:</strong> Go to Upload tab and add TSV files in Mimir format</li>
              <li><strong>Browse Sets:</strong> View all available question sets from you and others</li>
              <li><strong>Practice Modes:</strong> Choose from individual sets or randomized questions</li>
            </ul>
          </div>

          <div style={{marginTop: '30px'}}>
            <h3 style={{color: '#667eea', marginBottom: '15px'}}>🎯 User Tips</h3>
            <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
              <li><strong>Flashcard Mode:</strong> Click anywhere on the card to flip between question and answer</li>
              <li><strong>Self-Assessment:</strong> Mark yourself "Got it right" or "Missed it" for tracking</li>
              <li><strong>Resume Later:</strong> Your progress is saved - you can come back anytime</li>
              <li><strong>Missed Questions:</strong> Questions marked as missed are added to review mode</li>
            </ul>
          </div>

          <div style={{marginTop: '30px'}}>
            <h3 style={{color: '#667eea', marginBottom: '15px'}}>🔍 Search & Filter</h3>
            <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
              <li>Search sets by name or tags in the Browse Sets tab</li>
              <li>Use Random Mode filters: All, Unattempted, or Missed questions only</li>
            </ul>
          </div>

          <div style={{marginTop: '30px'}}>
            <h3 style={{color: '#667eea', marginBottom: '15px'}}>📊 Tracking Progress</h3>
            <ul style={{lineHeight: '1.8', color: '#666', marginLeft: '20px'}}>
              <li>View your stats anytime in the Stats tab</li>
              <li>Each set shows a progress bar for questions attempted</li>
              <li>Accuracy percentage updates as you play more</li>
            </ul>
          </div>

          <div style={{marginTop: '30px', padding: '20px', background: '#f9fafb', borderRadius: '8px'}}>
            <h3 style={{color: '#667eea', marginBottom: '10px'}}>💡 Pro Tip</h3>
            <p style={{color: '#666', lineHeight: '1.6', margin: 0}}>
              Tag your uploaded sets with categories (like "Art", "History", "Films") if applicable to easily filter and find them later. 
              All users can see all sets uploaded.
            </p>
          </div>
        </div>
      )}

      {view === 'sets' && (
        <div className="container">
          <h2>Question Sets</h2>
          <div style={{display: 'flex', gap: '10px', margin: '20px 0', flexWrap: 'wrap'}}>
            {['all', 'completed', 'in-progress', 'unattempted'].map(filter => (
              <button 
                key={filter}
                className={`btn ${setsFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setSetsFilter(filter); setDisplayCount(10); }}
                style={{textTransform: 'capitalize'}}
              >
                {filter.replace('-', ' ')}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search by name or tag..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setDisplayCount(10); }}
            style={{width: '100%', padding: '12px', marginBottom: '20px', border: '2px solid #e5e7eb', borderRadius: '8px'}}
          />
          {(() => {
            let sets = questionSets;
            if (setsFilter === 'completed') sets = sets.filter(s => s.questions_attempted === s.total_questions && s.total_questions > 0);
            else if (setsFilter === 'in-progress') sets = sets.filter(s => s.questions_attempted > 0 && s.questions_attempted < s.total_questions);
            else if (setsFilter === 'unattempted') sets = sets.filter(s => !s.questions_attempted);
            
            const filtered = sets.filter(set => 
              set.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              (set.tags && set.tags.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            const displayed = filtered.slice(0, displayCount);
            
            if (filtered.length === 0) return <div className="empty-state"><p>No sets found.</p></div>;
            
            return (
              <>
                <div className="set-list">
                  {displayed.map(set => (
                    <div 
                          key={set.id} 
                          className="set-card" 
                          onClick={() => !startingPractice && startPractice(set)} // Prevent double-click
                          style={{
                            cursor: startingPractice ? 'wait' : 'pointer', 
                            opacity: startingPractice ? 0.7 : 1,
                            position: 'relative' // Needed for the spinner overlay
                          }}
                        >
                          {/* OPTIONAL: Add a simple overlay spinner if this specific set is loading */}
                          {startingPractice && currentSet?.id === set.id && (
                            <div style={{position: 'absolute', top: '10px', right: '10px'}}>⏳</div>
                          )}
                      <h3>{set.name}</h3>
                      <div className="set-info">
                        <span>📝 {set.total_questions}</span>
                        <span>✅ {set.questions_attempted || 0}</span>
                        <span>👤 {set.uploaded_by_username}</span>
                        {set.tags && <span>🏷️ {set.tags}</span>}
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: `${((set.questions_attempted || 0) / set.total_questions) * 100}%`}} />
                      </div>
                    </div>
                  ))}
                </div>
                {filtered.length > displayCount && (
                  <div style={{textAlign: 'center', marginTop: '20px'}}>
                    <button className="btn btn-primary" onClick={() => setDisplayCount(prev => prev + 10)}>Load More</button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

{view === 'upload' && (
        <div className="container">
          <h2>Manage Questions</h2>
          
          {/* Sub-Navigation Tabs */}
          <div style={{display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px'}}>
            <button 
              style={{
                padding: '10px 20px', 
                border: 'none', 
                background: 'none', 
                borderBottom: uploadSubView === 'import' ? '2px solid #667eea' : 'none',
                color: uploadSubView === 'import' ? '#667eea' : '#666',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => setUploadSubView('import')}
            >
              📥 Import New
            </button>
            <button 
              style={{
                padding: '10px 20px', 
                border: 'none', 
                background: 'none', 
                borderBottom: uploadSubView === 'library' ? '2px solid #667eea' : 'none',
                color: uploadSubView === 'library' ? '#667eea' : '#666',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => setUploadSubView('library')}
            >
              📚 Your Library
            </button>
          </div>

          {/* --- IMPORT VIEW --- */}
{/* --- IMPORT VIEW --- */}
          {uploadSubView === 'import' && (
            <>
              {/* CONDITIONAL: If we have a file pending, show Review UI. Else show Browsers. */}
              {pendingUpload ? (
                <div style={{background: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', maxWidth: '600px', margin: '0 auto'}}>
                  <h3 style={{marginTop: 0, color: '#333'}}>📝 Review & Import</h3>
                  
                  {/* NEW: Error Message Display */}
                  {uploadError && (
                    <div style={{padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '15px', fontSize: '14px'}}>
                      ⚠️ {uploadError}
                    </div>
                  )}
                  
                  <div style={{marginBottom: '20px', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb'}}>
                    <span style={{fontWeight: 'bold', color: '#555'}}>Selected: </span>
                    {pendingUpload.type === 'local' 
                      ? `${pendingUpload.data.length} file(s) from Device` 
                      : `📄 ${pendingUpload.data.name} (from Drive)`}
                  </div>

                  <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Set Name</label>
                    <input 
                      type="text" 
                      value={customName} 
                      onChange={(e) => setCustomName(e.target.value)} 
                      placeholder="e.g. My Quiz Set"
                      disabled={uploading} // Disable input while uploading
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
                    />
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Tags</label>
                    <input 
                      type="text" 
                      value={uploadTags} 
                      onChange={(e) => setUploadTags(e.target.value)} 
                      placeholder="e.g. History, Science"
                      disabled={uploading} // Disable input while uploading
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
                    />
                  </div>

                  <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={uploading}
                      onClick={() => {
                        setPendingUpload(null);
                        setCustomName('');
                        setUploadTags('');
                        setUploadError('');
                      }}
                    >
                      Cancel
                    </button>
                    
                    <button 
                      className="btn btn-primary" 
                      onClick={executeUpload}
                      disabled={uploading}
                      style={{minWidth: '120px'}}
                    >
                      {uploading ? 'Processing...' : 'Confirm Import'}
                    </button>
                  </div>
                </div>
              ) : (
                /* --- BROWSER UI (Only shown if nothing pending) --- */
                <>

                {uploadSuccess && (
                    <div style={{
                      marginBottom: '20px', 
                      padding: '12px 15px', 
                      background: '#ecfdf5', 
                      border: '1px solid #a7f3d0', 
                      color: '#065f46', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}>
                      <span>{uploadSuccess}</span>
                      <button 
                        onClick={() => setUploadSuccess('')} 
                        style={{background:'none', border:'none', color:'#065f46', cursor:'pointer', fontSize:'18px', padding:'0 5px'}}
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
                    <button className={`btn ${uploadMode === 'local' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('local')}>
                      📁 From Your Device
                    </button>
                    <button className={`btn ${uploadMode === 'drive' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('drive')}>
                      ☁️ From B612 Friendlies Drive
                    </button>
                  </div>

                  {uploadMode === 'local' ? (
                    <div className="upload-section">
                      <input type="file" id="file-upload" accept=".tsv" multiple onChange={handleLocalFileSelect} />
                      <label htmlFor="file-upload" className="upload-label">Select TSV File(s) to upload</label>
                    </div>
                  ) : (
                    <div className="drive-browser" ref={driveTopRef}>
                      {/* ... (Keep your existing Drive Browser JSX inside here) ... */}
                      {/* NOTE: Ensure you keep the Back/Root/Search/List logic exactly as it was */}
                      <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '10px', flexWrap: 'wrap'}}>
                        <button className="btn btn-secondary" onClick={handleDriveRootClick} disabled={drivePath.length <= 1 || driveLoading}>🏠 Root</button>
                        <button className="btn btn-secondary" onClick={handleDriveBackClick} disabled={drivePath.length <= 1 || driveLoading}>⬅ Back</button>
                        <div style={{fontSize: '14px', color: '#666'}}>
                          {drivePath.map(p => p.name).join(' > ')}
                        </div>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Search current folder..."
                        value={driveSearchTerm}
                        onChange={(e) => setDriveSearchTerm(e.target.value)}
                        style={{width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                      />
                      
                      <div className="set-list" style={{minHeight: '200px', position: 'relative'}}>
                        {driveLoading ? (
                           <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#667eea', fontWeight: 'bold'}}>Loading folder...</div>
                        ) : (
                          <>
                            {driveFiles
                              .filter(file => file.name.toLowerCase().includes(driveSearchTerm.toLowerCase()))
                              .map(file => (
                              <div 
                                key={file.id} 
                                className="set-card" 
                                onClick={() => {
                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        setDriveSearchTerm('');
                                        handleDriveFolderClick(file);
                                    } else {
                                        handleDriveFileClick(file);
                                    }
                                }}
                                style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}
                              >
                                <div style={{fontSize: '24px'}}>
                                  {file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄'}
                                </div>
                                <div>
                                  <h4 style={{margin: 0}}>{file.name}</h4>
                                </div>
                              </div>
                            ))}
                            {driveFiles.length === 0 && <p style={{color: '#999', textAlign: 'center', marginTop: '20px'}}>No files found.</p>}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* --- LIBRARY VIEW --- */}
          {uploadSubView === 'library' && (
            <div style={{marginTop: '20px'}}>
              <h3>Your Uploaded Sets</h3>
              
              {/* DELETE NOTIFICATION BANNER */}
              {deleteNotification && (
                <div style={{
                  marginBottom: '15px', padding: '10px', borderRadius: '6px', fontSize: '14px',
                  background: deleteNotification.includes('Error') ? '#fee2e2' : '#ecfdf5',
                  color: deleteNotification.includes('Error') ? '#dc2626' : '#065f46',
                  border: `1px solid ${deleteNotification.includes('Error') ? '#fca5a5' : '#a7f3d0'}`
                }}>
                  {deleteNotification}
                </div>
              )}

              <p style={{color: '#666', marginBottom: '20px'}}>Manage the sets you have imported or uploaded.</p>
              
              {(() => {
                const myUploadedSets = questionSets.filter(set => set.uploaded_by_username === session.user.email.split('@')[0]);
                
                if (myUploadedSets.length === 0) return <div className="empty-state"><p>You haven't uploaded any sets yet.</p></div>;
                
                return (
                  <div className="set-list">
                    {myUploadedSets.map((set) => (
                      <div key={set.id} className="set-card">
                        {/* Added flexWrap: 'wrap' to handle small screens */}
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', flexWrap: 'wrap'}}>
                          {/* Added minWidth to force wrapping if text is too long */}
                          <h3 style={{margin: 0, wordBreak: 'break-word', lineHeight: '1.4', flex: '1 1 200px'}}>{set.name}</h3>
                          
                          {/* TWO-STEP DELETE BUTTON */}
                          <div style={{display: 'flex', gap: '5px', flexShrink: 0, marginLeft: 'auto'}}>
                            {setToDelete === set.id ? (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                                  disabled={deletingSetId === set.id}
                                  className="btn btn-danger"
                                  style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
                                >
                                  {deletingSetId === set.id ? 'Deleting...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSetToDelete(null); }}
                                  className="btn btn-secondary"
                                  style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSetToDelete(set.id); }}
                                className="btn btn-danger"
                                style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </div>
                        </div>
                        
                        <div className="set-info">
                          <span>📝 {set.total_questions} questions</span>
                          <span>✅ {set.questions_attempted || 0} attempted</span>
                          {set.tags && <span>🏷️ {set.tags}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {view === 'practice' && questions.length > 0 && (
        <div className="flashcard-container">
          <div className="flashcard-header" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>  
            {/* Top Row: Navigation Buttons */}
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <button className="btn btn-secondary" onClick={() => setView('sets')}>← Back</button>
              
              {practiceMode === 'single' && (
                <button 
                  className="btn btn-primary" 
                  disabled={startingPractice} // <--- Disable button while loading
                  onClick={() => {
                    const unplayed = questionSets.filter(s => s.id !== currentSet.id && !s.directly_opened);
                    if (unplayed.length === 0) return alert('No other unplayed sets!');
                    startPractice(unplayed[Math.floor(Math.random() * unplayed.length)]);
                  }}
                >
                  {/* Show Loading text if busy, otherwise show original text */}
                  {startingPractice ? 'Loading...' : '🎲 Play another random set'}
                </button>
              )}
            </div>

            {/* Bottom Row: Title & Progress (Centered) */}
            <div style={{textAlign: 'center', width: '100%'}}>
              <div style={{fontWeight: 'bold', color: '#333', fontSize: '18px', marginBottom: '5px', wordBreak: 'break-word'}}>
                {currentSet.name}
              </div>
              <div className="flashcard-progress" style={{color: '#666', fontWeight: '600'}}>
                Question {currentQuestionIndex + 1} / {questions.length}
              </div>
            </div>

          </div>

          <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
            <div className="round-info">{practiceMode === 'mixed' ? questions[currentQuestionIndex].set_name : `${questions[currentQuestionIndex].round_no} - ${questions[currentQuestionIndex].question_no}`}</div>
            {!isFlipped ? (
              <>
                <div className="question-text" dangerouslySetInnerHTML={{ __html: questions[currentQuestionIndex].question_text }} />
                {questions[currentQuestionIndex].image_url && <img src={questions[currentQuestionIndex].image_url} alt="Q" className="question-image" />}
                <div className="flip-hint">Click to reveal</div>
              </>
            ) : (
              <>
                <div className="answer-text" dangerouslySetInnerHTML={{ __html: questions[currentQuestionIndex].answer_text }} />
                <div className="flip-hint">Click to question</div>
              </>
            )}
          </div>

          <div className="flashcard-controls">
            {!isFlipped ? (
              <>
                <button className="btn btn-secondary" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>← Prev</button>
                <button className="btn btn-primary" onClick={handleFlip}>Show Answer</button>
                <button className="btn btn-secondary" onClick={() => handleNext(null)}>Skip →</button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>← Prev</button>
                <button className="btn btn-success" onClick={() => handleNext(true)}>✓ Right</button>
                <button className="btn btn-warning" onClick={() => handleNext(false)}>✗ Wrong</button>
                <button className="btn btn-secondary" onClick={() => handleNext(null)}>Skip →</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Auth() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const email = `${username.toLowerCase().trim()}@quiz.local`;
    try {
      const { error } = isSignUp 
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (isSignUp) alert('Account created! Sign in now.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleAuth}>
        <div className="form-group">
          <label>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? '...' : isSignUp ? 'Sign Up' : 'Sign In'}</button>
      </form>
      <div className="auth-toggle">
        <button onClick={() => setIsSignUp(!isSignUp)}>{isSignUp ? 'Switch to Sign In' : 'Switch to Sign Up'}</button>
      </div>
    </div>
  );
}

export default App;