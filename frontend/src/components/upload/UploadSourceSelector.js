import React from 'react';
import PropTypes from 'prop-types';
import { HardDrives } from '@phosphor-icons/react';

function UploadSourceSelector({ uploadMode, onModeChange }) {
  return (
    <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
      <button
        className={`btn ${uploadMode === 'local' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onModeChange('local')}
      >
        <HardDrives size={18} weight="bold" style={{marginRight: '6px'}} />
        From Your Device
      </button>
      <button
        className={`btn ${uploadMode === 'drive' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => onModeChange('drive')}
      >
        ☁️ From B612 Friendlies Drive
      </button>
    </div>
  );
}

UploadSourceSelector.propTypes = {
  uploadMode: PropTypes.oneOf(['local', 'drive']).isRequired,
  onModeChange: PropTypes.func.isRequired
};

export default UploadSourceSelector;
