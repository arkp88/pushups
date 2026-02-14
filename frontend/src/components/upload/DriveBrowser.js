import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@phosphor-icons/react';
import DriveFileItem from './DriveFileItem';

function DriveBrowser({
  driveFiles,
  drivePath,
  driveSearchTerm,
  driveLoading,
  selectedFiles,
  recursiveLoading,
  driveTopRef,
  onFolderClick,
  onBackClick,
  onRootClick,
  onFileToggle,
  onSearchChange,
  onSelectAll,
  onClearSelection,
  onImportSelected,
  onRecursiveLoad
}) {
  const filteredFiles = driveFiles.filter(file =>
    file.name.toLowerCase().includes(driveSearchTerm.toLowerCase())
  );

  const tsvFiles = driveFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

  return (
    <div className="drive-browser" ref={driveTopRef}>
      <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '10px', flexWrap: 'wrap'}}>
        <button
          className="btn btn-secondary"
          onClick={onRootClick}
          disabled={drivePath.length <= 1 || driveLoading}
        >
          🏠 Root
        </button>
        <button
          className="btn btn-secondary"
          onClick={onBackClick}
          disabled={drivePath.length <= 1 || driveLoading}
        >
          ⬅ Back
        </button>
        <div style={{fontSize: '14px', color: 'var(--text-muted)', flex: 1}}>
          {drivePath.map(p => p.name).join(' > ')}
        </div>
        {selectedFiles.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={onImportSelected}
            style={{fontSize: '14px', padding: '8px 16px'}}
          >
            📥 Import Selected ({selectedFiles.length})
          </button>
        )}
      </div>

      <div style={{display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap'}}>
        <input
          type="text"
          placeholder="Search current folder..."
          value={driveSearchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px',
            border: '3px solid #000',
            borderRadius: '0',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-body)'
          }}
        />
        {tsvFiles.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={onSelectAll}
            style={{fontSize: '14px', padding: '8px 16px', whiteSpace: 'nowrap'}}
          >
            <Check size={16} style={{marginRight: '4px'}} /> Select All Files
          </button>
        )}
        {selectedFiles.length > 0 && (
          <button
            className="btn btn-secondary"
            onClick={onClearSelection}
            style={{fontSize: '14px', padding: '8px 16px', whiteSpace: 'nowrap'}}
          >
            ✕ Clear
          </button>
        )}
      </div>

      <div style={{
        minHeight: '200px',
        maxHeight: '500px',
        overflowY: 'auto',
        border: '3px solid #000',
        borderRadius: '0',
        background: 'var(--bg-primary)'
      }}>
        {driveLoading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: 'var(--text-heading)',
            fontWeight: 'bold'
          }}>
            Loading folder...
          </div>
        ) : (
          <>
            {filteredFiles.map(file => (
              <DriveFileItem
                key={file.id}
                file={file}
                isSelected={selectedFiles.some(f => f.id === file.id)}
                recursiveLoading={recursiveLoading === file.id}
                onFolderClick={onFolderClick}
                onToggleSelection={onFileToggle}
                onRecursiveLoad={onRecursiveLoad}
              />
            ))}
            {filteredFiles.length === 0 && (
              <p style={{
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '40px 20px',
                margin: 0
              }}>
                No files found.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

DriveBrowser.propTypes = {
  driveFiles: PropTypes.array.isRequired,
  drivePath: PropTypes.array.isRequired,
  driveSearchTerm: PropTypes.string.isRequired,
  driveLoading: PropTypes.bool.isRequired,
  selectedFiles: PropTypes.array.isRequired,
  recursiveLoading: PropTypes.string,
  driveTopRef: PropTypes.object,
  onFolderClick: PropTypes.func.isRequired,
  onBackClick: PropTypes.func.isRequired,
  onRootClick: PropTypes.func.isRequired,
  onFileToggle: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onSelectAll: PropTypes.func.isRequired,
  onClearSelection: PropTypes.func.isRequired,
  onImportSelected: PropTypes.func.isRequired,
  onRecursiveLoad: PropTypes.func.isRequired
};

export default DriveBrowser;
