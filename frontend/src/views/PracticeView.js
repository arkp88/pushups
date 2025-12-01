import React from 'react';

function PracticeView({ 
  practice, 
  questionSets, 
  startPracticeWrapper, 
  handleNextWrapper, 
  handleBookmarkWrapper,
  setView 
}) {
  if (practice.questions.length === 0) return null;

  return (
    <div className="flashcard-container">
      
      {/* Notification Banner */}
      {practice.practiceNotification && (
        <div className="notification-banner">
          ℹ️ {practice.practiceNotification}
        </div>
      )}

      <div className="flashcard-header" style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
        <div style={{display: 'flex', justifyContent: 'space-between', width: '100%'}}>
          <button className="btn btn-secondary" onClick={() => setView('sets')}>← Back</button>
          
          {practice.practiceMode === 'single' && (
            <button 
              className="btn btn-primary" 
              disabled={practice.startingPractice}
              onClick={() => {
                // Unplayed = zero questions answered AND not opened in this session
                const unplayed = questionSets.filter(s => 
                  s.id !== practice.currentSet.id && 
                  (!s.questions_attempted || s.questions_attempted === 0) &&
                  !practice.setsOpenedThisSession.includes(s.id)
                );
                if (unplayed.length === 0) {
                  practice.setPracticeNotification('🎉 You\'ve tried all unplayed sets in this session!');
                  setTimeout(() => practice.setPracticeNotification(''), 4000);
                  return;
                }
                const randomSet = unplayed[Math.floor(Math.random() * unplayed.length)];
                // Mark as random session so it gets tracked
                practice.startPractice(randomSet, true);
              }}
            >
              {practice.startingPractice ? 'Loading...' : '🎲 Another Random Set'}
            </button>
          )}
        </div>

        <div style={{textAlign: 'center', width: '100%'}}>
          <div style={{fontWeight: 'bold', color: '#333', fontSize: '18px', marginBottom: '5px', wordBreak: 'break-word'}}>
            {practice.currentSet.name}
          </div>
          <div className="flashcard-progress" style={{color: '#666', fontWeight: '600'}}>
            Question {practice.currentQuestionIndex + 1} / {practice.questions.length}
          </div>
        </div>
      </div>

      <div className={`flashcard ${practice.isFlipped ? 'flipped' : ''}`} onClick={practice.handleFlip}>
        
        {/* Bookmark Icon */}
        <div 
          onClick={handleBookmarkWrapper}
          style={{
            position: 'absolute', 
            top: '12px',
            right: '12px',
            fontSize: '32px',
            cursor: 'pointer',
            zIndex: 10,
            color: practice.questions[practice.currentQuestionIndex].is_bookmarked 
              ? '#fbbf24' 
              : (practice.isFlipped ? 'rgba(255,255,255,0.9)' : '#6b7280'),
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
            transition: 'all 0.2s ease'
          }}
          title="Toggle Bookmark"
        >
          {practice.questions[practice.currentQuestionIndex].is_bookmarked ? '★' : '☆'}
        </div>

        <div className="round-info">
          {practice.practiceMode === 'mixed' 
            ? practice.questions[practice.currentQuestionIndex].set_name 
            : `${practice.questions[practice.currentQuestionIndex].round_no} - ${practice.questions[practice.currentQuestionIndex].question_no}`}
        </div>
        
        {!practice.isFlipped ? (
          <>
            <div className="question-text" dangerouslySetInnerHTML={{ __html: practice.questions[practice.currentQuestionIndex].question_text }} />
            
            {/* Image with click-to-expand */}
            {practice.questions[practice.currentQuestionIndex].image_url && (
              <img 
                src={practice.questions[practice.currentQuestionIndex].image_url} 
                alt="Q" 
                className="question-image"
                onClick={(e) => {
                  e.stopPropagation();
                  practice.setEnlargedImage(practice.questions[practice.currentQuestionIndex].image_url);
                }}
              />
            )}
            
            <div className="flip-hint">Click to reveal</div>
          </>
        ) : (
          <>
            <div className="answer-text" dangerouslySetInnerHTML={{ __html: practice.questions[practice.currentQuestionIndex].answer_text }} />
            <div className="flip-hint">Click to question</div>
          </>
        )}
      </div>

      <div className="flashcard-controls">
        {!practice.isFlipped ? (
          <>
            <button 
              className="btn btn-secondary" 
              onClick={practice.handlePrevious} 
              disabled={practice.currentQuestionIndex === 0 || practice.processingNext}
            >
              ← Prev
            </button>
            <button 
              className="btn btn-primary" 
              onClick={practice.handleFlip}
              disabled={practice.processingNext}
            >
              Show Answer
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleNextWrapper(null)}
              disabled={practice.processingNext}
              style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
            >
              {practice.processingNext ? '...' : 'Skip →'}
            </button>
          </>
        ) : (
          <>
            <button 
              className="btn btn-secondary" 
              onClick={practice.handlePrevious} 
              disabled={practice.currentQuestionIndex === 0 || practice.processingNext}
            >
              ← Prev
            </button>
            <button 
              className="btn btn-success" 
              onClick={() => handleNextWrapper(true)}
              disabled={practice.processingNext}
              style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
            >
              {practice.processingNext ? '...' : '✓ Right'}
            </button>
            <button 
              className="btn btn-warning" 
              onClick={() => handleNextWrapper(false)}
              disabled={practice.processingNext}
              style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
            >
              {practice.processingNext ? '...' : '✗ Wrong'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleNextWrapper(null)}
              disabled={practice.processingNext}
              style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
            >
              {practice.processingNext ? '...' : 'Skip →'}
            </button>
          </>
        )}
      </div>

      {/* Image Modal/Lightbox */}
      {practice.enlargedImage && (
        <div className="image-modal" onClick={() => practice.setEnlargedImage(null)}>
          <img src={practice.enlargedImage} alt="Enlarged view" onClick={(e) => e.stopPropagation()} />
          <button 
            style={{
              position: 'absolute', top: '20px', right: '20px', 
              background: 'white', border: 'none', borderRadius: '50%', 
              width: '40px', height: '40px', fontSize: '20px', cursor: 'pointer'
            }}
            onClick={() => practice.setEnlargedImage(null)}
          >
            ✕
          </button>
        </div>
      )}
      
    </div>
  );
}

export default PracticeView;
