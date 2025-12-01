import React, { useState } from 'react';

function SetsView({ questionSets, practice, startPracticeWrapper }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [setsFilter, setSetsFilter] = useState('all');
  const [displayCount, setDisplayCount] = useState(10);

  let sets = questionSets;
  if (setsFilter === 'completed') sets = sets.filter(s => s.questions_attempted === s.total_questions && s.total_questions > 0);
  else if (setsFilter === 'in-progress') sets = sets.filter(s => s.questions_attempted > 0 && s.questions_attempted < s.total_questions);
  else if (setsFilter === 'unattempted') sets = sets.filter(s => !s.questions_attempted || s.questions_attempted === 0);  // Zero questions answered
  
  const filtered = sets.filter(set => 
    set.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (set.tags && set.tags.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  const displayed = filtered.slice(0, displayCount);

  return (
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
      
      {filtered.length === 0 ? (
        <div className="empty-state"><p>No sets found.</p></div>
      ) : (
        <>
          <div className="set-list">
            {displayed.map(set => (
              <div 
                key={set.id} 
                className="set-card" 
                onClick={() => !practice.startingPractice && startPracticeWrapper(set)}
                style={{
                  cursor: practice.startingPractice ? 'wait' : 'pointer', 
                  opacity: practice.startingPractice ? 0.7 : 1,
                  position: 'relative'
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
      )}
    </div>
  );
}

export default SetsView;
