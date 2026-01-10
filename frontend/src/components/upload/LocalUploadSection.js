import React from 'react';
import PropTypes from 'prop-types';

function LocalUploadSection({ onFileSelect }) {
  return (
    <div className="upload-section">
      <input
        type="file"
        id="file-upload"
        accept=".tsv"
        multiple
        onChange={onFileSelect}
      />
      <label htmlFor="file-upload" className="upload-label">
        Select TSV File(s) to upload
      </label>
    </div>
  );
}

LocalUploadSection.propTypes = {
  onFileSelect: PropTypes.func.isRequired
};

export default LocalUploadSection;
