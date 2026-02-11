import React from 'react';
import './SessionSummaryModal.css';

function SessionSummaryModal({
  practice,
  startPracticeWrapper,
  startMixedPracticeWrapper,
  setView
}) {
  if (!practice.showSessionSummary) return null;

  const totalAnswered = practice.sessionStats.correct + practice.sessionStats.wrong;
  const skipped = practice.questions.length - totalAnswered;
  const percentage = totalAnswered > 0 ? (practice.sessionStats.correct / practice.questions.length) * 100 : 0;
  const scoreColor = percentage > 75 ? '#16a34a' : percentage >= 25 ? '#f59e0b' : '#dc2626';

  return (
    <div className="session-modal-backdrop">
      <div className="session-modal-content">
        {/* Close button */}
        <button
          className="session-modal-close"
          onClick={() => practice.setShowSessionSummary(false)}
          title="Close and review last card"
        >
          ✕
        </button>

        {/* Header */}
        <div className="session-modal-header">
          <div className="session-modal-emoji">🎉</div>
          <h2 className="session-modal-title">Session Complete!</h2>
          <p className="session-modal-subtitle">{practice.currentSet.name}</p>
        </div>

        {/* Stats Grid */}
        <div className="session-stats-grid">
          <div className="session-stat-card session-stat-card--correct">
            <div className="session-stat-value">{practice.sessionStats.correct}</div>
            <div className="session-stat-label">Got it</div>
          </div>
          <div className="session-stat-card session-stat-card--wrong">
            <div className="session-stat-value">{practice.sessionStats.wrong}</div>
            <div className="session-stat-label">Missed it</div>
          </div>
          <div className="session-stat-card session-stat-card--skipped">
            <div className="session-stat-value">{skipped}</div>
            <div className="session-stat-label">Skipped</div>
          </div>
        </div>

        {/* Score */}
        <div className="session-modal-score">
          <div className="session-modal-score-label">Score</div>
          <div className="session-modal-score-value" style={{ color: scoreColor }}>
            {practice.sessionStats.correct}/{practice.questions.length}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="session-modal-actions">
          <button
            className="session-modal-btn session-modal-btn--primary"
            onClick={() => {
              practice.setShowSessionSummary(false);
              if (practice.currentSet.id !== 'mixed') {
                startPracticeWrapper(practice.currentSet);
              } else {
                const filter = practice.currentSet.name.match(/\((.*?)\)/)?.[1] || 'all';
                startMixedPracticeWrapper(filter);
              }
            }}
          >
            Practice Again
          </button>

          {practice.sessionMissedCount > 0 && (
            <button
              className="session-modal-btn session-modal-btn--danger"
              onClick={() => practice.reviewSessionMisses()}
            >
              Review Misses ({practice.sessionMissedCount})
            </button>
          )}

          <button
            className="session-modal-btn session-modal-btn--outline"
            onClick={() => {
              practice.setShowSessionSummary(false);
              setView('home');
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionSummaryModal;
