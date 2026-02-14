import React from 'react';
import PropTypes from 'prop-types';
import { FileText, Folder, Check } from '@phosphor-icons/react';

function MultiFileReviewCard({
  pendingUpload,
  recursiveFiles,
  uploadTags,
  setUploadTags,
  uploading,
  uploadError,
  onCancel,
  onConfirm,
  selectAllFiles,
  deselectAllFiles,
  toggleFileSelection
}) {
  const hasRecursiveFiles = recursiveFiles.length > 0;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      padding: '25px',
      borderRadius: '0',
      border: '3px solid #000',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h3 style={{marginTop: 0, color: 'var(--text-heading)', marginBottom: '15px'}}>
        📝 Review Multi-File Import
      </h3>

      {uploadError && (
        <div style={{
          padding: '10px',
          background: 'var(--color-danger)',
          color: '#fff',
          border: '3px solid #000',
          borderRadius: '0',
          marginBottom: '15px',
          fontSize: '14px'
        }}>
          ⚠️ {uploadError}
        </div>
      )}

      <div style={{
        padding: '12px',
        background: 'var(--color-primary)',
        borderRadius: '0',
        marginBottom: '15px',
        border: '3px solid #000'
      }}>
        <p style={{margin: 0, color: '#000', fontSize: '14px'}}>
          Ready to import <strong>{pendingUpload.data.length} files</strong> from Google Drive
        </p>
      </div>

      {pendingUpload.data.length > 10 && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--color-warning)',
          borderRadius: '0',
          marginBottom: '15px',
          border: '3px solid #000'
        }}>
          <p style={{margin: 0, color: '#000', fontSize: '13px', lineHeight: '1.5'}}>
            ⚠️ <strong>Large import:</strong> This will import {pendingUpload.data.length} files sequentially.
            Estimated time: ~{Math.ceil(pendingUpload.data.length * 2 / 60)} minute{Math.ceil(pendingUpload.data.length * 2 / 60) > 1 ? 's' : ''}.
            Please keep this tab open and don't refresh.
          </p>
        </div>
      )}

      <div style={{flex: '1 1 auto', overflow: 'auto', marginBottom: '20px', minHeight: 0}}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <p style={{fontWeight: '600', margin: 0, color: '#555'}}>
            Files to import ({pendingUpload.data.length} selected):
          </p>
          {hasRecursiveFiles && (
            <div style={{display: 'flex', gap: '8px'}}>
              <button
                onClick={selectAllFiles}
                disabled={uploading}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  background: '#000',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Check size={16} style={{marginRight: '4px'}} /> Select All
              </button>
              <button
                onClick={deselectAllFiles}
                disabled={uploading}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                ✕ Deselect All
              </button>
            </div>
          )}
        </div>

        <div style={{
          border: '3px solid #000',
          borderRadius: '0',
          padding: '10px',
          background: 'var(--bg-tertiary)'
        }}>
          {hasRecursiveFiles ? (
            recursiveFiles.map((file, idx) => {
              const isSelected = pendingUpload.data.some(f => f.id === file.id);
              return (
                <div
                  key={idx}
                  onClick={() => !uploading && toggleFileSelection(file.id)}
                  style={{
                    padding: '6px 0',
                    borderBottom: idx < recursiveFiles.length - 1 ? '1px solid var(--border-medium)' : 'none',
                    fontSize: '13px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    opacity: isSelected ? 1 : 0.5,
                    transition: 'opacity 0.15s ease'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    disabled={uploading}
                    style={{
                      marginTop: '2px',
                      width: '16px',
                      height: '16px',
                      flexShrink: 0,
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      accentColor: '#000'
                    }}
                  />
                  <div style={{flex: 1}}>
                    <div style={{
                      fontWeight: '500',
                      color: 'var(--text-heading)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <FileText size={16} /> {file.name}
                    </div>
                    {file.path && (
                      <div style={{
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        marginLeft: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Folder size={14} /> {file.path}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            pendingUpload.data.map((file, idx) => (
              <div key={idx} style={{
                padding: '6px 0',
                borderBottom: idx < pendingUpload.data.length - 1 ? '1px solid var(--border-medium)' : 'none',
                fontSize: '13px'
              }}>
                <div style={{
                  fontWeight: '500',
                  color: 'var(--text-heading)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <FileText size={16} /> {file.name}
                </div>
                {file.path && (
                  <div style={{
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    marginLeft: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Folder size={14} /> {file.path}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{flex: '0 0 auto'}}>
        <div style={{marginBottom: '20px'}}>
          <label style={{
            display: 'block',
            marginBottom: '5px',
            fontWeight: '500',
            color: 'var(--text-body)'
          }}>
            Tags (optional)
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
              border: '1px solid var(--border-medium)',
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
            disabled={uploading || pendingUpload.data.length === 0}
            style={{minWidth: '120px'}}
          >
            {uploading
              ? 'Processing...'
              : pendingUpload.data.length === 0
                ? 'Select at least 1 file'
                : `Import ${pendingUpload.data.length} File${pendingUpload.data.length > 1 ? 's' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  );
}

MultiFileReviewCard.propTypes = {
  pendingUpload: PropTypes.shape({
    type: PropTypes.string.isRequired,
    data: PropTypes.array.isRequired
  }).isRequired,
  recursiveFiles: PropTypes.array.isRequired,
  uploadTags: PropTypes.string.isRequired,
  setUploadTags: PropTypes.func.isRequired,
  uploading: PropTypes.bool.isRequired,
  uploadError: PropTypes.string,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  selectAllFiles: PropTypes.func.isRequired,
  deselectAllFiles: PropTypes.func.isRequired,
  toggleFileSelection: PropTypes.func.isRequired
};

export default MultiFileReviewCard;
