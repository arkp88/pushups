import React from 'react';
import PropTypes from 'prop-types';

function LibrarySetCard({
  set,
  isDeleting,
  showDeleteConfirm,
  onRename,
  onDelete,
  onDeleteConfirm,
  onDeleteCancel
}) {
  return (
    <div className="set-card">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '10px',
        flexWrap: 'wrap'
      }}>
        <h2 style={{
          margin: 0,
          wordBreak: 'break-word',
          lineHeight: '1.4',
          flex: '1 1 200px',
          fontSize: '17px'
        }}>
          {set.name}
        </h2>

        <div style={{display: 'flex', gap: '5px', flexShrink: 0, marginLeft: 'auto'}}>
          {!showDeleteConfirm && (
            <button
              onClick={(e) => { e.stopPropagation(); onRename(set); }}
              className="btn btn-secondary"
              style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
              title="Rename Set"
            >
              ✏️
            </button>
          )}

          {showDeleteConfirm ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteConfirm(set.id); }}
                disabled={isDeleting}
                className="btn btn-danger"
                style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteCancel(); }}
                className="btn btn-secondary"
                style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(set.id); }}
              className="btn btn-danger"
              style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      </div>

      <div className="set-info">
        <span>📝 {set.total_questions} questions</span>
        <span>✅ {set.questions_attempted || 0} attempted</span>
        {set.tags && <span>🏷️ {set.tags}</span>}
      </div>
    </div>
  );
}

LibrarySetCard.propTypes = {
  set: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    total_questions: PropTypes.number.isRequired,
    questions_attempted: PropTypes.number,
    tags: PropTypes.string
  }).isRequired,
  isDeleting: PropTypes.bool.isRequired,
  showDeleteConfirm: PropTypes.bool.isRequired,
  onRename: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDeleteConfirm: PropTypes.func.isRequired,
  onDeleteCancel: PropTypes.func.isRequired
};

export default LibrarySetCard;
