import React from 'react';

function StatsView({ stats }) {
  return (
    <div className="stats-container view-enter">
      <h2>Your Statistics</h2>
      <div className="stats-grid">
        <div className="stat-card--hero">
          <div className="stat-value">{stats.accuracy}%</div>
          <div className="stat-label">Accuracy</div>
        </div>
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
          <div className="stat-value">{stats.missed}</div>
          <div className="stat-label">Missed</div>
        </div>
      </div>
    </div>
  );
}

export default StatsView;
