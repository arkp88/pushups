import React from 'react';

function SwipeTutorialOverlay({ show, onDismiss }) {
  if (!show) return null;

  return (
    <div
      className="mobile-only"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
        cursor: 'pointer'
      }}
    >

      <div style={{
        display: 'flex',
        gap: '40px',
        marginBottom: '30px'
      }}>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>👈</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Swipe Left</div>
          <div style={{ fontSize: '32px', marginTop: '5px' }}>❌ Missed it</div>
        </div>
        <div style={{
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '10px' }}>👉</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Swipe Right</div>
          <div style={{ fontSize: '32px', marginTop: '5px' }}>✅ Got it</div>
        </div>
      </div>

      <div style={{
        color: 'rgba(255,255,255,0.9)',
        fontSize: '15px',
        textAlign: 'center',
        marginBottom: '15px',
        fontWeight: '500'
      }}>
        Swipe works on both question & answer sides once you've seen the answer.
      </div>

      <div style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        Touch anywhere to start
      </div>
    </div>
  );
}

export default SwipeTutorialOverlay;
