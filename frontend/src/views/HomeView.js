import React, { memo } from 'react';

const HomeView = memo(function HomeView({ 
  stats, 
  questionSets, 
  practice, 
  startPracticeWrapper, 
  startMixedPracticeWrapper, 
  mixedFilter, 
  setMixedFilter,
  setView 
}) {
  return (
    <div className="home-container">
      <h2 style={{marginBottom: '30px', textAlign: 'center'}}>Ready to Play?</h2>

      <div className="practice-modes">
        <h3 style={{marginBottom: '20px'}}>Choose Mode</h3>
        <div className="practice-mode-grid">
          
          {/* 1. CONTINUE */}
          <button 
            className="practice-mode-button" 
            onClick={() => {
              const lastSetId = localStorage.getItem('pushups-last-set-id');
              if (!lastSetId) { alert('No recent set found.'); return; }
              const lastSet = questionSets.find(s => s.id === parseInt(lastSetId));
              if (!lastSet) { alert('Last practiced set not found.'); localStorage.removeItem('pushups-last-set-id'); return; }
              startPracticeWrapper(lastSet);
            }} 
            disabled={practice.startingPractice || !localStorage.getItem('pushups-last-set-id')}
            style={{opacity: practice.startingPractice ? 0.7 : 1, cursor: practice.startingPractice ? 'wait' : 'pointer', border: '2px solid #667eea'}}
          >
            <div className="practice-mode-icon">🔄</div>
            <div className="practice-mode-content">
              <h4>Continue Last Set</h4>
              <p>Resume your most recent session</p>
            </div>
          </button>

          {/* 2. BROWSE */}
          <button 
            className="practice-mode-button" 
            onClick={() => setView('sets')}
            disabled={practice.startingPractice}
            style={{opacity: practice.startingPractice ? 0.7 : 1, cursor: practice.startingPractice ? 'wait' : 'pointer'}}
          >
            <div className="practice-mode-icon">📚</div>
            <div className="practice-mode-content">
              <h4>Browse Question Sets</h4>
              <p>Choose a specific topic to play</p>
            </div>
          </button>

          {/* 3. RANDOM SET */}
          <button 
            className="practice-mode-button"
            onClick={() => {
              const unplayedSets = questionSets.filter(s => !s.questions_attempted || s.questions_attempted === 0);
              if (unplayedSets.length === 0) {
                alert('No unplayed sets available! All sets have progress.');
                return;
              }
              // Clear session tracking and start fresh random session
              practice.clearSessionTracking();
              const randomSet = unplayedSets[Math.floor(Math.random() * unplayedSets.length)];
              startPracticeWrapper(randomSet, true);
            }}
            disabled={practice.startingPractice || questionSets.filter(s => !s.questions_attempted || s.questions_attempted === 0).length === 0}
            style={{opacity: practice.startingPractice ? 0.7 : 1, cursor: practice.startingPractice ? 'wait' : 'pointer'}}
          >
            <div className="practice-mode-icon">🎰</div>
            <div className="practice-mode-content">
              <h4>Random Unplayed Set</h4>
              <p>Jump into a set you haven't started</p>
            </div>
          </button>

          {/* 4. RANDOM MODE - ALL */}
          <button 
            className="practice-mode-button" 
            onClick={() => { setMixedFilter('all'); startMixedPracticeWrapper('all'); }}
            disabled={practice.startingPractice}
            style={{opacity: practice.startingPractice ? 0.7 : 1, cursor: practice.startingPractice ? 'wait' : 'pointer'}}
          >
            <div className="practice-mode-icon">
              {practice.startingPractice && mixedFilter === 'all' ? '⏳' : '🎲'}
            </div>
            <div className="practice-mode-content">
              <h4>Random Mode - All</h4>
              <p>Shuffle all questions from all sets</p>
            </div>
          </button>

          {/* 5. MISSED */}
          <button 
            className="practice-mode-button" 
            onClick={() => { setMixedFilter('missed'); startMixedPracticeWrapper('missed'); }} 
            disabled={practice.startingPractice || stats.missed === 0}
            style={{opacity: practice.startingPractice ? 0.7 : 1, cursor: practice.startingPractice ? 'wait' : 'pointer'}}
          >
            <div className="practice-mode-icon">
              {practice.startingPractice && mixedFilter === 'missed' ? '⏳' : '❌'}
            </div>
            <div className="practice-mode-content">
              <h4>Retry Missed Questions</h4>
              <p>Review what you got wrong ({stats.missed} questions)</p>
            </div>
          </button>

          {/* 6. BOOKMARKS */}
          <button 
            className="practice-mode-button" 
            onClick={() => { setMixedFilter('bookmarks'); startMixedPracticeWrapper('bookmarks'); }} 
            disabled={practice.startingPractice || !stats.bookmarks || stats.bookmarks === 0}
            style={{opacity: practice.startingPractice ? 0.7 : 1, cursor: practice.startingPractice ? 'wait' : 'pointer'}}
          >
            <div className="practice-mode-icon">
              {practice.startingPractice && mixedFilter === 'bookmarks' ? '⏳' : '⭐'}
            </div>
            <div className="practice-mode-content">
              <h4>Review Bookmarks</h4>
              <p>Play questions you saved ({stats.bookmarks || 0})</p>
            </div>
          </button>

        </div>
      </div>

      {/* Stats at bottom - motivational context */}
      <div className="quick-stats-grid" style={{marginTop: '40px'}}>
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
    </div>
  );
});

export default HomeView;
