import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';

function FlashcardControls({ practice, handleNextWrapper }) {
  if (!practice.isFlipped) {
    return (
      <>
        <button
          className="btn btn-secondary"
          onClick={practice.handlePrevious}
          disabled={practice.currentQuestionIndex === 0 || practice.processingNext}
        >
          <ChevronLeft size={18} />
          Prev
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleNextWrapper(null)}
          disabled={practice.processingNext}
          style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
        >
          {practice.processingNext ? '...' : (
            <>
              Next
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </>
    );
  }

  return (
    <>
      <button
        className="btn btn-warning"
        onClick={() => handleNextWrapper(false)}
        disabled={practice.processingNext}
        style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
      >
        {practice.processingNext ? '...' : (
          <>
            <X size={18} />
            Missed it
          </>
        )}
      </button>
      <button
        className="btn btn-success"
        onClick={() => handleNextWrapper(true)}
        disabled={practice.processingNext}
        style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
      >
        {practice.processingNext ? '...' : (
          <>
            <Check size={18} />
            Got it
          </>
        )}
      </button>
    </>
  );
}

export default FlashcardControls;
