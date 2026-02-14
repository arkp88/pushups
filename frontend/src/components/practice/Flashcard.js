import { useState, useMemo } from 'react';
import { getSafeImageUrl, convertMarkdownToHTML } from '../../lib/utils';
import { Star, SpeakerHigh, SpeakerX, X as XIcon, Check } from '@phosphor-icons/react';

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
            <XIcon size={48} weight="bold" color="#ef4444" />
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
            <Check size={48} weight="bold" color="#22c55e" />
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
          transition: 'all 0.15s ease'
        }}
        title="Toggle Bookmark"
      >
        <Star
          size={28}
          weight={currentQuestion.is_bookmarked ? 'fill' : 'regular'}
          color={currentQuestion.is_bookmarked ? '#fbbf24' : (practice.isFlipped ? '#000' : '#6b7280')}
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
        {currentQuestion.image_url?.trim() && (() => {
          const originalUrl = currentQuestion.image_url;
          const safeUrl = getSafeImageUrl(originalUrl);

          return safeUrl ? (
            <>
              {imageError ? (
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-secondary)',
                  border: '3px solid #000',
                  margin: '16px 0',
                  color: 'var(--text-body)'
                }}>
                  ⚠️ Image failed to load
                  <div style={{fontSize: '12px', marginTop: '8px', color: 'var(--text-muted)'}}>
                    The image host may not support HTTPS or the URL is broken.
                  </div>
                  <div style={{fontSize: '12px', marginTop: '8px'}}>
                    <a
                      href={originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{color: 'var(--text-heading)', fontWeight: '700', textDecoration: 'underline'}}
                    >
                      Try opening in new tab →
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

        {/* Mobile swipe instructions */}
        {practice.currentQuestionIndex === 0 && (
          <div className="mobile-only" style={{
            fontSize: '13px',
            color: '#000',
            marginTop: '20px',
            fontWeight: '700',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            <span>Swipe Right = Got it</span>
            <Check size={16} weight="bold" />
            <span>·</span>
            <span>Left = Missed it</span>
            <XIcon size={16} weight="bold" />
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
          transition: 'all 0.15s ease',
          background: practice.isFlipped ? 'rgba(0, 0, 0, 0.15)' : 'var(--bg-tertiary)',
          border: '2px solid #000',
          width: '45px',
          height: '45px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={practice.isSpeaking ? "Stop speaking" : "Read aloud"}
      >
        {practice.isSpeaking ? (
          <SpeakerHigh
            size={24}
            weight="bold"
            color={practice.isFlipped ? '#000' : 'var(--text-heading)'}
          />
        ) : (
          <SpeakerX
            size={24}
            weight="bold"
            color={practice.isFlipped ? 'rgba(0, 0, 0, 0.5)' : '#6b7280'}
          />
        )}
      </div>
    </div>
  );
}

export default Flashcard;
