import React from 'react';

function UploadView({ 
  upload, 
  uploadMode, 
  setUploadMode,
  loadQuestionSets,
  questionSets,
  session,
  deleteNotification,
  setToDelete,
  setSetToDelete,
  deletingSetId,
  handleDeleteSet,
  openRenameModal
}) {
  return (
    <div className="container">
      <h2>Manage Questions</h2>
      
      {/* Sub-Navigation Tabs */}
      <div style={{display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '20px'}}>
        <button 
          style={{
            padding: '10px 20px', 
            border: 'none', 
            background: 'none', 
            borderBottom: upload.uploadSubView === 'import' ? '2px solid #667eea' : 'none',
            color: upload.uploadSubView === 'import' ? '#667eea' : '#666',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          onClick={() => upload.setUploadSubView('import')}
        >
          📥 Import New
        </button>
        <button 
          style={{
            padding: '10px 20px', 
            border: 'none', 
            background: 'none', 
            borderBottom: upload.uploadSubView === 'library' ? '2px solid #667eea' : 'none',
            color: upload.uploadSubView === 'library' ? '#667eea' : '#666',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          onClick={() => upload.setUploadSubView('library')}
        >
          📚 Your Library
        </button>
      </div>

      {/* IMPORT VIEW */}
      {upload.uploadSubView === 'import' && (
        <>
          {upload.pendingUpload ? (
            <div style={{background: '#f9fafb', padding: '25px', borderRadius: '12px', border: '1px solid #e5e7eb', maxWidth: '600px', margin: '0 auto'}}>
              <h3 style={{marginTop: 0, color: '#333'}}>📝 Review & Import</h3>
              
              {upload.uploadError && (
                <div style={{padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '15px', fontSize: '14px'}}>
                  ⚠️ {upload.uploadError}
                </div>
              )}
              
              <div style={{marginBottom: '20px', padding: '10px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb'}}>
                <span style={{fontWeight: 'bold', color: '#555'}}>Selected: </span>
                {upload.pendingUpload.type === 'local' 
                  ? `${upload.pendingUpload.data.length} file(s) from Device` 
                  : `📄 ${upload.pendingUpload.data.name} (from Drive)`}
              </div>

              <div style={{marginBottom: '15px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Set Name</label>
                <input 
                  type="text" 
                  value={upload.customName} 
                  onChange={(e) => upload.setCustomName(e.target.value)} 
                  placeholder="e.g. My Quiz Set"
                  disabled={upload.uploading}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
                />
              </div>

              <div style={{marginBottom: '20px'}}>
                <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Tags</label>
                <input 
                  type="text" 
                  value={upload.uploadTags} 
                  onChange={(e) => upload.setUploadTags(e.target.value)} 
                  placeholder="e.g. History, Science"
                  disabled={upload.uploading}
                  style={{width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc'}}
                />
              </div>

              <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end'}}>
                <button 
                  className="btn btn-secondary" 
                  disabled={upload.uploading}
                  onClick={() => {
                    upload.setPendingUpload(null);
                    upload.setCustomName('');
                    upload.setUploadTags('');
                  }}
                >
                  Cancel
                </button>
                
                <button 
                  className="btn btn-primary" 
                  onClick={() => upload.executeUpload(loadQuestionSets)}
                  disabled={upload.uploading}
                  style={{minWidth: '120px'}}
                >
                  {upload.uploading ? 'Processing...' : 'Confirm Import'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {upload.uploadSuccess && (
                <div style={{
                  marginBottom: '20px', 
                  padding: '12px 15px', 
                  background: '#ecfdf5', 
                  border: '1px solid #a7f3d0', 
                  color: '#065f46', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span>{upload.uploadSuccess}</span>
                  <button 
                    onClick={() => upload.setUploadSuccess('')} 
                    style={{background:'none', border:'none', color:'#065f46', cursor:'pointer', fontSize:'18px', padding:'0 5px'}}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
                <button className={`btn ${uploadMode === 'local' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('local')}>
                  📁 From Your Device
                </button>
                <button className={`btn ${uploadMode === 'drive' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('drive')}>
                  ☁️ From B612 Friendlies Drive
                </button>
              </div>

              {uploadMode === 'local' ? (
                <div className="upload-section">
                  <input type="file" id="file-upload" accept=".tsv" multiple onChange={upload.handleLocalFileSelect} />
                  <label htmlFor="file-upload" className="upload-label">Select TSV File(s) to upload</label>
                </div>
              ) : (
                <div className="drive-browser" ref={upload.driveTopRef}>
                  <div style={{display: 'flex', alignItems: 'center', marginBottom: '15px', gap: '10px', flexWrap: 'wrap'}}>
                    <button className="btn btn-secondary" onClick={upload.handleDriveRootClick} disabled={upload.drivePath.length <= 1 || upload.driveLoading}>🏠 Root</button>
                    <button className="btn btn-secondary" onClick={upload.handleDriveBackClick} disabled={upload.drivePath.length <= 1 || upload.driveLoading}>⬅ Back</button>
                    <div style={{fontSize: '14px', color: '#666'}}>
                      {upload.drivePath.map(p => p.name).join(' > ')}
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Search current folder..."
                    value={upload.driveSearchTerm}
                    onChange={(e) => upload.setDriveSearchTerm(e.target.value)}
                    style={{width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                  />
                  
                  <div className="set-list" style={{minHeight: '200px', position: 'relative'}}>
                    {upload.driveLoading ? (
                       <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#667eea', fontWeight: 'bold'}}>Loading folder...</div>
                    ) : (
                      <>
                        {upload.driveFiles
                          .filter(file => file.name.toLowerCase().includes(upload.driveSearchTerm.toLowerCase()))
                          .map(file => (
                          <div 
                            key={file.id} 
                            className="set-card" 
                            onClick={() => {
                                if (file.mimeType === 'application/vnd.google-apps.folder') {
                                    upload.setDriveSearchTerm('');
                                    upload.handleDriveFolderClick(file);
                                } else {
                                    upload.handleDriveFileClick(file);
                                }
                            }}
                            style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px'}}
                          >
                            <div style={{fontSize: '24px'}}>
                              {file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄'}
                            </div>
                            <div>
                              <h4 style={{margin: 0}}>{file.name}</h4>
                            </div>
                          </div>
                        ))}
                        {upload.driveFiles.length === 0 && <p style={{color: '#999', textAlign: 'center', marginTop: '20px'}}>No files found.</p>}
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* LIBRARY VIEW */}
      {upload.uploadSubView === 'library' && (
        <div style={{marginTop: '20px'}}>
          <h3>Your Uploaded Sets</h3>
          
          {deleteNotification && (
            <div style={{
              marginBottom: '15px', padding: '10px', borderRadius: '6px', fontSize: '14px',
              background: deleteNotification.includes('Error') ? '#fee2e2' : '#ecfdf5',
              color: deleteNotification.includes('Error') ? '#dc2626' : '#065f46',
              border: `1px solid ${deleteNotification.includes('Error') ? '#fca5a5' : '#a7f3d0'}`
            }}>
              {deleteNotification}
            </div>
          )}

          <p style={{color: '#666', marginBottom: '20px'}}>Manage the sets you have imported or uploaded.</p>
          
          {(() => {
            const myUploadedSets = questionSets.filter(set => set.uploaded_by_username === session.user.email.split('@')[0]);
            
            if (myUploadedSets.length === 0) return <div className="empty-state"><p>You haven't uploaded any sets yet.</p></div>;
            
            return (
              <div className="set-list">
                {myUploadedSets.map((set) => (
                  <div key={set.id} className="set-card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px', flexWrap: 'wrap'}}>
                      <h2 style={{margin: 0, wordBreak: 'break-word', lineHeight: '1.4', flex: '1 1 200px', fontSize: '17px'}}>{set.name}</h2>
                      
                      <div style={{display: 'flex', gap: '5px', flexShrink: 0, marginLeft: 'auto'}}>
                        {setToDelete !== set.id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openRenameModal(set); }}
                            className="btn btn-secondary"
                            style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
                            title="Rename Set"
                          >
                            ✏️
                          </button>
                        )}
                        
                        {setToDelete === set.id ? (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                              disabled={deletingSetId === set.id}
                              className="btn btn-danger"
                              style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
                            >
                              {deletingSetId === set.id ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setSetToDelete(null); }}
                              className="btn btn-secondary"
                              style={{padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap'}}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSetToDelete(set.id); }}
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
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Pro Tips Section */}
      <div style={{marginTop: '40px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
        <h3 style={{color: '#667eea', marginBottom: '15px', fontSize: '18px'}}>💡 Tips & Best Practices</h3>
        
        <div style={{color: '#666', lineHeight: '1.7', fontSize: '14px'}}>
          <p style={{marginBottom: '12px'}}>
            <strong>File Naming:</strong> When uploading from your device, you can provide a custom name. 
            If left blank, the filename will be used. When importing from Google Drive, the file name is used by default. 
            For multiple files, each gets its own name automatically.
          </p>
          
          <p style={{marginBottom: '12px'}}>
            <strong>Tagging:</strong> Tag your uploaded sets with categories (like "Art", "History", "Films") 
            to easily filter and find them later. Tags work across all import methods.
          </p>
          
          <p style={{margin: 0}}>
            <strong>Visibility:</strong> All users can see and practice all uploaded sets. Only the uploader can delete or rename their own sets.
          </p>
        </div>
      </div>
    </div>
  );
}

export default UploadView;
