import React from 'react';
import { Barbell } from '@phosphor-icons/react';
import './LoadingState.css';

function LoadingState({ message = "Loading...", icon }) {
  return (
    <div className="loading-state">
      <div className="loading-state-icon">
        {icon || <Barbell size={64} weight="bold" />}
      </div>
      <div className="loading-state-message">
        {message}
      </div>
    </div>
  );
}

export default LoadingState;
