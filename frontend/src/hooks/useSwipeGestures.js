import { useRef, useState, useEffect } from 'react';

function useSwipeGestures(practice, handleNextWrapper, showTutorial, setShowTutorial) {
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Reset swipe offset when question changes
  useEffect(() => {
    setSwipeOffset(0);
    return () => {
      setSwipeOffset(0);
    };
  }, [practice.currentQuestionIndex]);

  const handleTouchStart = (e) => {
    if (!practice.isFlipped) return; // Only allow swipes when card is flipped

    // FIX #5: Dismiss tutorial on first touch AND set localStorage immediately
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
      }, 300); // Match CSS transition duration
    } else {
      // Didn't meet threshold, snap back
      setSwipeOffset(0);
    }

    isSwiping.current = false;
  };

  return {
    swipeOffset,
    isSwiping: isSwiping.current,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}

export default useSwipeGestures;
