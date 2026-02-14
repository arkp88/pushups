import React, { memo } from 'react';
import { ArrowCounterClockwise, Books, Shuffle, DiceFive, XCircle, BookmarkSimple, CircleNotch } from '@phosphor-icons/react';
import { STORAGE_KEYS } from '../constants';
import './HomeView.css';

const HomeView = memo(function HomeView({
  stats,
  questionSets,
  practice,
  startPracticeWrapper,
  startMixedPracticeWrapper,
  mixedFilter,
  setMixedFilter,
  setView,
  setAppNotification,
  session,
  backendWaking
}) {
  return (
    <div className="home-container view-enter">
      {/* Streak Banner */}
      {session && stats.streak > 0 && (
        <div className="streak-banner">
          <div className="streak-banner-icon">🔥</div>
          <div>
            <div className="streak-banner-title">
              {stats.streak} Day Streak!
            </div>
            <div className="streak-banner-subtitle">
              {stats.streak === 1 ? 'Great start! Keep it going.' : `You're on fire! Don't break the chain.`}
            </div>
          </div>
        </div>
      )}

      <h2 className="home-title">Ready to Play?</h2>

      {/* Show loading state while starting practice */}
      {practice.startingPractice ? (
        <div className="practice-loading">
          <CircleNotch size={28} weight="bold" className="spin" />
          Loading questions...
        </div>
      ) : !backendWaking ? (
        <>
        <div className="practice-modes">
        <h3 className="section-title">Choose Mode</h3>
        <div className="practice-mode-grid">

          {/* 1. CONTINUE */}
          <button
            className="practice-mode-button primary-border"
            onClick={() => {
              const lastSetId = localStorage.getItem(STORAGE_KEYS.LAST_SET_ID);
              if (!lastSetId) {
                setAppNotification('No recent set found. Start a set first!', false);
                return;
              }
              const lastSet = questionSets.find(s => s.id === parseInt(lastSetId));
              if (!lastSet) {
                setAppNotification('Last practiced set not found. Cleared session.', false);
                localStorage.removeItem(STORAGE_KEYS.LAST_SET_ID);
                return;
              }
              startPracticeWrapper(lastSet);
            }}
            disabled={!localStorage.getItem(STORAGE_KEYS.LAST_SET_ID)}
          >
            <div className="practice-mode-icon">
              <ArrowCounterClockwise size={32} weight="bold" />
            </div>
            <div className="practice-mode-content">
              <h4>Continue Last Set</h4>
              <p>Resume your most recent session</p>
            </div>
          </button>

          {/* 2. BROWSE */}
          <button
            className="practice-mode-button"
            onClick={() => setView('sets')}
          >
            <div className="practice-mode-icon">
              <Books size={32} weight="bold" />
            </div>
            <div className="practice-mode-content">
              <h4>Browse Question Sets</h4>
              <p>Choose a specific set to play</p>
            </div>
          </button>

          {/* 3. RANDOM SET */}
          <button
            className="practice-mode-button"
            onClick={() => {
              const unplayedSets = questionSets.filter(s => !s.questions_attempted || s.questions_attempted === 0);
              if (unplayedSets.length === 0) {
                setAppNotification('No unplayed sets available! All sets have progress.', false);
                return;
              }
              practice.clearSessionTracking();
              const randomSet = unplayedSets[Math.floor(Math.random() * unplayedSets.length)];
              startPracticeWrapper(randomSet, true);
            }}
            disabled={questionSets.filter(s => !s.questions_attempted || s.questions_attempted === 0).length === 0}
          >
            <div className="practice-mode-icon">
              <Shuffle size={32} weight="bold" />
            </div>
            <div className="practice-mode-content">
              <h4>Random Unplayed Set</h4>
              <p>Jump into a set you haven't started</p>
            </div>
          </button>

          {/* 4. RANDOM MODE - ALL */}
          <button
            className="practice-mode-button"
            onClick={() => { setMixedFilter('all'); startMixedPracticeWrapper('all'); }}
          >
            <div className="practice-mode-icon">
              {practice.startingPractice && mixedFilter === 'all' ? (
                <CircleNotch size={32} weight="bold" className="spin" />
              ) : (
                <DiceFive size={32} weight="bold" />
              )}
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
            disabled={stats.missed === 0}
          >
            <div className="practice-mode-icon">
              {practice.startingPractice && mixedFilter === 'missed' ? (
                <CircleNotch size={32} weight="bold" className="spin" />
              ) : (
                <XCircle size={32} weight="bold" />
              )}
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
            disabled={!stats.bookmarks || stats.bookmarks === 0}
          >
            <div className="practice-mode-icon">
              {practice.startingPractice && mixedFilter === 'bookmarks' ? (
                <CircleNotch size={32} weight="bold" className="spin" />
              ) : (
                <BookmarkSimple size={32} weight="fill" />
              )}
            </div>
            <div className="practice-mode-content">
              <h4>Review Bookmarks</h4>
              <p>Play questions you saved ({stats.bookmarks || 0})</p>
            </div>
          </button>

        </div>
      </div>

      {/* Stats at bottom */}
      {session ? (
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
      ) : (
        <div className="guest-signin-card">
          <div className="guest-signin-title">
            Sign in to unlock tracking
          </div>
          <div className="guest-signin-subtitle">
            Track your stats, bookmarks, and missed questions by signing in
          </div>
        </div>
      )}
      </>
      ) : null}
    </div>
  );
});

export default HomeView;
