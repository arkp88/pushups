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
  const [searchTerm, setSearchTerm] = useState('');
  const [mixedFilter, setMixedFilter] = useState('all');
  const [displayCount, setDisplayCount] = useState(10);
  const [uploadMode, setUploadMode] = useState('local');
  const [setsFilter, setSetsFilter] = useState('all');
  const [deletingSetId, setDeletingSetId] = useState(null);
  const [setToDelete, setSetToDelete] = useState(null);
  const [deleteNotification, setDeleteNotification] = useState('');
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

// --- SCROLL LOGIC FOR HEADER ---
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // If scrolling DOWN and past 50px, hide. If scrolling UP, show.
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
    loadStats(); // Reload stats to update the count on home screen
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!session) return <Auth />;

  return (
    <div className="App">
<nav className={`navbar ${showNavbar ? '' : 'hidden'}`}>
        {/* 1. Logo & Quote */}
        <div className="nav-brand">
          <div className="brand-row">
            <span className="brand-icon">💪</span>
            <h1>Pushups</h1>
          </div>
          <span className="brand-quote"> Tired of being productive? </span>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="nav-links">
          <button onClick={() => setView('home')} className={`nav-btn ${view === 'home' ? 'active' : ''}`}>
            Home
          </button>
          <button onClick={() => setView('sets')} className={`nav-btn ${view === 'sets' ? 'active' : ''}`}>
            Sets
          </button>
          <button onClick={() => setView('upload')} className={`nav-btn ${view === 'upload' ? 'active' : ''}`}>
            Upload
          </button>
          <button onClick={() => setView('stats')} className={`nav-btn ${view === 'stats' ? 'active' : ''}`}>
            Stats
          </button>
          <button onClick={() => setView('help')} className={`nav-btn ${view === 'help' ? 'active' : ''}`}>
            Help
          </button>
        </div>

        {/* 3. User & Logout */}
        <div className="nav-user">
          <span>{session.user.email.split('@')[0]}</span>
          <button className="btn-logout" onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
        </div>
      </nav>

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

      {view === 'stats' && stats && <StatsView stats={stats} />}

      {view === 'help' && <HelpView />}

      {view === 'sets' && (
        <SetsView 
          questionSets={questionSets}
          practice={practice}
          startPracticeWrapper={startPracticeWrapper}
        />
      )}

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

      {renamingSet && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }} onClick={() => setRenamingSet(null)}>
          
          <div style={{
            background: 'white', padding: '25px', borderRadius: '12px', 
            width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}>OLD_UPLOAD_START
                cursor: 'pointer'
              }}
              onClick={() => upload.setUploadSubView('import')}
            >
              📥 Import New
            </button>
            <button 
              style={{
                padding: '10px 20px', 
                border: 'none', 
                background: 'none', 
                borderBottom: upload.uploadSubView === 'library' ? '2px solid #667eea' : 'none',
                color: upload.uploadSubView === 'library' ? '#667eea' : '#666',
                fontWeight: '600',
                cursor: 'pointer'
              }}
              onClick={() => upload.setUploadSubView('library')}
            >
              📚 Your Library
            </button>
          </div>

          {/* --- IMPORT VIEW --- */}
{/* --- IMPORT VIEW --- */}
          {upload.uploadSubView === 'import' && (
            <>
              {/* CONDITIONAL: If we have a file pending, show Review UI. Else show Browsers. */}
              {upload.pendingUpload ? (
                <div style={{background: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', maxWidth: '600px', margin: '0 auto'}}>
                  <h3 style={{marginTop: 0, color: '#333'}}>📝 Review & Import</h3>
                  
                  {/* NEW: Error Message Display */}
                  {upload.uploadError && (
                    <div style={{padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '15px', fontSize: '14px'}}>
                      ⚠️ {upload.uploadError}
                    </div>
                  )}
                  
                  <div style={{marginBottom: '20px', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb'}}>
                    <span style={{fontWeight: 'bold', color: '#555'}}>Selected: </span>
                    {upload.pendingUpload.type === 'local' 
                      ? `${upload.pendingUpload.data.length} file(s) from Device` 
                      : `📄 ${upload.pendingUpload.data.name} (from Drive)`}
                  </div>

                  <div style={{marginBottom: '15px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Set Name</label>
                    <input 
                      type="text" 
                      value={upload.customName} 
                      onChange={(e) => upload.setCustomName(e.target.value)} 
                      placeholder="e.g. My Quiz Set"
                      disabled={upload.uploading} // Disable input while uploading
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
                    />
                  </div>

                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Tags</label>
                    <input 
                      type="text" 
                      value={upload.uploadTags} 
                      onChange={(e) => upload.setUploadTags(e.target.value)} 
                      placeholder="e.g. History, Science"
                      disabled={upload.uploading} // Disable input while uploading
                      style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
                    />
                  </div>

                  <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={upload.uploading}
                      onClick={() => {
                        upload.setPendingUpload(null);
                        upload.setCustomName('');
                        upload.setUploadTags('');
                      }}
                    >
                      Cancel
                    </button>
                    
                    <button 
                      className="btn btn-primary" 
                      onClick={() => upload.executeUpload(loadQuestionSets)}
                      disabled={upload.uploading}
                      style={{minWidth: '120px'}}
                    >
                      {upload.uploading ? 'Processing...' : 'Confirm Import'}
                    </button>
                  </div>
                </div>
              ) : (
                /* --- BROWSER UI (Only shown if nothing pending) --- */
                <>

                {upload.uploadSuccess && (
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
                      <span>{upload.uploadSuccess}</span>
                      <button 
                        onClick={() => upload.setUploadSuccess('')} 
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
                      <input type="file" id="file-upload" accept=".tsv" multiple onChange={upload.handleLocalFileSelect} />
                      <label htmlFor="file-upload" className="upload-label">Select TSV File(s) to upload</label>
                    </div>
                  ) : (
                    <div className="drive-browser" ref={upload.driveTopRef}>
                      {/* ... (Keep your existing Drive Browser JSX inside here) ... */}
                      {/* NOTE: Ensure you keep the Back/Root/Search/List logic exactly as it was */}
                      <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '10px', flexWrap: 'wrap'}}>
                        <button className="btn btn-secondary" onClick={upload.handleDriveRootClick} disabled={upload.drivePath.length <= 1 || upload.driveLoading}>🏠 Root</button>
                        <button className="btn btn-secondary" onClick={upload.handleDriveBackClick} disabled={upload.drivePath.length <= 1 || upload.driveLoading}>⬅ Back</button>
                        <div style={{fontSize: '14px', color: '#666'}}>
                          {upload.drivePath.map(p => p.name).join(' > ')}
                        </div>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Search current folder..."
                        value={upload.driveSearchTerm}
                        onChange={(e) => upload.setDriveSearchTerm(e.target.value)}
                        style={{width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                      />
                      
                      <div className="set-list" style={{minHeight: '200px', position: 'relative'}}>
                        {upload.driveLoading ? (
                           <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#667eea', fontWeight: 'bold'}}>Loading folder...</div>
                        ) : (
                          <>
                            {upload.driveFiles
                              .filter(file => file.name.toLowerCase().includes(upload.driveSearchTerm.toLowerCase()))
                              .map(file => (
                              <div 
                                key={file.id} 
                                className="set-card" 
                                onClick={() => {
                                    if (file.mimeType === 'application/vnd.google-apps.folder') {
                                        upload.setDriveSearchTerm('');
                                        upload.handleDriveFolderClick(file);
                                    } else {
                                        upload.handleDriveFileClick(file);
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
                            {upload.driveFiles.length === 0 && <p style={{color: '#999', textAlign: 'center', marginTop: '20px'}}>No files found.</p>}
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
          {upload.uploadSubView === 'library' && (
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
                            {/* RENAME BUTTON */}
                            {setToDelete !== set.id && (
                              <button
                                onClick={(e) => { e.stopPropagation(); openRenameModal(set); }}
                                className="btn btn-secondary"
                                style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
                                title="Rename Set"
                              >
                                ✏️
                              </button>
                            )}
                            
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

      {view === 'practice' && practice.questions.length > 0 && (
        <div className="flashcard-container">
          
          {/* 1. NEW: Notification Banner */}
          {practice.practiceNotification && (
            <div className="notification-banner">
              ℹ️ {practice.practiceNotification}
            </div>
          )}

          <div className="flashcard-header" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
              <button className="btn btn-secondary" onClick={() => setView('sets')}>← Back</button>
              
              {practice.practiceMode === 'single' && (
                <button 
                  className="btn btn-primary" 
                  disabled={practice.startingPractice}
                  onClick={() => {
                    const unplayed = questionSets.filter(s => s.id !== practice.currentSet.id && !s.directly_opened);
                    if (unplayed.length === 0) return alert('No other unplayed sets!');
                    startPracticeWrapper(unplayed[Math.floor(Math.random() * unplayed.length)]);
                  }}
                >
                  {practice.startingPractice ? 'Loading...' : '🎲 Next Random'}
                </button>
              )}
            </div>

            <div style={{textAlign: 'center', width: '100%'}}>
              <div style={{fontWeight: 'bold', color: '#333', fontSize: '18px', marginBottom: '5px', wordBreak: 'break-word'}}>
                {practice.currentSet.name}
              </div>
              <div className="flashcard-progress" style={{color: '#666', fontWeight: '600'}}>
                Question {practice.currentQuestionIndex + 1} / {practice.questions.length}
              </div>
            </div>
          </div>

          <div className={`flashcard ${practice.isFlipped ? 'flipped' : ''}`} onClick={practice.handleFlip}>
            
            {/* UPDATED: Bookmark Icon */}
            <div 
              onClick={handleBookmarkWrapper}
              style={{
                position: 'absolute', 
                top: '12px',              /* Moved down slightly to avoid border curve */
                right: '12px',            /* Moved left slightly */
                fontSize: '32px',
                cursor: 'pointer',
                zIndex: 10,
                /* Visual Logic: 
                   - Active: Gold
                   - Inactive (Front): Darker Gray (Better contrast on white)
                   - Inactive (Back): Bright White (Better contrast on purple) 
                */
                color: practice.questions[practice.currentQuestionIndex].is_bookmarked 
                  ? '#fbbf24' 
                  : (practice.isFlipped ? 'rgba(255,255,255,0.9)' : '#6b7280'),
                
                /* Shadow makes it pop against any background */
                filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
                transition: 'all 0.2s ease'
              }}
              title="Toggle Bookmark"
            >
              {practice.questions[practice.currentQuestionIndex].is_bookmarked ? '★' : '☆'}
            </div>

            <div className="round-info">{practice.practiceMode === 'mixed' ? practice.questions[practice.currentQuestionIndex].set_name : `${practice.questions[practice.currentQuestionIndex].round_no} - ${practice.questions[practice.currentQuestionIndex].question_no}`}</div>
            {!practice.isFlipped ? (
              <>
                <div className="question-text" dangerouslySetInnerHTML={{ __html: practice.questions[practice.currentQuestionIndex].question_text }} />
                
                {/* 2. UPDATED: Image with click-to-expand */}
                {practice.questions[practice.currentQuestionIndex].image_url && (
                  <img 
                    src={practice.questions[practice.currentQuestionIndex].image_url} 
                    alt="Q" 
                    className="question-image"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card flip
                      practice.setEnlargedImage(practice.questions[practice.currentQuestionIndex].image_url);
                    }}
                  />
                )}
                
                <div className="flip-hint">Click to reveal</div>
              </>
            ) : (
              <>
                <div className="answer-text" dangerouslySetInnerHTML={{ __html: practice.questions[practice.currentQuestionIndex].answer_text }} />
                <div className="flip-hint">Click to question</div>
              </>
            )}
          </div>

<div className="flashcard-controls">
            {!practice.isFlipped ? (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={practice.handlePrevious} 
                  disabled={practice.currentQuestionIndex === 0 || practice.processingNext} // Disable if processing
                >
                  ← Prev
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={practice.handleFlip}
                  disabled={practice.processingNext} // Disable if processing
                >
                  Show Answer
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleNextWrapper(null)}
                  disabled={practice.processingNext} // Disable if processing
                  style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
                >
                  {practice.processingNext ? '...' : 'Skip →'}
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn btn-secondary" 
                  onClick={practice.handlePrevious} 
                  disabled={practice.currentQuestionIndex === 0 || practice.processingNext}
                >
                  ← Prev
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={() => handleNextWrapper(true)}
                  disabled={practice.processingNext}
                  style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
                >
                  {practice.processingNext ? '...' : '✓ Right'}
                </button>
                <button 
                  className="btn btn-warning" 
                  onClick={() => handleNextWrapper(false)}
                  disabled={practice.processingNext}
                  style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
                >
                  {practice.processingNext ? '...' : '✗ Wrong'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleNextWrapper(null)}
                  disabled={practice.processingNext}
                  style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
                >
                  {practice.processingNext ? '...' : 'Skip →'}
                </button>
              </>
            )}
          </div>

          {/* 3. NEW: Image Modal/Lightbox */}
          {practice.enlargedImage && (
            <div className="image-modal" onClick={() => practice.setEnlargedImage(null)}>
              <img src={practice.enlargedImage} alt="Enlarged view" onClick={(e) => e.stopPropagation()} />
              <button 
                style={{
                  position: 'absolute', top: '20px', right: '20px', 
                  background: 'white', border: 'none', borderRadius: '50%', 
                  width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer'
                }}
                onClick={() => practice.setEnlargedImage(null)}
              >
                ✕
              </button>
            </div>
          )}
          
        </div>
      )}

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