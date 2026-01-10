import React from 'react';
import PropTypes from 'prop-types';
import { NotificationBanner } from '../common';
import MultiFileReviewCard from './MultiFileReviewCard';
import FileReviewModal from './FileReviewModal';
import UploadSourceSelector from './UploadSourceSelector';
import LocalUploadSection from './LocalUploadSection';
import DriveBrowser from './DriveBrowser';
import UploadTipsCard from './UploadTipsCard';

function ImportView({
  upload,
  uploadMode,
  setUploadMode,
  loadQuestionSets
}) {
  // If there's a pending upload, show the review screen
  if (upload.pendingUpload) {
    if (upload.pendingUpload.type === 'drive-multi') {
      // Multi-file import review
      return (
        <MultiFileReviewCard
          pendingUpload={upload.pendingUpload}
          recursiveFiles={upload.recursiveFiles}
          uploadTags={upload.uploadTags}
          setUploadTags={upload.setUploadTags}
          uploading={upload.uploading}
          uploadError={upload.uploadError}
          onCancel={() => {
            upload.setPendingUpload(null);
            upload.setUploadTags('');
          }}
          onConfirm={() => upload.executeUpload(loadQuestionSets)}
          selectAllFiles={upload.selectAllPendingFiles}
          deselectAllFiles={upload.deselectAllPendingFiles}
          toggleFileSelection={upload.togglePendingFileSelection}
        />
      );
    } else {
      // Single file import review (local or single drive file)
      return (
        <FileReviewModal
          pendingUpload={upload.pendingUpload}
          customName={upload.customName}
          setCustomName={upload.setCustomName}
          uploadTags={upload.uploadTags}
          setUploadTags={upload.setUploadTags}
          uploading={upload.uploading}
          uploadError={upload.uploadError}
          onCancel={() => {
            upload.setPendingUpload(null);
            upload.setCustomName('');
            upload.setUploadTags('');
          }}
          onConfirm={() => upload.executeUpload(loadQuestionSets)}
        />
      );
    }
  }

  // No pending upload - show upload source selection
  return (
    <>
      <NotificationBanner
        message={upload.uploadError}
        type="error"
        onClose={() => upload.setUploadError('')}
      />

      <NotificationBanner
        message={upload.uploadSuccess}
        type="success"
        onClose={() => upload.setUploadSuccess('')}
      />

      <UploadSourceSelector
        uploadMode={uploadMode}
        onModeChange={setUploadMode}
      />

      {uploadMode === 'local' ? (
        <LocalUploadSection
          onFileSelect={upload.handleLocalFileSelect}
        />
      ) : (
        <DriveBrowser
          driveFiles={upload.driveFiles}
          drivePath={upload.drivePath}
          driveSearchTerm={upload.driveSearchTerm}
          driveLoading={upload.driveLoading}
          selectedFiles={upload.selectedDriveFiles}
          recursiveLoading={upload.recursiveLoading}
          driveTopRef={upload.driveTopRef}
          onFolderClick={upload.handleDriveFolderClick}
          onBackClick={upload.handleDriveBackClick}
          onRootClick={upload.handleDriveRootClick}
          onFileToggle={upload.toggleDriveFileSelection}
          onSearchChange={upload.setDriveSearchTerm}
          onSelectAll={upload.selectAllDriveFiles}
          onClearSelection={upload.clearDriveSelection}
          onImportSelected={upload.importSelectedDriveFiles}
          onRecursiveLoad={upload.loadFolderRecursive}
        />
      )}

      <UploadTipsCard />
    </>
  );
}

ImportView.propTypes = {
  upload: PropTypes.object.isRequired,
  uploadMode: PropTypes.oneOf(['local', 'drive']).isRequired,
  setUploadMode: PropTypes.func.isRequired,
  loadQuestionSets: PropTypes.func.isRequired
};

export default ImportView;
