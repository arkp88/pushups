import React from 'react';
import { Dumbbell } from 'lucide-react';
import './LoadingState.css';

/**
 * Full-page loading state with animated icon
 * @param {Object} props
 * @param {string} [props.message="Loading..."] - Message to display
 * @param {React.ReactNode} [props.icon] - Custom icon (defaults to Dumbbell)
 */
function LoadingState({ message = "Loading...", icon }) {
  return (
    <div className="loading-state">
      <div className="loading-state-icon">
        {icon || <Dumbbell size={64} strokeWidth={2.5} />}
      </div>
      <div className="loading-state-message">
        {message}
      </div>
    </div>
  );
}

export default LoadingState;
