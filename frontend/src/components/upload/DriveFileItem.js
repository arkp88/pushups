import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Folder, FileText, Download } from '@phosphor-icons/react';
import './DriveFileItem.css';

function DriveFileItem({
  file,
  isSelected,
  recursiveLoading,
  onFolderClick,
  onToggleSelection,
  onRecursiveLoad
}) {
  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset expanded state when file changes or loading completes
  useEffect(() => {
    setIsExpanded(false);
  }, [file.id]);

  // Auto-collapse after 3 seconds if not clicked
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleClick = () => {
    if (isFolder) {
      onFolderClick(file);
    } else {
      onToggleSelection(file);
    }
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    onToggleSelection(file);
  };

  const handleImportClick = useCallback((e) => {
    e.stopPropagation();
    if (!isExpanded) {
      // First tap: expand to show full button
      setIsExpanded(true);
    } else {
      // Second tap: perform import
      onRecursiveLoad(file.id);
    }
  }, [isExpanded, file.id, onRecursiveLoad]);

  const itemClassName = `drive-file-item ${isSelected ? 'selected' : ''} ${isFolder ? 'folder' : ''}`;

  return (
    <div className={itemClassName} onClick={handleClick}>
      {!isFolder && (
        <input
          type="checkbox"
          checked={isSelected}
          onClick={(e) => e.stopPropagation()}
          onChange={handleCheckboxChange}
          className="drive-file-item-checkbox"
        />
      )}

      <div className={`drive-file-item-icon ${isFolder ? 'folder' : ''}`}>
        {isFolder ? (
          <Folder size={20} weight="bold" />
        ) : (
          <FileText size={20} weight="bold" color="var(--text-muted)" />
        )}
      </div>

      <div className="drive-file-item-name">
        <div className={`drive-file-item-name-text ${isFolder ? 'folder' : ''}`}>
          {file.name}
        </div>
      </div>

      {isFolder && (
        <div className="drive-file-item-actions">
          <button
            onClick={handleImportClick}
            disabled={recursiveLoading}
            className={`drive-file-item-import-btn ${isExpanded ? 'expanded' : ''}`}
            title="Import all TSV files in this folder and subfolders recursively"
          >
            {recursiveLoading ? (
              <span className="import-btn-full">⏳ Scanning...</span>
            ) : (
              <>
                <Download size={16} weight="bold" className="import-btn-icon" />
                <span className="import-btn-full">📥 Import All</span>
                <span className="import-btn-expanded">Tap to Import</span>
              </>
            )}
          </button>
          <div className="drive-file-item-arrow">→</div>
        </div>
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
