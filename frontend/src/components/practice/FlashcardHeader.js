import React from 'react';

function FlashcardHeader({ practice, setView }) {
  return (
    <div className="flashcard-header" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
        <button className="btn btn-secondary" onClick={() => setView('sets')}>← Back</button>

        {/* Instructions button - only show if instructions exist and NOT in mixed mode */}
        {practice.setInstructions.length > 0 && practice.practiceMode === 'single' && (
          <button
            className="btn btn-primary"
            onClick={() => practice.toggleInstructions()}
            style={{
              background: 'var(--bg-secondary)',
              border: '2px solid var(--border-focus)',
              color: 'var(--text-heading)',
              fontWeight: '600'
            }}
            title="View instructions for this set"
          >
            ℹ️ Set Instructions
          </button>
        )}
      </div>

      <div style={{textAlign: 'center', width: '100%'}}>
        {/* FIX #9: Responsive set name - ellipsis on mobile, normal on desktop */}
        <div style={{
          fontWeight: 'bold',
          color: 'var(--text-heading)',
          fontSize: '18px',
          marginBottom: '5px',
          paddingLeft: '40px',
          paddingRight: '40px'
        }} className="set-name-header">
          {practice.currentSet.name}
        </div>
        <div className="flashcard-progress">
          Question {practice.currentQuestionIndex + 1} / {practice.questions.length}
        </div>

        {/* Desktop keyboard shortcuts hint */}
        <div className="desktop-only" style={{
          fontSize: '13px',
          color: 'var(--border-focus)',
          marginTop: '10px',
          fontWeight: '500',
          background: 'var(--nav-hover-bg)',
          padding: '8px 12px',
          borderRadius: '6px',
          display: 'inline-block'
        }}>
          ⌨️ Space: Flip | ↑/→: Got it | ↓: Missed it | ←: Prev (Q) | →: Next (Q) | Esc: Back
        </div>
      </div>
    </div>
  );
}

export default FlashcardHeader;
