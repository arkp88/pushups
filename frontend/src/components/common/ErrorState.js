import React from 'react';
import './ErrorState.css';

/**
 * Full-page error state with retry button
 * @param {Object} props
 * @param {string} [props.title="Failed to connect to server"] - Error title
 * @param {string} [props.message] - Detailed error message
 * @param {Function} [props.onRetry] - Callback when retry button is clicked
 * @param {string} [props.retryLabel="Retry Connection"] - Retry button label
 */
function ErrorState({
  title = "Failed to connect to server",
  message,
  onRetry,
  retryLabel = "Retry Connection"
}) {
  return (
    <div className="error-state">
      <div className="error-state-icon">⚠️</div>
      <div className="error-state-title">{title}</div>
      {message && (
        <div className="error-state-message">{message}</div>
      )}
      {onRetry && (
        <button className="btn btn-primary error-state-retry" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorState;
