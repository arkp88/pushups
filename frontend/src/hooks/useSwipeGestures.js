import { useRef, useState, useEffect } from 'react';
import { STORAGE_KEYS } from '../constants';

function useSwipeGestures(practice, handleNextWrapper, showTutorial, setShowTutorial) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const hasSeenAnswer = useRef(false); // Track if user has flipped this card

  // Reset swipe offset and hasSeenAnswer when question changes
  useEffect(() => {
    setSwipeOffset(0);
    hasSeenAnswer.current = false; // Reset for new question
    return () => {
      setSwipeOffset(0);
    };
  }, [practice.currentQuestionIndex]);

  const handleTouchStart = (e) => {
    // Track if user has seen the answer for this card
    if (practice.isFlipped) {
      hasSeenAnswer.current = true;
    }

    // Allow swipes only after user has seen the answer (both sides)
    if (!hasSeenAnswer.current) return;

    // FIX #5: Dismiss tutorial on first touch AND set localStorage immediately
    if (showTutorial) {
      setShowTutorial(false);
      localStorage.setItem(STORAGE_KEYS.SEEN_SWIPE_TUTORIAL, 'true');
    }

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  };

  const handleTouchMove = (e) => {
    // Allow swipes only after seeing the answer
    if (!hasSeenAnswer.current) return;

    const currentX = e.touches[0].clientX;
    const deltaX = currentX - touchStartX.current;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);

    // Increase threshold to 15px to reduce accidental triggers
    // If horizontal movement is greater than vertical, it's a swipe
    if (Math.abs(deltaX) > 15 && Math.abs(deltaX) > deltaY) {
      // Prevent default scrolling behavior when swiping horizontally
      e.preventDefault();
      isSwiping.current = true;
      // Update card position in real-time
      setSwipeOffset(deltaX);
    }
  };

  const handleTouchEnd = (e) => {
    // If user hasn't seen answer yet, reset
    if (!hasSeenAnswer.current) {
      setSwipeOffset(0);
      return;
    }

    // If not swiping, just reset
    if (!isSwiping.current) {
      isSwiping.current = false;
      setSwipeOffset(0);
      return;
    }

    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX.current;
    // Responsive threshold - 30% of screen width (less sensitive, requires more drag)
    const threshold = window.innerWidth * 0.30;

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
      }, 300); // Match CSS transition duration

      // Set swiping to false after a delay to allow animation
      setTimeout(() => {
        isSwiping.current = false;
      }, 50);
    } else {
      // User released mid-swipe - snap back smoothly
      // First stop swiping to enable transition
      isSwiping.current = false;
      // Then reset position (will animate smoothly)
      setSwipeOffset(0);
    }
  };

  return {
    swipeOffset,
    isSwiping: isSwiping.current,
    hasSeenAnswer: hasSeenAnswer.current,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}

export default useSwipeGestures;
