function FlashcardControls({ practice, handleNextWrapper }) {
  if (!practice.isFlipped) {
    return (
      <>
        <button
          className="btn btn-secondary"
          onClick={practice.handlePrevious}
          disabled={practice.currentQuestionIndex === 0 || practice.processingNext}
        >
          ← Prev
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
  );
}

export default FlashcardControls;
