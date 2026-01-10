import React from 'react';

function SessionSummaryModal({
  practice,
  startPracticeWrapper,
  startMixedPracticeWrapper,
  setView
}) {
  if (!practice.showSessionSummary) return null;

  const totalAnswered = practice.sessionStats.correct + practice.sessionStats.wrong;
  const skipped = practice.questions.length - totalAnswered;
  const percentage = totalAnswered > 0 ? (practice.sessionStats.correct / practice.questions.length) * 100 : 0;
  const scoreColor = percentage > 75 ? '#16a34a' : percentage >= 25 ? '#f59e0b' : '#dc2626';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '15px',
        padding: '30px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={() => practice.setShowSessionSummary(false)}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            fontSize: '18px',
            cursor: 'pointer',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#e5e7eb'}
          onMouseLeave={(e) => e.target.style.background = '#f3f4f6'}
          title="Close and review last card"
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎉</div>
          <h2 style={{ margin: '0 0 5px 0', color: '#1a1a1a', fontSize: '24px' }}>
            Session Complete!
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
            {practice.currentSet.name}
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '15px',
          marginBottom: '25px'
        }}>
          {/* Got it */}
          <div style={{
            textAlign: 'center',
            padding: '15px',
            background: '#f0fdf4',
            borderRadius: '10px',
            border: '2px solid #86efac'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#16a34a',
              marginBottom: '5px'
            }}>
              {practice.sessionStats.correct}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#16a34a',
              fontWeight: '600'
            }}>
              Got it
            </div>
          </div>

          {/* Missed it */}
          <div style={{
            textAlign: 'center',
            padding: '15px',
            background: '#fef2f2',
            borderRadius: '10px',
            border: '2px solid #fca5a5'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#dc2626',
              marginBottom: '5px'
            }}>
              {practice.sessionStats.wrong}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#dc2626',
              fontWeight: '600'
            }}>
              Missed it
            </div>
          </div>

          {/* Skipped */}
          <div style={{
            textAlign: 'center',
            padding: '15px',
            background: '#f5f5f5',
            borderRadius: '10px',
            border: '2px solid #d4d4d4'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#737373',
              marginBottom: '5px'
            }}>
              {skipped}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#737373',
              fontWeight: '600'
            }}>
              Skipped
            </div>
          </div>
        </div>

        {/* Score */}
        <div style={{
          textAlign: 'center',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '10px',
          marginBottom: '25px'
        }}>
          <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
            Score
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: scoreColor
          }}>
            {practice.sessionStats.correct}/{practice.questions.length}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <button
            onClick={() => {
              practice.setShowSessionSummary(false);
              if (practice.currentSet.id !== 'mixed') {
                startPracticeWrapper(practice.currentSet);
              } else {
                const filter = practice.currentSet.name.match(/\((.*?)\)/)?.[1] || 'all';
                startMixedPracticeWrapper(filter);
              }
            }}
            style={{
              padding: '14px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Practice Again
          </button>

          {practice.sessionMissedCount > 0 && (
            <button
              onClick={() => {
                practice.reviewSessionMisses();
              }}
              style={{
                padding: '14px',
                background: '#f87171',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Review Misses ({practice.sessionMissedCount})
            </button>
          )}

          <button
            onClick={() => {
              practice.setShowSessionSummary(false);
              setView('home');
            }}
            style={{
              padding: '14px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionSummaryModal;
