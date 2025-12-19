import React from 'react';
import { Folder, FileText, Check, HardDrive } from 'lucide-react';

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
            upload.pendingUpload.type === 'drive-multi' ? (
              // Multi-file import modal with full file list
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '12px',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '90vh',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                }}>
                  <h3 style={{marginTop: 0, color: '#333', marginBottom: '15px'}}>
                    📝 Review Multi-File Import
                  </h3>

                  {upload.uploadError && (
                    <div style={{padding: '10px', background: '#fee2e2', color: '#dc2626', borderRadius: '6px', marginBottom: '15px', fontSize: '14px'}}>
                      ⚠️ {upload.uploadError}
                    </div>
                  )}

                  <div style={{
                    padding: '12px',
                    background: '#f0f9ff',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    border: '1px solid #bfdbfe'
                  }}>
                    <p style={{margin: 0, color: '#1e40af', fontSize: '14px'}}>
                      Ready to import <strong>{upload.pendingUpload.data.length} files</strong> from Google Drive
                    </p>
                  </div>

                  {upload.pendingUpload.data.length > 10 && (
                    <div style={{
                      padding: '10px 12px',
                      background: '#fef3c7',
                      borderRadius: '6px',
                      marginBottom: '15px',
                      border: '1px solid #fcd34d'
                    }}>
                      <p style={{margin: 0, color: '#92400e', fontSize: '13px', lineHeight: '1.5'}}>
                        ⚠️ <strong>Large import:</strong> This will import {upload.pendingUpload.data.length} files sequentially.
                        Estimated time: ~{Math.ceil(upload.pendingUpload.data.length * 2 / 60)} minute{Math.ceil(upload.pendingUpload.data.length * 2 / 60) > 1 ? 's' : ''}.
                        Please keep this tab open and don't refresh.
                      </p>
                    </div>
                  )}

                  {/* Scrollable file list section */}
                  <div style={{flex: '1 1 auto', overflow: 'auto', marginBottom: '20px', minHeight: 0}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                      <p style={{fontWeight: '600', margin: 0, color: '#555'}}>
                        Files to import ({upload.pendingUpload.data.length} selected):
                      </p>
                      {upload.recursiveFiles.length > 0 && (
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button
                            onClick={upload.selectAllPendingFiles}
                            disabled={upload.uploading}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              background: '#667eea',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: upload.uploading ? 'not-allowed' : 'pointer',
                              fontWeight: '500'
                            }}
                          >
<Check size={16} style={{marginRight: '4px'}} /> Select All
                          </button>
                          <button
                            onClick={upload.deselectAllPendingFiles}
                            disabled={upload.uploading}
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: upload.uploading ? 'not-allowed' : 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            ✕ Deselect All
                          </button>
                        </div>
                      )}
                    </div>
                    <div style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      padding: '10px',
                      background: '#f9fafb'
                    }}>
                      {/* Show selectable list if from recursive scan, otherwise just show selected files */}
                      {upload.recursiveFiles.length > 0 ? (
                        upload.recursiveFiles.map((file, idx) => {
                          const isSelected = upload.pendingUpload.data.some(f => f.id === file.id);
                          return (
                            <div
                              key={idx}
                              onClick={() => !upload.uploading && upload.togglePendingFileSelection(file.id)}
                              style={{
                                padding: '6px 0',
                                borderBottom: idx < upload.recursiveFiles.length - 1 ? '1px solid #e5e7eb' : 'none',
                                fontSize: '13px',
                                cursor: upload.uploading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '10px',
                                opacity: isSelected ? 1 : 0.5,
                                transition: 'opacity 0.15s ease'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                disabled={upload.uploading}
                                style={{
                                  marginTop: '2px',
                                  width: '16px',
                                  height: '16px',
                                  flexShrink: 0,
                                  cursor: upload.uploading ? 'not-allowed' : 'pointer',
                                  accentColor: '#667eea'
                                }}
                              />
                              <div style={{flex: 1}}>
                                <div style={{fontWeight: '500', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px'}}>
                                  <FileText size={16} /> {file.name}
                                </div>
                                {file.path && (
                                  <div style={{color: '#6b7280', fontSize: '12px', marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                    <Folder size={14} /> {file.path}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        // Non-recursive: just show the selected files without checkboxes
                        upload.pendingUpload.data.map((file, idx) => (
                          <div key={idx} style={{
                            padding: '6px 0',
                            borderBottom: idx < upload.pendingUpload.data.length - 1 ? '1px solid #e5e7eb' : 'none',
                            fontSize: '13px'
                          }}>
                            <div style={{fontWeight: '500', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '6px'}}>
                              <FileText size={16} /> {file.name}
                            </div>
                            {file.path && (
                              <div style={{color: '#6b7280', fontSize: '12px', marginLeft: '20px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                <Folder size={14} /> {file.path}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Fixed tags input and buttons section */}
                  <div style={{flex: '0 0 auto'}}>
                  <div style={{marginBottom: '20px'}}>
                    <label style={{display: 'block', marginBottom: '5px', fontWeight: '500'}}>Tags (optional)</label>
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
                        upload.setUploadTags('');
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => upload.executeUpload(loadQuestionSets)}
                      disabled={upload.uploading || upload.pendingUpload.data.length === 0}
                      style={{minWidth: '120px'}}
                    >
                      {upload.uploading
                        ? 'Processing...'
                        : upload.pendingUpload.data.length === 0
                          ? 'Select at least 1 file'
                          : `Import ${upload.pendingUpload.data.length} File${upload.pendingUpload.data.length > 1 ? 's' : ''}`
                      }
                    </button>
                  </div>
                  </div>
                </div>
              </div>
            ) : (
              // Single file import (local or single drive file)
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
                    : (
                      <span style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                        <FileText size={16} /> {upload.pendingUpload.data.name} (from Drive)
                      </span>
                    )}
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
            )
          ) : (
            <>
              {upload.uploadError && (
                <div style={{
                  marginBottom: '20px', 
                  padding: '12px 15px', 
                  background: '#fee2e2', 
                  border: '1px solid #fca5a5', 
                  color: '#dc2626', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <span style={{ whiteSpace: 'pre-line' }}>⚠️ {upload.uploadError}</span>
                  <button 
                    onClick={() => upload.setUploadError('')} 
                    style={{background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:'18px', padding:'0 5px', flexShrink: 0}}
                  >
                    ✕
                  </button>
                </div>
              )}
              
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
                  <span style={{ whiteSpace: 'pre-line' }}>{upload.uploadSuccess}</span>
                  <button 
                    onClick={() => upload.setUploadSuccess('')} 
                    style={{background:'none', border:'none', color:'#065f46', cursor:'pointer', fontSize:'18px', padding:'0 5px', flexShrink: 0}}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
                <button className={`btn ${uploadMode === 'local' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setUploadMode('local')}>
                  <HardDrive size={18} style={{marginRight: '6px'}} />
                  From Your Device
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
                    <div style={{fontSize: '14px', color: '#666', flex: 1}}>
                      {upload.drivePath.map(p => p.name).join(' > ')}
                    </div>
                    {upload.selectedDriveFiles.length > 0 && (
                      <button
                        className="btn btn-primary"
                        onClick={upload.importSelectedDriveFiles}
                        style={{fontSize: '14px', padding: '8px 16px'}}
                      >
                        📥 Import Selected ({upload.selectedDriveFiles.length})
                      </button>
                    )}
                  </div>

                  <div style={{display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap'}}>
                    <input
                      type="text"
                      placeholder="Search current folder..."
                      value={upload.driveSearchTerm}
                      onChange={(e) => upload.setDriveSearchTerm(e.target.value)}
                      style={{flex: 1, minWidth: '200px', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px'}}
                    />
                    {upload.driveFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder').length > 0 && (
                      <button
                        className="btn btn-secondary"
                        onClick={upload.selectAllDriveFiles}
                        style={{fontSize: '14px', padding: '8px 16px', whiteSpace: 'nowrap'}}
                      >
<Check size={16} style={{marginRight: '4px'}} /> Select All Files
                      </button>
                    )}
                    {upload.selectedDriveFiles.length > 0 && (
                      <button
                        className="btn btn-secondary"
                        onClick={upload.clearDriveSelection}
                        style={{fontSize: '14px', padding: '8px 16px', whiteSpace: 'nowrap'}}
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                  
                  <div style={{minHeight: '200px', maxHeight: '500px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', background: 'white'}}>
                    {upload.driveLoading ? (
                       <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#667eea', fontWeight: 'bold'}}>Loading folder...</div>
                    ) : (
                      <>
                        {upload.driveFiles
                          .filter(file => file.name.toLowerCase().includes(upload.driveSearchTerm.toLowerCase()))
                          .map(file => {
                            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                            const isSelected = upload.selectedDriveFiles.some(f => f.id === file.id);

                            return (
                              <div
                                key={file.id}
                                onClick={() => {
                                    if (isFolder) {
                                        upload.setDriveSearchTerm('');
                                        upload.handleDriveFolderClick(file);
                                    } else {
                                        upload.toggleDriveFileSelection(file);
                                    }
                                }}
                                style={{
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '12px',
                                  padding: '10px 16px',
                                  borderBottom: '1px solid #f3f4f6',
                                  transition: 'background 0.15s ease',
                                  background: isSelected ? '#eff6ff' : 'white',
                                  ':hover': {background: '#f9fafb'}
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = isSelected ? '#eff6ff' : '#f9fafb'}
                                onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? '#eff6ff' : 'white'}
                              >
                                {!isFolder && (
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      upload.toggleDriveFileSelection(file);
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
                                    color: '#1f2937',
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
                                        upload.loadFolderRecursive(file.id);
                                      }}
                                      disabled={upload.recursiveLoading === file.id}
                                      style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: upload.recursiveLoading === file.id ? 'wait' : 'pointer',
                                        fontWeight: '600',
                                        marginRight: '8px',
                                        flexShrink: 0,
                                        opacity: upload.recursiveLoading === file.id ? 0.6 : 1,
                                        transition: 'all 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (upload.recursiveLoading !== file.id) {
                                          e.target.style.background = '#059669';
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = '#10b981';
                                      }}
                                      title="Import all TSV files in this folder and subfolders recursively"
                                    >
                                      {upload.recursiveLoading === file.id ? '⏳ Scanning...' : '📥 Import All'}
                                    </button>
                                    <div style={{fontSize: '14px', color: '#9ca3af', flexShrink: 0}}>→</div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        {upload.driveFiles.length === 0 && <p style={{color: '#999', textAlign: 'center', padding: '40px 20px', margin: 0}}>No files found.</p>}
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
