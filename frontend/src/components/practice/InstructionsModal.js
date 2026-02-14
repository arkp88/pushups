import React from 'react';

function InstructionsModal({ instructions, onClose }) {
  if (!instructions || instructions.length === 0) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)',
          border: '3px solid #000',
          borderRadius: '0',
          padding: '24px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '6px 6px 0 #000',
          position: 'relative'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--text-heading)', fontSize: '20px' }}>
            📋 Instructions
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-heading)',
              padding: '0 8px'
            }}
            aria-label="Close instructions"
          >
            ✕
          </button>
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '24px',
          color: 'var(--text-body)',
          lineHeight: '1.8',
          fontSize: '16px'
        }}>
          {instructions.map((instruction, idx) => (
            <li key={idx} style={{ marginBottom: '10px' }}>
              <span dangerouslySetInnerHTML={{
                __html: instruction
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/__(.+?)__/g, '<em>$1</em>')
              }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default InstructionsModal;
