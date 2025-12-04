import React, { useEffect, useRef } from 'react';
import { getSafeImageUrl } from '../utils';

function PracticeView({
  practice,
  questionSets,
  startPracticeWrapper,
  handleNextWrapper,
  handleBookmarkWrapper,
  setView
}) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          practice.handleFlip();
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (practice.isFlipped && !practice.processingNext) {
            handleNextWrapper(true);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (practice.isFlipped && !practice.processingNext) {
            handleNextWrapper(false);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (practice.currentQuestionIndex > 0 && !practice.processingNext) {
            practice.handlePrevious();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!practice.processingNext) {
            handleNextWrapper(null);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setView('sets');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [practice, handleNextWrapper, setView]);

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    if (!practice.isFlipped) return; // Only allow swipes when card is flipped
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    if (!practice.isFlipped) return;
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
    
    // If horizontal movement is greater than vertical, it's a swipe
    if (deltaX > 10 && deltaX > deltaY) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = (e) => {
    if (!practice.isFlipped || !isSwiping.current) {
      isSwiping.current = false;
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    const threshold = 100; // Minimum swipe distance

    if (Math.abs(deltaX) > threshold && !practice.processingNext) {
      e.preventDefault();
      e.stopPropagation();
      
      if (deltaX > 0) {
        // Swipe right = correct
        handleNextWrapper(true);
      } else {
        // Swipe left = wrong
        handleNextWrapper(false);
      }
    }
    
    isSwiping.current = false;
  };

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
          <div style={{fontWeight: 'bold', color: '#333', fontSize: '18px', marginBottom: '5px', wordBreak: 'break-word', paddingLeft: '40px', paddingRight: '40px'}}>
            {practice.currentSet.name}
          </div>
          <div className="flashcard-progress" style={{color: '#666', fontWeight: '600'}}>
            Question {practice.currentQuestionIndex + 1} / {practice.questions.length}
          </div>
          
          {/* Desktop keyboard shortcuts hint */}
          <div className="desktop-only" style={{
            fontSize: '13px', 
            color: '#667eea', 
            marginTop: '10px',
            fontWeight: '500',
            background: 'rgba(102, 126, 234, 0.08)',
            padding: '8px 12px',
            borderRadius: '6px',
            display: 'inline-block'
          }}>
            ⌨️ Space: flip | ↑: correct | ↓: wrong | ←: prev | →: skip | Esc: back
          </div>
          
          {/* Mobile swipe instructions */}
          <div className="mobile-only" style={{
            fontSize: '12px',
            color: '#667eea',
            marginTop: '10px',
            fontWeight: '500'
          }}>
            👆 Swipe right for correct, left for wrong
          </div>
        </div>
      </div>

      <div 
        className={`flashcard ${practice.isFlipped ? 'flipped' : ''}`} 
        onClick={(e) => {
          // Only flip if not swiping
          if (!isSwiping.current) {
            practice.handleFlip();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
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
            {practice.questions[practice.currentQuestionIndex].image_url && (() => {
              const originalUrl = practice.questions[practice.currentQuestionIndex].image_url;
              const safeUrl = getSafeImageUrl(originalUrl);

              return safeUrl ? (
                <img
                  src={safeUrl}
                  alt="Q"
                  className="question-image"
                  onClick={(e) => {
                    e.stopPropagation();
                    practice.setEnlargedImage(safeUrl);
                  }}
                  onError={(e) => {
                    // If HTTPS upgrade failed, show a fallback
                    e.target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'image-load-error';
                    fallback.innerHTML = `
                      <div style="padding: 16px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; margin: 16px 0;">
                        ⚠️ Image unavailable in secure mode
                        <div style="font-size: 12px; margin-top: 8px;">
                          <a href="${originalUrl}" target="_blank" rel="noopener noreferrer" style="color: #667eea;">View image in new tab</a>
                        </div>
                      </div>
                    `;
                    e.target.parentNode.insertBefore(fallback, e.target);
                  }}
                />
              ) : null;
            })()}

            <div className="flip-hint">Click to reveal answer</div>
          </>
        ) : (
          <>
            <div className="answer-text" dangerouslySetInnerHTML={{ __html: practice.questions[practice.currentQuestionIndex].answer_text }} />
            <div className="flip-hint">Click to see question</div>
          </>
        )}

        {/* Text-to-Speech Button - positioned at bottom of card */}
        <div
          onClick={practice.speakText}
          className="speaker-button"
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            fontSize: '28px',
            cursor: 'pointer',
            zIndex: 10,
            color: practice.isSpeaking
              ? (practice.isFlipped ? '#fff' : '#667eea')
              : (practice.isFlipped ? 'rgba(255, 255, 255, 0.9)' : '#6b7280'),
            filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
            transition: 'all 0.2s ease',
            background: practice.isFlipped ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)',
            borderRadius: '50%',
            width: '45px',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={practice.isSpeaking ? "Stop speaking" : "Read aloud"}
        >
          {practice.isSpeaking ? '🔊' : '🔈'}
        </div>
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
              className="btn btn-warning" 
              onClick={() => handleNextWrapper(false)}
              disabled={practice.processingNext}
              style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
            >
              {practice.processingNext ? '...' : '✗ Wrong'}
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
