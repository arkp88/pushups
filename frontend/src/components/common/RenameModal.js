import React from 'react';
import './RenameModal.css';

/**
 * Modal for renaming a question set
 * @param {Object} props
 * @param {Object} props.set - The set being renamed (null if modal closed)
 * @param {string} props.value - Current rename input value
 * @param {Function} props.onChange - Callback when input changes
 * @param {Function} props.onSave - Callback to save the rename
 * @param {Function} props.onClose - Callback to close the modal
 * @param {boolean} props.isLoading - Whether rename is in progress
 */
function RenameModal({ set, value, onChange, onSave, onClose, isLoading }) {
  if (!set) return null;

  const handleBackdropClick = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim() && value.trim() !== set.name && !isLoading) {
      onSave();
    } else if (e.key === 'Escape' && !isLoading) {
      onClose();
    }
  };

  return (
    <div className="rename-modal-backdrop" onClick={handleBackdropClick}>
      <div className="rename-modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="rename-modal-title">Rename Set</h3>

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="rename-modal-input"
          disabled={isLoading}
        />

        <div className="rename-modal-actions">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={!value.trim() || value.trim() === set.name || isLoading}
          >
            {isLoading ? 'Renaming...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RenameModal;
