import React from 'react';
import PropTypes from 'prop-types';

function NotificationBanner({ message, type = 'info', onClose }) {
  const styles = {
    success: {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      color: '#065f46'
    },
    error: {
      bg: '#fee2e2',
      border: '#fca5a5',
      color: '#dc2626'
    },
    warning: {
      bg: '#fef3c7',
      border: '#fcd34d',
      color: '#92400e'
    },
    info: {
      bg: '#f0f9ff',
      border: '#bfdbfe',
      color: '#1e40af'
    }
  };

  const style = styles[type] || styles.info;

  if (!message) return null;

  return (
    <div style={{
      marginBottom: '20px',
      padding: '12px 15px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      color: style.color,
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ whiteSpace: 'pre-line' }}>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background:'none',
            border:'none',
            color: style.color,
            cursor:'pointer',
            fontSize:'18px',
            padding:'0 5px',
            flexShrink: 0
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

NotificationBanner.propTypes = {
  message: PropTypes.string,
  type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  onClose: PropTypes.func
};

export default NotificationBanner;
