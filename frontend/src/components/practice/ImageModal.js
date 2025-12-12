import React from 'react';

function ImageModal({ imageUrl, onClose, currentQuestionIndex }) {
  if (!imageUrl) return null;

  return (
    <div className="image-modal" onClick={onClose}>
      <img
        key={`enlarged-${currentQuestionIndex}-${imageUrl}`}
        src={imageUrl}
        alt="Enlarged view"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          fontSize: '20px',
          cursor: 'pointer'
        }}
        onClick={onClose}
      >
        ✕
      </button>
    </div>
  );
}

export default ImageModal;
