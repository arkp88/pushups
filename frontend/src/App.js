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
      const setName = file.name.replace('.tsv', '');
      
      try {
        await api.uploadTSV(file, setName, '');
        successCount++;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
      }
    }
    
    await loadQuestionSets();
    alert(`Successfully uploaded ${successCount} of ${files.length} files!`);
  } catch (error) {
    alert('Error uploading files: ' + error.message);
  } finally {
    setLoading(false);
    event.target.value = '';
  }
};

const startPractice = async (set) => {
  try {
    setLoading(true);
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
      setCurrentSet({ name: `Mixed Practice (${filter})`, id: 'mixed' });
      setCurrentQuestionIndex(0);
      setIsFlipped(false);
      setPracticeMode('mixed');
      setView('practice');
    } catch (error) {
      alert('Error loading mixed questions: ' + error.message);
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
      // Practice session complete
      alert('Practice session complete!');
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
  set.name.toLowerCase().includes(searchTerm.toLowerCase())
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
      </nav>

      {view === 'home' && stats && (
        <div className="home-container">
          <h2 style={{marginBottom: '30px', textAlign: 'center'}}>Ready to Practice?</h2>
          
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

          {/* Practice Mode Buttons */}
          <div className="practice-modes">
            <h3 style={{marginBottom: '20px'}}>Choose Practice Mode</h3>
            
            <button 
              className="practice-mode-button"
              onClick={() => setView('sets')}
            >
              <div className="practice-mode-icon">📚</div>
              <div className="practice-mode-content">
                <h4>Browse Question Sets</h4>
                <p>Practice by individual question set ({questionSets.length} sets available)</p>
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
                <h4>Mixed Practice - All Questions</h4>
                <p>Random questions from all sets</p>
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
                <h4>Mixed Practice - Unattempted</h4>
                <p>Only questions you haven't seen yet</p>
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
                <h4>Practice Missed Questions</h4>
                <p>Review what you got wrong ({stats.missed} questions)</p>
              </div>
            </button>
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


{view === 'sets' && (
        <div className="container">
          <h2>Question Sets</h2>
          
          <input
            type="text"
            placeholder="Search question sets..."
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

          {filteredSets.length === 0 ? (
            <div className="empty-state">
              <h3>No Question Sets Yet</h3>
              <p>Go to the Upload tab to add your first TSV file!</p>
            </div>
          ) : (
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

      {view === 'upload' && (
        <div className="container">
          <h2>Upload Question Sets</h2>
          <p style={{color: '#666', marginBottom: '30px'}}>
            Upload TSV files to add new question sets. All users will be able to see and practice from your uploaded sets.
          </p>
          
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

          <div style={{marginTop: '40px'}}>
            <h3>Your Uploaded Sets</h3>
            <p style={{color: '#666', marginBottom: '20px'}}>
              Sets you've uploaded are shown below
            </p>
            
            {questionSets.filter(set => set.uploaded_by_username === session.user.email.split('@')[0]).length === 0 ? (
              <div className="empty-state">
                <p>You haven't uploaded any sets yet.</p>
              </div>
            ) : (
              <div className="set-list">
                {questionSets
                  .filter(set => set.uploaded_by_username === session.user.email.split('@')[0])
                  .map((set) => (
                    <div key={set.id} className="set-card">
                      <h3>{set.name}</h3>
                      <div className="set-info">
                        <span>📝 {set.total_questions} questions</span>
                        <span>✅ {set.questions_attempted || 0} attempted by users</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
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
                Practice by Set
              </button>
              <button 
                className={`btn ${practiceMode === 'mixed' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPracticeMode('mixed')}
              >
                Mixed Practice
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
              <h3 style={{marginBottom: '15px', color: '#333'}}>Mixed Practice Mode</h3>
              <p style={{color: '#666', marginBottom: '15px'}}>Practice questions from all sets combined</p>
              
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
                Start Mixed Practice ({mixedFilter})
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
            <div className="flashcard-progress">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
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
                <div className="question-text">
                  {questions[currentQuestionIndex].question_text}
                </div>
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
                <div className="answer-text">
                  {questions[currentQuestionIndex].answer_text}
                </div>
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
