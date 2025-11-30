import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { api } from './api';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('home'); // 'home', 'sets', 'upload', 'practice', 'stats'
  const [questionSets, setQuestionSets] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [practiceMode, setPracticeMode] = useState('single'); // 'single' or 'mixed'
  const [mixedFilter, setMixedFilter] = useState('all'); // 'all', 'unattempted', 'missed'
  const [displayCount, setDisplayCount] = useState(10);
  const [uploadTags, setUploadTags] = useState(''); // Tags for upload
  const [customName, setCustomName] = useState(''); // Custom name for upload
  const [selectedFileCount, setSelectedFileCount] = useState(0); // Track file count
  const [setsFilter, setSetsFilter] = useState('all'); // 'all', 'completed', 'in-progress', 'unattempted'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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

const handleUpload = async (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  try {
    setLoading(true);
    let successCount = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Determine set name
      let setName;
      if (customName.trim()) {
        // Custom name provided
        if (files.length > 1) {
          // Multi-file: add numbering
          setName = `${customName.trim()} - ${i + 1}`;
        } else {
          // Single file: use custom name as-is
          setName = customName.trim();
        }
      } else {
        // No custom name: use filename
        setName = file.name.replace('.tsv', '');
      }
      
      try {
        await api.uploadTSV(file, setName, '', uploadTags);
        successCount++;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }
    
    await loadQuestionSets();
    setUploadTags(''); // Clear tags
    setCustomName(''); // Clear custom name
    setSelectedFileCount(0); // Reset file count
    alert(`Successfully uploaded ${successCount} of ${files.length} files!`);
  } catch (error) {
    alert('Error uploading files: ' + error.message);
  } finally {
    setLoading(false);
    event.target.value = '';
  }
};

const handleFileSelect = (event) => {
  setSelectedFileCount(event.target.files?.length || 0);
};

const handleDeleteSet = async (setId, setName) => {
  if (!window.confirm(`Confirm Deletion of "${setName}"? `)) {
    return;
  }
  
  try {
    setLoading(true);
    await api.deleteQuestionSet(setId);
    await loadQuestionSets();
    alert('Question set deleted successfully!');
  } catch (error) {
    alert('Error deleting set: ' + error.message);
  } finally {
    setLoading(false);
  }
};

