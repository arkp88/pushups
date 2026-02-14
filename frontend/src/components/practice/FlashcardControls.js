import { Check, X, CaretLeft, CaretRight, CircleNotch } from '@phosphor-icons/react';

function FlashcardControls({ practice, handleNextWrapper }) {
  if (!practice.isFlipped) {
    return (
      <>
        <button
          className="btn btn-secondary"
          onClick={practice.handlePrevious}
          disabled={practice.currentQuestionIndex === 0 || practice.processingNext}
        >
          <CaretLeft size={18} weight="bold" />
          Prev
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => handleNextWrapper(null)}
          disabled={practice.processingNext}
          style={{opacity: practice.processingNext ? 0.7 : 1, cursor: practice.processingNext ? 'wait' : 'pointer'}}
        >
          {practice.processingNext ? <CircleNotch size={18} weight="bold" className="spin" /> : (
            <>
              Next
              <CaretRight size={18} weight="bold" />
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
        {practice.processingNext ? <CircleNotch size={18} weight="bold" className="spin" /> : (
          <>
            <X size={18} weight="bold" />
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
        {practice.processingNext ? <CircleNotch size={18} weight="bold" className="spin" /> : (
          <>
            <Check size={18} weight="bold" />
            Got it
          </>
        )}
      </button>
    </>
  );
}

export default FlashcardControls;
