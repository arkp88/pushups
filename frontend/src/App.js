import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { api } from './api';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('sets'); // 'sets', 'practice', 'stats'
  const [questionSets, setQuestionSets] = useState([]);
  const [currentSet, setCurrentSet] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stats, setStats] = useState(null);

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
      localStorage.setItem(`quiz-position-${currentSet.id}`, newIndex);
    } else {
      // Practice session complete
      alert('Practice session complete!');
      localStorage.removeItem(`quiz-position-${currentSet.id}`);
      setView('sets');
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

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="App">
      <header className="header">
        <h1>🎯 ADOFAM - Made Specially for NASA!</h1>
          {stats && (
            <div style={{color: '#666', fontSize: '14px'}}>
              {stats.total_questions} questions • {questionSets.length} sets
            </div>
          )}
        <div className="user-info">
          <span className="user-email">{session.user.email}</span>
          <button className="btn btn-secondary" onClick={() => setView('stats')}>
            Stats
          </button>
          <button className="btn btn-secondary" onClick={() => setView('sets')}>
            Question Sets
          </button>
          <button className="btn btn-danger" onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
        </div>
      </header>

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
        <div className="question-sets">
          <h2>Question Sets</h2>
          
          <div className="upload-section">
            <h3>Upload New Question Set</h3>
            <p style={{color: '#666', marginBottom: '15px'}}>Upload a TSV file with your questions</p>
            <input
              type="file"
              id="file-upload"
              accept=".tsv"
              multiple
              onChange={handleUpload}
            />
            <label htmlFor="file-upload" className="upload-label">
              Choose TSV File
            </label>
          </div>

          {questionSets.length === 0 ? (
            <div className="empty-state">
              <h3>No Question Sets Yet</h3>
              <p>Upload your first TSV file to get started!</p>
            </div>
          ) : (
            <div className="set-list">
              {questionSets.map((set) => (
                <div
                  key={set.id}
                  className="set-card"
                  onClick={() => startPractice(set)}
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
              {questions[currentQuestionIndex].round_no} - {questions[currentQuestionIndex].question_no}
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
          </div>
        </div>
      )}
    </div>
  );
}

function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
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
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
