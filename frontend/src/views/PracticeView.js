import { useEffect, useRef, useState } from 'react';
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

  // Custom hooks
  useKeyboardShortcuts(practice, handleNextWrapper, setView);
  const swipeGesture = useSwipeGestures(practice, handleNextWrapper, showTutorial, setShowTutorial);

  // FIX #4: Clean up image error state when question changes
  useEffect(() => {
    setImageError(false);
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

  const handleTutorialDismiss = () => {
    setShowTutorial(false);
    localStorage.setItem('hasSeenSwipeTutorial', 'true');
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

      <FlashcardHeader practice={practice} setView={setView} />

      <InstructionsModal
        instructions={practice.setInstructions.length > 0 && practice.showInstructions ? practice.setInstructions : null}
        onClose={() => practice.toggleInstructions()}
      />

      <Flashcard
        practice={practice}
        imageError={imageError}
        setImageError={setImageError}
        swipeOffset={swipeGesture.swipeOffset}
        isSwiping={swipeGesture.isSwiping}
        onTouchStart={swipeGesture.handleTouchStart}
        onTouchMove={swipeGesture.handleTouchMove}
        onTouchEnd={swipeGesture.handleTouchEnd}
        handleBookmarkWrapper={handleBookmarkWrapper}
      />

      <div className="flashcard-controls">
        <FlashcardControls practice={practice} handleNextWrapper={handleNextWrapper} />
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
