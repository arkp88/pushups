import { useEffect } from 'react';

function useKeyboardShortcuts(practice, handleNextWrapper, setView) {
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
}

export default useKeyboardShortcuts;
