import React, { useEffect, useRef, useMemo, useState } from 'react';
import { getSafeImageUrl, convertMarkdownToHTML } from '../utils';

function PracticeView({
  practice,
  questionSets,
  startPracticeWrapper,
  startMixedPracticeWrapper,
  handleNextWrapper,
  handleBookmarkWrapper,
  setView
}) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialTimeoutRef = useRef(null);
  // FIX #29: Minimal bookmark animation state
  const [bookmarkPulse, setBookmarkPulse] = useState(false);
  // Track image load errors per question
  const [imageError, setImageError] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key) {
        case ' ':
        case 'Enter':
          // FIX #11: Only prevent default if content is not scrollable
          // Allow spacebar scrolling for long answer text
          const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
          if (!isScrollable) {
            e.preventDefault();
          }
          practice.handleFlip();
          break;
        case 'ArrowUp':
          e.preventDefault();
          // On answer view: "Got it" (same as arrow right)
          if (practice.isFlipped && !practice.processingNext) {
            handleNextWrapper(true);
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          // On answer view: "Missed it"
          if (practice.isFlipped && !practice.processingNext) {
            handleNextWrapper(false);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // On question view only: "Previous"
          if (!practice.isFlipped && practice.currentQuestionIndex > 0 && !practice.processingNext) {
            practice.handlePrevious();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (!practice.processingNext) {
            // On answer view: "Got it", On question view: "Next"
            handleNextWrapper(practice.isFlipped ? true : null);
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

  // FIX #4: Clean up image error state and reset swipe offset when question changes
  // Also cleanup on component unmount to prevent corrupted card position
  useEffect(() => {
    // Reset image error state for new question
    setImageError(false);

    // Reset swipe offset for new question
    setSwipeOffset(0);

    // FIX #4: Cleanup on unmount to reset swipe state
    return () => {
      setSwipeOffset(0);
    };
  }, [practice.currentQuestionIndex]);

  // Tutorial effect - show on first flip to answer
  useEffect(() => {
    if (practice.isFlipped && practice.questions.length > 0) {
      const hasSeenTutorial = localStorage.getItem('hasSeenSwipeTutorial');
      if (!hasSeenTutorial) {
        // Show tutorial after a brief delay
        tutorialTimeoutRef.current = setTimeout(() => {
          setShowTutorial(true);
          // Auto-dismiss after 4 seconds
          setTimeout(() => {
            setShowTutorial(false);
            localStorage.setItem('hasSeenSwipeTutorial', 'true');
          }, 4000);
        }, 500);
      }
    }
    return () => {
      if (tutorialTimeoutRef.current) {
        clearTimeout(tutorialTimeoutRef.current);
      }
    };
  }, [practice.isFlipped, practice.questions.length]);

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    if (!practice.isFlipped) return; // Only allow swipes when card is flipped

    // FIX #5: Dismiss tutorial on first touch AND set localStorage immediately
    // Previously only set on auto-dismiss timeout, causing tutorial to show every session
    if (showTutorial) {
      setShowTutorial(false);
      localStorage.setItem('hasSeenSwipeTutorial', 'true');
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    if (!practice.isFlipped) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

    // If horizontal movement is greater than vertical, it's a swipe
    if (Math.abs(deltaX) > 10 && Math.abs(deltaX) > deltaY) {
      isSwiping.current = true;
      // Update card position in real-time
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = (e) => {
    if (!practice.isFlipped || !isSwiping.current) {
      isSwiping.current = false;
      setSwipeOffset(0); // Reset position
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    // FIX #13: Responsive threshold - 25% of screen width instead of fixed 100px
    // Makes swipes easier on small phones (e.g., 320px width = 80px threshold vs old 100px)
    const threshold = window.innerWidth * 0.25;

    if (Math.abs(deltaX) > threshold && !practice.processingNext) {
      e.preventDefault();
      e.stopPropagation();

      // Animate card flying off screen
      const direction = deltaX > 0 ? 1 : -1;
      const flyOffDistance = window.innerWidth * 1.5;
      setSwipeOffset(direction * flyOffDistance);

      // Wait for animation to complete, then process next question
      setTimeout(() => {
        if (deltaX > 0) {
          // Swipe right = correct
          handleNextWrapper(true);
        } else {
          // Swipe left = wrong
          handleNextWrapper(false);
        }
        // Don't reset here - the next question will render with offset 0 naturally
      }, 300); // Match CSS transition duration
    } else {
      // Didn't meet threshold, snap back
      setSwipeOffset(0);
    }

    isSwiping.current = false;
  };

  // Convert markdown to HTML for current question (cached with useMemo)
  // Must be before early return to follow React hooks rules
  const currentQuestion = practice.questions[practice.currentQuestionIndex];
  const convertedQuestionText = useMemo(
    () => convertMarkdownToHTML(currentQuestion?.question_text),
    [currentQuestion?.question_text]
  );
  const convertedAnswerText = useMemo(
    () => convertMarkdownToHTML(currentQuestion?.answer_text),
    [currentQuestion?.answer_text]
  );

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
          {/* FIX #9: Responsive set name - ellipsis on mobile, normal on desktop */}
          <div style={{
            fontWeight: 'bold', 
            color: '#333', 
            fontSize: '18px', 
            marginBottom: '5px', 
            paddingLeft: '40px', 
            paddingRight: '40px'
          }} className="set-name-header">
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
            ⌨️ Space: Flip | ↑/→: Got it | ↓: Missed it | ←: Prev (Q) | →: Next (Q) | Esc: Back
          </div>
        </div>
      </div>

      <div
        className={`flashcard ${practice.isFlipped ? 'flipped' : ''}`}
        style={{
          transform: practice.isFlipped && swipeOffset !== 0
            ? `translate3d(${swipeOffset}px, 0, 0) rotate(${swipeOffset * 0.05}deg)`
            : undefined,
          transition: isSwiping.current ? 'none' : undefined, // Disable transition during active swipe
        }}
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

        {/* Swipe direction indicators - move opposite to card */}
        {practice.isFlipped && Math.abs(swipeOffset) > 20 && (
          <>
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: `translate3d(${swipeOffset < 0 ? Math.abs(swipeOffset) * 0.3 : 0}px, -50%, 0)`,
              fontSize: '48px',
              opacity: swipeOffset < 0 ? Math.min(Math.abs(swipeOffset) / 100, 0.7) : 0,
              transition: isSwiping.current ? 'opacity 0.1s' : 'all 0.3s ease',
              pointerEvents: 'none',
              zIndex: 5
            }}>
              ❌
            </div>
            <div style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: `translate3d(${swipeOffset > 0 ? -(swipeOffset * 0.3) : 0}px, -50%, 0)`,
              fontSize: '48px',
              opacity: swipeOffset > 0 ? Math.min(swipeOffset / 100, 0.7) : 0,
              transition: isSwiping.current ? 'opacity 0.1s' : 'all 0.3s ease',
              pointerEvents: 'none',
              zIndex: 5
            }}>
              ✅
            </div>
          </>
        )}

        {/* Bookmark Icon */}
        <div
          onClick={(e) => {
            handleBookmarkWrapper(e);
            // FIX #29: Minimal visual feedback - brief scale pulse
            setBookmarkPulse(true);
            setTimeout(() => setBookmarkPulse(false), 200);
          }}
          className={bookmarkPulse ? 'bookmark-pulse' : ''}
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
            <div className="question-text" dangerouslySetInnerHTML={{ __html: convertedQuestionText }} />
            
            {/* Image with click-to-expand */}
            {practice.questions[practice.currentQuestionIndex].image_url && (() => {
              const originalUrl = practice.questions[practice.currentQuestionIndex].image_url;
              const safeUrl = getSafeImageUrl(originalUrl);

              return safeUrl ? (
                <>
                  {imageError ? (
                    <div style={{
                      padding: '16px',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      margin: '16px 0'
                    }}>
                      ⚠️ Image unavailable in secure mode
                      <div style={{fontSize: '12px', marginTop: '8px'}}>
                        <a
                          href={originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{color: '#667eea'}}
                        >
                          View image in new tab
                        </a>
                      </div>
                    </div>
                  ) : (
                    <img
                      key={`q-${practice.currentQuestionIndex}-${safeUrl}`}
                      src={safeUrl}
                      alt="Q"
                      className="question-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        practice.setEnlargedImage(safeUrl);
                      }}
                      onError={() => {
                        setImageError(true);
                      }}
                    />
                  )}
                </>
              ) : null;
            })()}

            <div className="flip-hint">Click to reveal answer</div>
          </>
        ) : (
          <>
            <div className="answer-text" dangerouslySetInnerHTML={{ __html: convertedAnswerText }} />
            <div className="flip-hint">Click to see question</div>

            {/* Mobile swipe instructions - only on first question */}
            {practice.currentQuestionIndex === 0 && (
              <div className="mobile-only" style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.9)',
                marginTop: '20px',
                fontWeight: '500',
                textAlign: 'center'
              }}>
                Swipe Right = Got it ✅ · Left = Missed it ❌
              </div>
            )}
          </>
        )}

        {/* Text-to-Speech Button - positioned at bottom of card */}
        <div
          onClick={practice.speakText}
          className="speaker-button"
          style={{
            position: 'absolute',
            bottom: '35px', // FIX #15: Increased from 20px to avoid swipe gesture conflicts
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
              {practice.processingNext ? '...' : 'Next →'}
            </button>
          </>
        ) : (
          <>
            <button
              className="btn btn-warning"
              onClick={() => handleNextWrapper(false)}
              disabled={practice.processingNext}
              style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
            >
              {practice.processingNext ? '...' : '✗ Missed it'}
            </button>
            <button
              className="btn btn-success"
              onClick={() => handleNextWrapper(true)}
              disabled={practice.processingNext}
              style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
            >
              {practice.processingNext ? '...' : '✓ Got it'}
            </button>
          </>
        )}
      </div>

      {/* Image Modal/Lightbox */}
      {practice.enlargedImage && (
        <div className="image-modal" onClick={() => practice.setEnlargedImage(null)}>
          <img 
            key={`enlarged-${practice.currentQuestionIndex}-${practice.enlargedImage}`}
            src={practice.enlargedImage} 
            alt="Enlarged view" 
            onClick={(e) => e.stopPropagation()} 
          />
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

      {/* Swipe Tutorial Overlay - First time only */}
      {showTutorial && practice.isFlipped && (
        <div 
          className="mobile-only" 
          onClick={() => {
            // FIX #5: Set localStorage when user taps to dismiss tutorial
            // Previously only set on auto-dismiss timeout, not on manual dismiss
            setShowTutorial(false);
            localStorage.setItem('hasSeenSwipeTutorial', 'true');
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            cursor: 'pointer'
          }}>
          <div style={{
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '30px',
            textAlign: 'center'
          }}>
            Swipe to Answer
          </div>

          <div style={{
            fontSize: '80px',
            marginBottom: '20px'
          }}>
            👆
          </div>

          <div style={{
            display: 'flex',
            gap: '40px',
            marginBottom: '30px'
          }}>
            <div style={{
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>👈</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>Swipe Left</div>
              <div style={{ fontSize: '32px', marginTop: '5px' }}>❌ Missed it</div>
            </div>
            <div style={{
              textAlign: 'center',
              color: 'white'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>👉</div>
              <div style={{ fontSize: '18px', fontWeight: '600' }}>Swipe Right</div>
              <div style={{ fontSize: '32px', marginTop: '5px' }}>✅ Got it</div>
            </div>
          </div>

          <div style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: '14px',
            textAlign: 'center',
            marginTop: '20px'
          }}>
            Touch anywhere to start
          </div>
        </div>
      )}

      {/* Session Summary Modal */}
      {practice.showSessionSummary && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            position: 'relative'
          }}>
            {/* FIX #12: Close button to allow reviewing last card */}
            <button
              onClick={() => practice.setShowSessionSummary(false)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
              onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
              title="Close and review last card"
            >
              ✕
            </button>

            {/* Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: '25px'
            }}>
              <div style={{
                fontSize: '32px',
                marginBottom: '10px'
              }}>
                🎉
              </div>
              <h2 style={{
                margin: '0 0 5px 0',
                color: '#1a1a1a',
                fontSize: '24px'
              }}>
                Session Complete!
              </h2>
              <p style={{
                margin: 0,
                color: '#666',
                fontSize: '14px'
              }}>
                {practice.currentSet.name}
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '15px',
              marginBottom: '25px'
            }}>
              {/* Got it */}
              <div style={{
                textAlign: 'center',
                padding: '15px',
                background: '#f0fdf4',
                borderRadius: '10px',
                border: '2px solid #86efac'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#16a34a',
                  marginBottom: '5px'
                }}>
                  {practice.sessionStats.correct}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#16a34a',
                  fontWeight: '600'
                }}>
                  Got it
                </div>
              </div>

              {/* Missed it */}
              <div style={{
                textAlign: 'center',
                padding: '15px',
                background: '#fef2f2',
                borderRadius: '10px',
                border: '2px solid #fca5a5'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#dc2626',
                  marginBottom: '5px'
                }}>
                  {practice.sessionStats.wrong}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#dc2626',
                  fontWeight: '600'
                }}>
                  Missed it
                </div>
              </div>

              {/* Skipped */}
              <div style={{
                textAlign: 'center',
                padding: '15px',
                background: '#f5f5f5',
                borderRadius: '10px',
                border: '2px solid #d4d4d4'
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#737373',
                  marginBottom: '5px'
                }}>
                  {practice.questions.length - practice.sessionStats.correct - practice.sessionStats.wrong}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#737373',
                  fontWeight: '600'
                }}>
                  Skipped
                </div>
              </div>
            </div>

            {/* Score */}
            <div style={{
              textAlign: 'center',
              padding: '15px',
              background: '#f8f9fa',
              borderRadius: '10px',
              marginBottom: '25px'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '5px'
              }}>
                Score
              </div>
              <div style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: (() => {
                  const percentage = (practice.sessionStats.correct / practice.questions.length) * 100;
                  return percentage > 75 ? '#16a34a' : percentage >= 25 ? '#f59e0b' : '#dc2626';
                })()
              }}>
                {practice.sessionStats.correct}/{practice.questions.length}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <button
                onClick={() => {
                  practice.setShowSessionSummary(false);
                  if (practice.currentSet.id !== 'mixed') {
                    startPracticeWrapper(practice.currentSet);
                  } else {
                    const filter = practice.currentSet.name.match(/\((.*?)\)/)?.[1] || 'all';
                    startMixedPracticeWrapper(filter);
                  }
                }}
                style={{
                  padding: '14px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Practice Again
              </button>

              {practice.sessionMissedCount > 0 && (
                <button
                  onClick={() => {
                    practice.reviewSessionMisses();
                  }}
                  style={{
                    padding: '14px',
                    background: '#f87171',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Review Misses ({practice.sessionMissedCount})
                </button>
              )}

              <button
                onClick={() => {
                  practice.setShowSessionSummary(false);
                  setView('home');
                }}
                style={{
                  padding: '14px',
                  background: 'white',
                  color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default PracticeView;
