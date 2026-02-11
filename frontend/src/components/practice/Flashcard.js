import { useState, useMemo } from 'react';
import { getSafeImageUrl, convertMarkdownToHTML } from '../../lib/utils';
import { Star, Volume2, VolumeX, X as XIcon, Check } from 'lucide-react';

function Flashcard({
  practice,
  imageError,
  setImageError,
  swipeOffset,
  isSwiping,
  hasSeenAnswer,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  handleBookmarkWrapper,
  cardTransition
}) {
  const [bookmarkPulse, setBookmarkPulse] = useState(false);

  const currentQuestion = practice.questions[practice.currentQuestionIndex];

  // Convert markdown to HTML for current question (cached with useMemo)
  const convertedQuestionText = useMemo(
    () => convertMarkdownToHTML(currentQuestion?.question_text),
    [currentQuestion?.question_text]
  );
  const convertedAnswerText = useMemo(
    () => convertMarkdownToHTML(currentQuestion?.answer_text),
    [currentQuestion?.answer_text]
  );

  return (
    <div
      className={`flashcard ${practice.isFlipped ? 'flipped' : ''}${cardTransition === 'exiting' ? ' card-exiting' : ''}${cardTransition === 'entering' ? ' card-entering' : ''}`}
      style={{
        transform: hasSeenAnswer && swipeOffset !== 0
          ? `translate3d(${swipeOffset}px, 0, 0) rotate(${swipeOffset * 0.05}deg)`
          : undefined,
        transition: 'none',
      }}
      onClick={(e) => {
        if (!isSwiping) {
          practice.handleFlip();
        }
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe direction indicators */}
      {hasSeenAnswer && Math.abs(swipeOffset) > 20 && (
        <>
          <div style={{
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: `translate3d(${swipeOffset < 0 ? Math.abs(swipeOffset) * 0.3 : 0}px, -50%, 0)`,
            opacity: swipeOffset < 0 ? Math.min(Math.abs(swipeOffset) / 100, 0.7) : 0,
            transition: isSwiping ? 'opacity 0.1s' : 'all 0.3s ease',
            pointerEvents: 'none',
            zIndex: 5
          }}>
            <XIcon size={48} color="#ef4444" strokeWidth={3} />
          </div>
          <div style={{
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: `translate3d(${swipeOffset > 0 ? -(swipeOffset * 0.3) : 0}px, -50%, 0)`,
            opacity: swipeOffset > 0 ? Math.min(swipeOffset / 100, 0.7) : 0,
            transition: isSwiping ? 'opacity 0.1s' : 'all 0.3s ease',
            pointerEvents: 'none',
            zIndex: 5
          }}>
            <Check size={48} color="#22c55e" strokeWidth={3} />
          </div>
        </>
      )}

      {/* Bookmark Icon */}
      <div
        onClick={(e) => {
          handleBookmarkWrapper(e);
          setBookmarkPulse(true);
          setTimeout(() => setBookmarkPulse(false), 200);
        }}
        className={bookmarkPulse ? 'bookmark-pulse' : ''}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          cursor: 'pointer',
          zIndex: 10,
          filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))',
          transition: 'all 0.2s ease'
        }}
        title="Toggle Bookmark"
      >
        <Star
          size={28}
          fill={currentQuestion.is_bookmarked ? '#fbbf24' : 'none'}
          color={currentQuestion.is_bookmarked ? '#fbbf24' : (practice.isFlipped ? 'rgba(255,255,255,0.9)' : '#6b7280')}
          strokeWidth={2}
        />
      </div>

      <div className="round-info">
        {practice.practiceMode === 'mixed'
          ? currentQuestion.set_name
          : `${currentQuestion.round_no} - ${currentQuestion.question_no}`}
      </div>

      {/* Question face */}
      <div className="flashcard-face question-face">
        <div className="question-text" dangerouslySetInnerHTML={{ __html: convertedQuestionText }} />

        {/* Image with click-to-expand */}
        {currentQuestion.image_url && (() => {
          const originalUrl = currentQuestion.image_url;
          const safeUrl = getSafeImageUrl(originalUrl);

          return safeUrl ? (
            <>
              {imageError ? (
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  border: '2px solid var(--border-focus)',
                  borderRadius: '8px',
                  margin: '16px 0',
                  color: 'var(--text-body)'
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
      </div>

      {/* Answer face */}
      <div className="flashcard-face answer-face">
        <div className="answer-text" dangerouslySetInnerHTML={{ __html: convertedAnswerText }} />
        <div className="flip-hint">Click to see question</div>

        {/* Mobile swipe instructions - only on first question */}
        {practice.currentQuestionIndex === 0 && (
          <div className="mobile-only" style={{
            fontSize: '13px',
            color: 'rgba(255,255,255,0.9)',
            marginTop: '20px',
            fontWeight: '500',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <span>Swipe Right = Got it</span>
            <Check size={16} />
            <span>·</span>
            <span>Left = Missed it</span>
            <XIcon size={16} />
          </div>
        )}
      </div>

      {/* Text-to-Speech Button */}
      <div
        onClick={practice.speakText}
        className="speaker-button"
        style={{
          position: 'absolute',
          bottom: '35px',
          left: '20px',
          cursor: 'pointer',
          zIndex: 10,
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
        {practice.isSpeaking ? (
          <Volume2
            size={24}
            color={practice.isFlipped ? '#fff' : '#667eea'}
          />
        ) : (
          <VolumeX
            size={24}
            color={practice.isFlipped ? 'rgba(255, 255, 255, 0.9)' : '#6b7280'}
          />
        )}
      </div>
    </div>
  );
}

export default Flashcard;
