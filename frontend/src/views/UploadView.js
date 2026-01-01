import React from 'react';
import PropTypes from 'prop-types';
import {
  UploadTabs,
  ImportView,
  LibraryView
} from '../components/upload';

function UploadView({
  upload,
  uploadMode,
  setUploadMode,
  loadQuestionSets,
  questionSets,
  session,
  setToDelete,
  setSetToDelete,
  deletingSetId,
  handleDeleteSet,
  openRenameModal
}) {
  return (
    <div className="container">
      <h2>Manage Questions</h2>

      <UploadTabs
        activeTab={upload.uploadSubView}
        onTabChange={upload.setUploadSubView}
      />

      {upload.uploadSubView === 'import' && (
        <ImportView
          upload={upload}
          uploadMode={uploadMode}
          setUploadMode={setUploadMode}
          loadQuestionSets={loadQuestionSets}
        />
      )}

      {upload.uploadSubView === 'library' && (
        <LibraryView
          questionSets={questionSets}
          session={session}
          setToDelete={setToDelete}
          setSetToDelete={setSetToDelete}
          deletingSetId={deletingSetId}
          handleDeleteSet={handleDeleteSet}
          openRenameModal={openRenameModal}
        />
      )}
    </div>
  );
}

UploadView.propTypes = {
  upload: PropTypes.object.isRequired,
  uploadMode: PropTypes.oneOf(['local', 'drive']).isRequired,
  setUploadMode: PropTypes.func.isRequired,
  loadQuestionSets: PropTypes.func.isRequired,
  questionSets: PropTypes.array.isRequired,
  session: PropTypes.object.isRequired,
  setToDelete: PropTypes.number,
  setSetToDelete: PropTypes.func.isRequired,
  deletingSetId: PropTypes.number,
  handleDeleteSet: PropTypes.func.isRequired,
  openRenameModal: PropTypes.func.isRequired
};

export default UploadView;
