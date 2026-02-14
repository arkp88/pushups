import React from 'react';
import PropTypes from 'prop-types';
import { FileText } from '@phosphor-icons/react';

function FileReviewModal({
  pendingUpload,
  customName,
  setCustomName,
  uploadTags,
  setUploadTags,
  uploading,
  uploadError,
  onCancel,
  onConfirm
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      padding: '25px',
      borderRadius: '0',
      border: '3px solid #000',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h3 style={{marginTop: 0, color: 'var(--text-heading)'}}>📝 Review & Import</h3>

      {uploadError && (
        <div style={{
          padding: '10px',
          background: '#fee2e2',
          color: '#dc2626',
          borderRadius: '0',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          ⚠️ {uploadError}
        </div>
      )}

      <div style={{
        marginBottom: '20px',
        padding: '10px',
        background: 'var(--bg-primary)',
        borderRadius: '0',
        border: '1px solid var(--border-medium)'
      }}>
        <span style={{fontWeight: 'bold', color: 'var(--text-body)'}}>Selected: </span>
        {pendingUpload.type === 'local'
          ? `${pendingUpload.data.length} file(s) from Device`
          : (
            <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <FileText size={16} /> {pendingUpload.data.name} (from Drive)
            </span>
          )}
      </div>

      <div style={{marginBottom: '15px'}}>
        <label style={{
          display: 'block',
          marginBottom: '5px',
          fontWeight: '500',
          color: 'var(--text-body)'
        }}>
          Set Name
        </label>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="e.g. My Quiz Set"
          disabled={uploading}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '0',
            border: '3px solid #000',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-body)'
          }}
        />
      </div>

      <div style={{marginBottom: '20px'}}>
        <label style={{
          display: 'block',
          marginBottom: '5px',
          fontWeight: '500',
          color: 'var(--text-body)'
        }}>
          Tags
        </label>
        <input
          type="text"
          value={uploadTags}
          onChange={(e) => setUploadTags(e.target.value)}
          placeholder="e.g. History, Science"
          disabled={uploading}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '0',
            border: '3px solid #000',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-body)'
          }}
        />
      </div>

      <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
        <button
          className="btn btn-secondary"
          disabled={uploading}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          className="btn btn-primary"
          onClick={onConfirm}
          disabled={uploading}
          style={{minWidth: '120px'}}
        >
          {uploading ? 'Processing...' : 'Confirm Import'}
        </button>
      </div>
    </div>
  );
}

FileReviewModal.propTypes = {
  pendingUpload: PropTypes.shape({
    type: PropTypes.oneOf(['local', 'drive']).isRequired,
    data: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object
    ]).isRequired
  }).isRequired,
  customName: PropTypes.string.isRequired,
  setCustomName: PropTypes.func.isRequired,
  uploadTags: PropTypes.string.isRequired,
  setUploadTags: PropTypes.func.isRequired,
  uploading: PropTypes.bool.isRequired,
  uploadError: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired
};

export default FileReviewModal;
