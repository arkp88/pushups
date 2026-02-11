import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { SkeletonSetCard, EmptyState } from '../components/common';

function getSetStatus(set) {
  if (set.questions_attempted === set.total_questions && set.total_questions > 0) return 'completed';
  if (set.questions_attempted > 0 && set.questions_attempted < set.total_questions) return 'in-progress';
  return 'unattempted';
}

function SetsView({ questionSets, practice, startPracticeWrapper, backendWaking }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [setsFilter, setSetsFilter] = useState('all');
  const [sortBy, setSortBy] = useState('upload-date');
  const [displayCount, setDisplayCount] = useState(10);

  let sets = questionSets;
  if (setsFilter === 'completed') sets = sets.filter(s => s.questions_attempted === s.total_questions && s.total_questions > 0);
  else if (setsFilter === 'in-progress') sets = sets.filter(s => s.questions_attempted > 0 && s.questions_attempted < s.total_questions);
  else if (setsFilter === 'unattempted') sets = sets.filter(s => !s.questions_attempted || s.questions_attempted === 0);

  const filtered = sets.filter(set =>
    set.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (set.tags && set.tags.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Apply sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'upload-date') {
      return new Date(b.created_at) - new Date(a.created_at);
    } else if (sortBy === 'last-played') {
      const aDate = a.last_opened ? new Date(a.last_opened) : new Date(0);
      const bDate = b.last_opened ? new Date(b.last_opened) : new Date(0);
      return bDate - aDate;
    }
    return 0;
  });

  const displayed = sorted.slice(0, displayCount);

  return (
    <div className="container view-enter">
      <h2>Question Sets</h2>

      {/* Filter Buttons */}
      <div className="sets-filter-bar">
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

      {/* Sort Dropdown */}
      <div className="sets-sort-section">
        <label className="sets-sort-label">Sort by:</label>
        <select
          className="sets-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="upload-date">Upload Date (Newest)</option>
          <option value="alphabetical">Alphabetical (A-Z)</option>
          <option value="last-played">Last Played</option>
        </select>
      </div>

      {/* Search Bar */}
      <input
        className="sets-search-input"
        type="text"
        placeholder="Search by name or tag..."
        value={searchTerm}
        onChange={(e) => { setSearchTerm(e.target.value); setDisplayCount(10); }}
      />

      {backendWaking ? (
        <div className="set-list">
          {[1, 2, 3, 4].map(i => <SkeletonSetCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No sets found"
          description={searchTerm ? `No question sets match "${searchTerm}". Try a different search term or filter.` : "No question sets match your current filter."}
        />
      ) : (
        <>
          <div className="set-list">
            {displayed.map(set => {
              const status = getSetStatus(set);
              const progressPct = Math.round(((set.questions_attempted || 0) / set.total_questions) * 100);
              return (
                <div
                  key={set.id}
                  className={`set-card set-card--${status}`}
                  onClick={() => !practice.startingPractice && !backendWaking && startPracticeWrapper(set)}
                  style={{
                    cursor: (practice.startingPractice || backendWaking) ? 'wait' : 'pointer',
                    opacity: (practice.startingPractice || backendWaking) ? 0.7 : 1
                  }}
                >
                  {practice.startingPractice && practice.currentSet?.id === set.id && (
                    <div style={{position: 'absolute', top: '10px', right: '10px'}}>⏳</div>
                  )}
                  <h3>{set.name}</h3>
                  <div className="set-info">
                    <span>📝 {set.total_questions}</span>
                    <span>✅ {set.questions_attempted || 0}</span>
                    <span>👤 {set.uploaded_by_username}</span>
                    {set.tags && <span>🏷️ {set.tags}</span>}
                  </div>
                  <div className="progress-row">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: `${progressPct}%`}} />
                    </div>
                    <span className="progress-label">{progressPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length > displayCount && (
            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <button className="btn btn-primary" onClick={() => setDisplayCount(prev => prev + 10)}>Load More</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SetsView;
