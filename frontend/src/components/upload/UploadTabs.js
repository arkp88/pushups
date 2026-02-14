import React from 'react';
import PropTypes from 'prop-types';

function UploadTabs({ activeTab, onTabChange }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: '3px solid var(--border-medium)',
      marginBottom: '20px'
    }}>
      <button
        style={{
          padding: '10px 20px',
          border: 'none',
          background: 'none',
          borderBottom: activeTab === 'import' ? '3px solid #000' : 'none',
          color: activeTab === 'import' ? 'var(--text-heading)' : 'var(--text-muted)',
          fontWeight: '600',
          cursor: 'pointer'
        }}
        onClick={() => onTabChange('import')}
      >
        📥 Import New
      </button>
      <button
        style={{
          padding: '10px 20px',
          border: 'none',
          background: 'none',
          borderBottom: activeTab === 'library' ? '3px solid #000' : 'none',
          color: activeTab === 'library' ? 'var(--text-heading)' : 'var(--text-muted)',
          fontWeight: '600',
          cursor: 'pointer'
        }}
        onClick={() => onTabChange('library')}
      >
        📚 Your Library
      </button>
    </div>
  );
}

UploadTabs.propTypes = {
  activeTab: PropTypes.oneOf(['import', 'library']).isRequired,
  onTabChange: PropTypes.func.isRequired
};

export default UploadTabs;