const startPractice = async (set) => {
  try {
    setLoading(true);
    
    // Mark set as directly opened (not via random mode)
    try {
      await api.markSetOpened(set.id);
    } catch (error) {
      console.error('Failed to mark set as opened:', error);
    }
    
    // Track as last set for "Continue" feature
    localStorage.setItem('last-set-id', set.id);
    
    const data = await api.getQuestions(set.id);
    setQuestions(data.questions);
    setCurrentSet(set);
    
    // Load saved position
    const savedPosition = localStorage.getItem(`quiz-position-${set.id}`);
    const startIndex = savedPosition ? parseInt(savedPosition) : 0;
    
    setCurrentQuestionIndex(startIndex);
    setIsFlipped(false);
    setView('practice');
    
    if (savedPosition) {
      alert(`Resuming from question ${startIndex + 1}`);
    }
  } catch (error) {
    alert('Error loading questions: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  const startMixedPractice = async (filter) => {
    try {
      setLoading(true);
      const data = await api.getMixedQuestions(filter);
      
      if (data.questions.length === 0) {
        alert(`No ${filter} questions found!`);
        setLoading(false);
        return;
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
      setLoading(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

const handleNext = async (markAsCorrect = null) => {
  const currentQuestion = questions[currentQuestionIndex];
  
  try {
    // Update progress
    await api.updateProgress(currentQuestion.id, true, markAsCorrect);
    
    // If marked as incorrect/missed, add to missed questions
    if (markAsCorrect === false) {
      await api.markMissed(currentQuestion.id);
    }
    
    // If marked as correct AND question was previously missed, remove from missed
    if (markAsCorrect === true && currentQuestion.is_missed) {
      await api.unmarkMissed(currentQuestion.id);
    }
  } catch (error) {
    console.error('Error updating progress:', error);
  }

  // Move to next question
  if (currentQuestionIndex < questions.length - 1) {
    const newIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(newIndex);
    setIsFlipped(false);
    // Save position
    if (currentSet.id !== 'mixed') {
      localStorage.setItem(`quiz-position-${currentSet.id}`, newIndex);
    }
  } else {
    // Session complete
    alert('Session complete!');
    if (currentSet.id !== 'mixed') {
      localStorage.removeItem(`quiz-position-${currentSet.id}`);
    }
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

const filteredSets = questionSets.filter(set =>
  set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (set.tags && set.tags.toLowerCase().includes(searchTerm.toLowerCase()))
);

const displayedSets = filteredSets.slice(0, displayCount);
const hasMore = filteredSets.length > displayCount;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

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
          <button className="btn btn-danger" onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
        </div>
      </header>

      <nav className="tab-navigation">
        <button 
          className={`tab-button ${view === 'home' ? 'active' : ''}`}
          onClick={() => setView('home')}
        >
          🏠 Home
        </button>
        <button 
          className={`tab-button ${view === 'sets' ? 'active' : ''}`}
          onClick={() => setView('sets')}
        >
          📚 Browse Sets
        </button>
        <button 
          className={`tab-button ${view === 'upload' ? 'active' : ''}`}
          onClick={() => setView('upload')}
        >
          ⬆️ Upload
        </button>
        <button 
          className={`tab-button ${view === 'stats' ? 'active' : ''}`}
          onClick={() => setView('stats')}
        >
          📊 Stats
        </button>
        <button 
          className={`tab-button ${view === 'help' ? 'active' : ''}`}
          onClick={() => setView('help')}
      >
          ❓ Help
        </button>
      </nav>

      {view === 'home' && stats && (
        <div className="home-container">
          <h2 style={{marginBottom: '30px', textAlign: 'center'}}>Ready to Play?</h2>
          
          {/* Quick Stats Cards */}
          <div className="quick-stats-grid">
            <div className="quick-stat-card">
              <div className="quick-stat-value">{stats.total_questions}</div>
              <div className="quick-stat-label">Questions Available</div>
            </div>
            <div className="quick-stat-card">
              <div className="quick-stat-value">{stats.attempted}</div>
              <div className="quick-stat-label">Attempted ({Math.round((stats.attempted / stats.total_questions) * 100)}%)</div>
            </div>
            <div className="quick-stat-card">
              <div className="quick-stat-value">{stats.accuracy}%</div>
              <div className="quick-stat-label">Accuracy</div>
            </div>
          </div>

          {/* Mode Buttons */}
          <div className="practice-modes">
            <h3 style={{marginBottom: '20px'}}>Choose Mode</h3>
            
            <div className="practice-mode-grid">
              <button 
                className="practice-mode-button"
                onClick={() => setView('sets')}
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
                disabled={questionSets.filter(s => !s.directly_opened).length === 0}
              >
                <div className="practice-mode-icon">🎰</div>
                <div className="practice-mode-content">
                  <h4>Random Unplayed Set</h4>
                  <p>Jump into a set you haven't started ({questionSets.filter(s => !s.directly_opened).length} available)</p>
                </div>
                </button>


              <button 
                className="practice-mode-button"
                onClick={() => {
                  setMixedFilter('all');
                  startMixedPractice('all');
                }}
              >
                <div className="practice-mode-icon">🎲</div>
                <div className="practice-mode-content">
                  <h4>Random Mode - All Questions</h4>
                  <p>Randomized questions from across sets</p>
                </div>
              </button>

              <button 
                className="practice-mode-button"
                onClick={() => {
                  setMixedFilter('unattempted');
                  startMixedPractice('unattempted');
                }}
              >
                <div className="practice-mode-icon">🆕</div>
                <div className="practice-mode-content">
                  <h4>Random Mode - Unattempted</h4>
                  <p>Random mode, but only questions you haven't seen yet</p>
                </div>
              </button>

              <button 
                className="practice-mode-button"
                onClick={() => {
                  setMixedFilter('missed');
                  startMixedPractice('missed');
                }}
                disabled={stats.missed === 0}
              >
                <div className="practice-mode-icon">❌</div>
                <div className="practice-mode-content">
                  <h4>Retry Missed Questions</h4>
                  <p>Review what you got wrong ({stats.missed} questions)</p>
                </div>
              </button>

                <button 
                  className="practice-mode-button"
                  onClick={() => {
                    const lastSetId = localStorage.getItem('last-set-id');
                    if (!lastSetId) {
                      alert('No recent set found. Start playing a set first!');
                      return;
                    }
                    
                    const lastSet = questionSets.find(s => s.id === parseInt(lastSetId));
                    if (!lastSet) {
                      alert('Last practiced set no longer exists.');
                      localStorage.removeItem('last-set-id');
                      return;
                    }
                    
                    startPractice(lastSet);
                  }}
                  disabled={!localStorage.getItem('last-set-id')}
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
            <div className="stat-card">
              <div className="stat-value">{stats.total_questions}</div>
              <div className="stat-label">Total Questions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.attempted}</div>
              <div className="stat-label">Attempted</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.correct}</div>
              <div className="stat-label">Correct</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.missed}</div>
              <div className="stat-label">Missed (For Review)</div>
            </div>
          </div>
        </div>
      )}

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
    
    {/* Filter Tabs */}
    <div style={{
      display: 'flex', 
      gap: '10px', 
      marginTop: '20px',
      marginBottom: '20px',
      flexWrap: 'wrap'
    }}>
      <button 
        className={`btn ${setsFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => {
          setSetsFilter('all');
          setDisplayCount(10);
        }}
      >
        All Sets ({questionSets.length})
      </button>
      <button 
        className={`btn ${setsFilter === 'completed' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => {
          setSetsFilter('completed');
          setDisplayCount(10);
        }}
      >
        ✅ Completed ({questionSets.filter(s => s.questions_attempted === s.total_questions && s.total_questions > 0).length})
      </button>
      <button 
        className={`btn ${setsFilter === 'in-progress' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => {
          setSetsFilter('in-progress');
          setDisplayCount(10);
        }}
      >
        ⏳ In Progress ({questionSets.filter(s => s.questions_attempted > 0 && s.questions_attempted < s.total_questions).length})
      </button>
      <button 
        className={`btn ${setsFilter === 'unattempted' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => {
          setSetsFilter('unattempted');
          setDisplayCount(10);
        }}
      >
        🆕 Unattempted ({questionSets.filter(s => !s.questions_attempted || s.questions_attempted === 0).length})
      </button>
    </div>
    
    <input
      type="text"
      placeholder="Search by name or tag..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        setDisplayCount(10);
      }}
      style={{
        width: '100%',
        padding: '12px',
        marginBottom: '20px',
        border: '2px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '16px'
      }}
    />

    {(() => {
      // Apply filter logic
      let setsToDisplay = questionSets;
      
      // Apply status filter
      if (setsFilter === 'completed') {
        setsToDisplay = setsToDisplay.filter(s => 
          s.questions_attempted === s.total_questions && s.total_questions > 0
        );
      } else if (setsFilter === 'in-progress') {
        setsToDisplay = setsToDisplay.filter(s => 
          s.questions_attempted > 0 && s.questions_attempted < s.total_questions
        );
      } else if (setsFilter === 'unattempted') {
        setsToDisplay = setsToDisplay.filter(s => 
          !s.questions_attempted || s.questions_attempted === 0
        );
      }
      
      // Apply search filter
      const filteredSets = setsToDisplay.filter(set =>
        set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (set.tags && set.tags.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      const displayedSets = filteredSets.slice(0, displayCount);
      const hasMore = filteredSets.length > displayCount;
      
      if (filteredSets.length === 0) {
        return (
          <div className="empty-state">
            <h3>No Question Sets Found</h3>
            <p>
              {searchTerm 
                ? `No sets match "${searchTerm}"` 
                : setsFilter === 'all'
                ? 'Go to the Upload tab to add your first TSV file!'
                : `No ${setsFilter.replace('-', ' ')} sets available`
              }
            </p>
          </div>
        );
      }
      
      return (
        <>
          <div className="set-list">
            {displayedSets.map((set) => (
              <div
                key={set.id}
                className="set-card"
                onClick={() => startPractice(set)}
                style={{cursor: 'pointer'}}
              >
                <h3>{set.name}</h3>
                <div className="set-info">
                  <span>📝 {set.total_questions} questions</span>
                  <span>✅ {set.questions_attempted || 0} attempted</span>
                  <span>👤 {set.uploaded_by_username}</span>
                  {set.tags && <span>🏷️ {set.tags}</span>}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${((set.questions_attempted || 0) / set.total_questions) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <button 
                className="btn btn-primary"
                onClick={() => setDisplayCount(prev => prev + 10)}
              >
                Load More ({filteredSets.length - displayCount} remaining)
              </button>
            </div>
          )}
        </>
      );
    })()}
  </div>
)}

      {view === 'upload' && (
        <div className="container">
          <h2>Upload Question Sets</h2>
          <p style={{color: '#666', marginBottom: '30px'}}>
            Upload mimir-format TSV files to add new question sets. All users will be able to see and play your uploaded sets.
          </p>
          
          <div className="upload-section">
            <h3>Upload New Question Set</h3>
            <p style={{color: '#666', marginBottom: '15px'}}>Upload Mimir-format TSV files</p>
            
            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#555', fontWeight: '500'}}>
                Custom Name (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., Quiz Night March 2024"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <p style={{color: '#999', fontSize: '12px', marginTop: '5px'}}>
                💡 Naming is optional, but proper naming will ensure easy identification of sets!
              </p>
              {selectedFileCount > 1 && customName.trim() && (
                <p style={{color: '#667eea', fontSize: '12px', marginTop: '5px', fontWeight: '500'}}>
                  ℹ️ Multiple files will be named: "{customName.trim()} - 1", "{customName.trim()} - 2", etc.
                </p>
              )}
            </div>

            <div style={{marginBottom: '15px'}}>
              <label style={{display: 'block', marginBottom: '8px', color: '#555', fontWeight: '500'}}>
                Tags (optional)
              </label>
              <input
                type="text"
                placeholder="e.g., B612, Films, History"
                value={uploadTags}
                onChange={(e) => setUploadTags(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <p style={{color: '#999', fontSize: '12px', marginTop: '5px'}}>
                Separate multiple tags with commas. These tags will be applied to all uploaded files.
              </p>
            </div>
            
            <input
              type="file"
              id="file-upload"
              accept=".tsv"
              multiple
              onChange={(e) => {
                handleFileSelect(e);
                handleUpload(e);
              }}
            />
            <label htmlFor="file-upload" className="upload-label">
              Choose TSV File(s)
            </label>
          </div>

          <div style={{marginTop: '40px'}}>
            <h3>Your Uploaded Sets</h3>
            <p style={{color: '#666', marginBottom: '20px'}}>
              Sets you've uploaded are shown below
            </p>
            
            {(() => {
              const myUploadedSets = questionSets.filter(set => set.uploaded_by_username === session.user.email.split('@')[0]);
              const displayedUploadedSets = myUploadedSets.slice(0, displayCount);
              const hasMoreUploaded = myUploadedSets.length > displayCount;
              
              if (myUploadedSets.length === 0) {
                return (
                  <div className="empty-state">
                    <p>You haven't uploaded any sets yet.</p>
                  </div>
                );
              }
              
              return (
                <>
                  <div className="set-list">
                    {displayedUploadedSets.map((set) => (
                      <div key={set.id} className="set-card" style={{position: 'relative'}}>
                        <h3>{set.name}</h3>
                        <div className="set-info">
                          <span>📝 {set.total_questions} questions</span>
                          <span>✅ {set.questions_attempted || 0} attempted by users</span>
                          {set.tags && <span>🏷️ {set.tags}</span>}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSet(set.id, set.name);
                          }}
                          className="btn btn-danger"
                          style={{
                            position: 'absolute',
                            top: '15px',
                            right: '15px',
                            padding: '6px 12px',
                            fontSize: '12px'
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {hasMoreUploaded && (
                    <div style={{textAlign: 'center', marginTop: '20px'}}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setDisplayCount(prev => prev + 10)}
                      >
                        Load More ({myUploadedSets.length - displayCount} remaining)
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

{view === 'sets-old' && (
        <div className="question-sets">
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px'}}>
            <h2 style={{margin: 0, width: '100%'}}>Question Sets</h2>
            <div style={{display: 'flex', gap: '10px'}}>
              <button 
                className={`btn ${practiceMode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPracticeMode('single')}
              >
                Play Specific Set
              </button>
              <button 
                className={`btn ${practiceMode === 'mixed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPracticeMode('mixed')}
              >
                Randomized Mode
              </button>
            </div>
          </div>

          {practiceMode === 'mixed' && (
            <div style={{
              background: '#f9fafb',
              border: '2px solid #667eea',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <h3 style={{marginBottom: '15px', color: '#333'}}>Random Mode</h3>
              <p style={{color: '#666', marginBottom: '15px'}}>Attempt questions from all sets combined</p>
              
              <div style={{display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap'}}>
                <button 
                  className={`btn ${mixedFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMixedFilter('all')}
                >
                  All Questions
                </button>
                <button 
                  className={`btn ${mixedFilter === 'unattempted' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMixedFilter('unattempted')}
                >
                  Unattempted Only
                </button>
                <button 
                  className={`btn ${mixedFilter === 'missed' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setMixedFilter('missed')}
                >
                  Missed Only
                </button>
              </div>
              
              <button 
                className="btn btn-success"
                onClick={() => startMixedPractice(mixedFilter)}
                style={{width: '100%'}}
              >
                Start Random Mode ({mixedFilter})
              </button>
            </div>
          )}
          
          <input
            type="text"
            placeholder="Search question sets..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setDisplayCount(10); // Reset to 10 when searching
            }}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px'
            }}
          />
          
          <div className="upload-section">
            <h3>Upload New Question Set</h3>
            <p style={{color: '#666', marginBottom: '15px'}}>Upload TSV files with your questions</p>
            <input
              type="file"
              id="file-upload"
              accept=".tsv"
              multiple
              onChange={handleUpload}
            />
            <label htmlFor="file-upload" className="upload-label">
              Choose TSV File(s)
            </label>
          </div>

{filteredSets.length === 0 ? (
            <div className="empty-state">
              <h3>No Question Sets Yet</h3>
              <p>Upload your first TSV file to get started!</p>
            </div>
          ) : (
            <>
              <div className="set-list">
                {displayedSets.map((set) => (
                  <div
                    key={set.id}
                    className="set-card"
                    onClick={() => practiceMode === 'single' ? startPractice(set) : null}
                    style={{cursor: practiceMode === 'single' ? 'pointer' : 'default', opacity: practiceMode === 'single' ? 1 : 0.6}}
                  >
                    <h3>{set.name}</h3>
                    <div className="set-info">
                      <span>📝 {set.total_questions} questions</span>
                      <span>✅ {set.questions_attempted || 0} attempted</span>
                      <span>👤 {set.uploaded_by_username}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${((set.questions_attempted || 0) / set.total_questions) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div style={{textAlign: 'center', marginTop: '20px'}}>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setDisplayCount(prev => prev + 10)}
                  >
                    Load More ({filteredSets.length - displayCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === 'practice' && questions.length > 0 && (
        <div className="flashcard-container">
          <div className="flashcard-header">
            <button className="btn btn-secondary" onClick={() => setView('sets')}>
              ← Back to Sets
            </button>
            <div style={{flex: 1, textAlign: 'center'}}>
              <div style={{fontWeight: 'bold', color: '#333', marginBottom: '5px'}}>
                {currentSet.name}
              </div>
              <div className="flashcard-progress">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>
            {practiceMode === 'single' && (
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  const unplayedSets = questionSets.filter(s => 
                    s.id !== currentSet.id && 
                    !s.directly_opened
                  );
                  if (unplayedSets.length === 0) {
                    alert('No other unplayed sets available!');
                    return;
                  }
                  const randomSet = unplayedSets[Math.floor(Math.random() * unplayedSets.length)];
                  
                  // Clear saved position for current set
                  if (currentSet.id !== 'mixed') {
                    localStorage.removeItem(`quiz-position-${currentSet.id}`);
                  }
                  
                  startPractice(randomSet);
                }}
                disabled={questionSets.filter(s => 
                  s.id !== currentSet.id && 
                  !s.directly_opened
                ).length === 0}
              >
                🎲 Jump to another random set
              </button>
            )}
          </div>

          <div
            className={`flashcard ${isFlipped ? 'flipped' : ''}`}
            onClick={handleFlip}
          >
          <div className="round-info">
          {practiceMode === 'mixed' ? (
            <span>From: {questions[currentQuestionIndex].set_name}</span>
          ) : (
            <span>{questions[currentQuestionIndex].round_no} - {questions[currentQuestionIndex].question_no}</span>
          )}
          </div>

            {!isFlipped ? (
              <>
              <div 
                className="question-text"
                dangerouslySetInnerHTML={{ __html: questions[currentQuestionIndex].question_text }}
              />
                {questions[currentQuestionIndex].image_url && (
                  <img
                    src={questions[currentQuestionIndex].image_url}
                    alt="Question"
                    className="question-image"
                  />
                )}
                <div className="flip-hint">Click to reveal answer</div>
              </>
            ) : (
              <>
                <div 
                  className="answer-text"
                  dangerouslySetInnerHTML={{ __html: questions[currentQuestionIndex].answer_text }}
                />
                <div className="flip-hint">Click to see question again</div>
              </>
            )}
          </div>

          <div className="flashcard-controls">
            {!isFlipped ? (
              // Question showing - only allow reveal or skip
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleFlip}
                >
                  Show Answer
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleNext(null)}
                >
                  Skip →
                </button>
              </>
            ) : (
              // Answer showing - allow self-assessment
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => handleNext(true)}
                >
                  ✓ Got it right
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => handleNext(false)}
                >
                  ✗ Missed it
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleNext(null)}
                >
                  Skip →
                </button>
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

    // Convert username to fake email
    const email = `${username.toLowerCase().trim()}@quiz.local`;

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Account created! You can now sign in.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
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
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={isSignUp ? "Choose a username" : "Enter your username"}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>
      </form>
      
      <div className="auth-toggle">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
        <button onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Sign In' : 'Sign Up'}
        </button>
      </div>
    </div>
  );
}

export default App;
