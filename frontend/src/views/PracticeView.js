import { useEffect, useRef, useState, useCallback } from 'react';
import {
  FlashcardHeader,
  InstructionsModal,
  Flashcard,
  FlashcardControls,
  SessionSummaryModal,
  SwipeTutorialOverlay,
  ImageModal
} from '../components/practice';
import { useKeyboardShortcuts, useSwipeGestures } from '../hooks';
import { STORAGE_KEYS } from '../constants';

function PracticeView({
  practice,
  startPracticeWrapper,
  startMixedPracticeWrapper,
  handleNextWrapper,
  handleBookmarkWrapper,
  setView
}) {
  const [showTutorial, setShowTutorial] = useState(false);
  const tutorialTimeoutRef = useRef(null);
  const [imageError, setImageError] = useState(false);
  const [cardTransition, setCardTransition] = useState(null); // 'exiting' | 'entering' | null

  // Custom hooks - swipe uses raw handler (has its own fly-off animation)
  const swipeGesture = useSwipeGestures(practice, handleNextWrapper, showTutorial, setShowTutorial);

  // Wrap handleNextWrapper with card transition for buttons/keyboard
  const handleNextWithTransition = useCallback(async (markAsCorrect = null) => {
    setCardTransition('exiting');
    await new Promise(resolve => setTimeout(resolve, 150));
    await handleNextWrapper(markAsCorrect);
    setCardTransition('entering');
    setTimeout(() => setCardTransition(null), 200);
  }, [handleNextWrapper]);

  useKeyboardShortcuts(practice, handleNextWithTransition, setView);

  // FIX #4: Clean up image error state when question changes
  useEffect(() => {
    setImageError(false);
  }, [practice.currentQuestionIndex]);

  // Tutorial effect - show on first flip to answer
  useEffect(() => {
    if (practice.isFlipped && practice.questions.length > 0) {
      const hasSeenTutorial = localStorage.getItem(STORAGE_KEYS.SEEN_SWIPE_TUTORIAL);
      if (!hasSeenTutorial) {
        // Show tutorial after a brief delay
        tutorialTimeoutRef.current = setTimeout(() => {
          setShowTutorial(true);
          // Auto-dismiss after 7 seconds
          setTimeout(() => {
            setShowTutorial(false);
            localStorage.setItem(STORAGE_KEYS.SEEN_SWIPE_TUTORIAL, 'true');
          }, 7000);
        }, 500);
      }
    }
    return () => {
      if (tutorialTimeoutRef.current) {
        clearTimeout(tutorialTimeoutRef.current);
      }
    };
  }, [practice.isFlipped, practice.questions.length]);

  const handleTutorialDismiss = () => {
    setShowTutorial(false);
    localStorage.setItem(STORAGE_KEYS.SEEN_SWIPE_TUTORIAL, 'true');
  };

  if (practice.questions.length === 0) return null;

  return (
    <div className="flashcard-container view-enter">
      {/* Notification Banner */}
      {practice.practiceNotification && (
        <div className="notification-banner">
          ℹ️ {practice.practiceNotification}
        </div>
      )}

      <FlashcardHeader practice={practice} setView={setView} />

      <InstructionsModal
        instructions={practice.setInstructions.length > 0 && practice.showInstructions ? practice.setInstructions : null}
        onClose={() => practice.toggleInstructions()}
      />

      {/* Card stack container */}
      <div style={{ position: 'relative' }}>
        {/* Next card preview (behind current card) - only visible during swipe */}
        {practice.currentQuestionIndex < practice.questions.length - 1 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '0',
            right: '0',
            zIndex: 0,
            transform: Math.abs(swipeGesture.swipeOffset) > 20 ? 'scale(0.95)' : 'scale(0.9)',
            opacity: Math.abs(swipeGesture.swipeOffset) > 20 ? Math.min(Math.abs(swipeGesture.swipeOffset) / 150, 0.6) : 0,
            pointerEvents: 'none',
            transition: swipeGesture.isSwiping ? 'transform 0.2s ease' : 'all 0.3s ease'
          }}>
            <Flashcard
              practice={{
                ...practice,
                currentQuestionIndex: practice.currentQuestionIndex + 1,
                isFlipped: false
              }}
              imageError={false}
              setImageError={() => {}}
              swipeOffset={0}
              isSwiping={false}
              hasSeenAnswer={false}
              onTouchStart={() => {}}
              onTouchMove={() => {}}
              onTouchEnd={() => {}}
              handleBookmarkWrapper={() => {}}
            />
          </div>
        )}

        {/* Current card (on top) */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Flashcard
            practice={practice}
            imageError={imageError}
            setImageError={setImageError}
            swipeOffset={swipeGesture.swipeOffset}
            isSwiping={swipeGesture.isSwiping}
            hasSeenAnswer={swipeGesture.hasSeenAnswer}
            onTouchStart={swipeGesture.handleTouchStart}
            onTouchMove={swipeGesture.handleTouchMove}
            onTouchEnd={swipeGesture.handleTouchEnd}
            handleBookmarkWrapper={handleBookmarkWrapper}
            cardTransition={cardTransition}
          />
        </div>
      </div>

      <div className="flashcard-controls">
        <FlashcardControls practice={practice} handleNextWrapper={handleNextWithTransition} />
      </div>

      <ImageModal
        imageUrl={practice.enlargedImage}
        onClose={() => practice.setEnlargedImage(null)}
        currentQuestionIndex={practice.currentQuestionIndex}
      />

      <SwipeTutorialOverlay
        show={showTutorial && practice.isFlipped}
        onDismiss={handleTutorialDismiss}
      />

      <SessionSummaryModal
        practice={practice}
        startPracticeWrapper={startPracticeWrapper}
        startMixedPracticeWrapper={startMixedPracticeWrapper}
        setView={setView}
      />
    </div>
  );
}

export default PracticeView;
