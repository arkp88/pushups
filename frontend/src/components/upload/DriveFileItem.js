import React from 'react';
import PropTypes from 'prop-types';
import { Folder, FileText } from 'lucide-react';

function DriveFileItem({
  file,
  isSelected,
  recursiveLoading,
  onFolderClick,
  onToggleSelection,
  onRecursiveLoad
}) {
  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

  return (
    <div
      onClick={() => {
        if (isFolder) {
          onFolderClick(file);
        } else {
          onToggleSelection(file);
        }
      }}
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-light)',
        transition: 'background 0.15s ease',
        background: isSelected ? '#eff6ff' : 'var(--bg-primary)'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = isSelected ? '#eff6ff' : 'var(--bg-secondary)'}
      onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? '#eff6ff' : 'var(--bg-primary)'}
    >
      {!isFolder && (
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelection(file);
          }}
          style={{
            width: '18px',
            height: '18px',
            cursor: 'pointer',
            flexShrink: 0,
            accentColor: '#667eea'
          }}
        />
      )}

      <div style={{flexShrink: 0, marginLeft: isFolder ? '26px' : '0'}}>
        {isFolder ? <Folder size={20} color="#667eea" /> : <FileText size={20} color="#6b7280" />}
      </div>

      <div style={{flex: 1, minWidth: 0}}>
        <div style={{
          margin: 0,
          fontSize: '15px',
          color: 'var(--text-heading)',
          fontWeight: isFolder ? '600' : '500',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {file.name}
        </div>
      </div>

      {isFolder && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRecursiveLoad(file.id);
            }}
            disabled={recursiveLoading}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: recursiveLoading ? 'wait' : 'pointer',
              fontWeight: '600',
              marginRight: '8px',
              flexShrink: 0,
              opacity: recursiveLoading ? 0.6 : 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!recursiveLoading) {
                e.target.style.background = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#10b981';
            }}
            title="Import all TSV files in this folder and subfolders recursively"
          >
            {recursiveLoading ? '⏳ Scanning...' : '📥 Import All'}
          </button>
          <div style={{fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0}}>→</div>
        </>
      )}
    </div>
  );
}

DriveFileItem.propTypes = {
  file: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    mimeType: PropTypes.string.isRequired
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  recursiveLoading: PropTypes.bool.isRequired,
  onFolderClick: PropTypes.func.isRequired,
  onToggleSelection: PropTypes.func.isRequired,
  onRecursiveLoad: PropTypes.func.isRequired
};

export default DriveFileItem;
