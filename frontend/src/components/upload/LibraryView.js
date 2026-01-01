import React from 'react';
import PropTypes from 'prop-types';
import { EmptyState } from '../common';
import LibrarySetCard from './LibrarySetCard';

function LibraryView({
  questionSets,
  session,
  setToDelete,
  setSetToDelete,
  deletingSetId,
  handleDeleteSet,
  openRenameModal
}) {
  const myUploadedSets = questionSets.filter(
    set => set.uploaded_by_username === session.user.email.split('@')[0]
  );

  return (
    <div style={{marginTop: '20px'}}>
      <h3>Your Uploaded Sets</h3>

      <p style={{color: 'var(--text-body)', marginBottom: '20px'}}>
        Manage the sets you have imported or uploaded.
      </p>

      {myUploadedSets.length === 0 ? (
        <EmptyState
          title="No Uploaded Sets"
          description="You haven't uploaded any question sets yet. Head to the Import tab to get started!"
        />
      ) : (
        <div className="set-list">
          {myUploadedSets.map((set) => (
            <LibrarySetCard
              key={set.id}
              set={set}
              isDeleting={deletingSetId === set.id}
              showDeleteConfirm={setToDelete === set.id}
              onRename={openRenameModal}
              onDelete={setSetToDelete}
              onDeleteConfirm={handleDeleteSet}
              onDeleteCancel={() => setSetToDelete(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

LibraryView.propTypes = {
  questionSets: PropTypes.array.isRequired,
  session: PropTypes.shape({
    user: PropTypes.shape({
      email: PropTypes.string.isRequired
    }).isRequired
  }).isRequired,
  setToDelete: PropTypes.number,
  setSetToDelete: PropTypes.func.isRequired,
  deletingSetId: PropTypes.number,
  handleDeleteSet: PropTypes.func.isRequired,
  openRenameModal: PropTypes.func.isRequired
};

export default LibraryView;
