import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export function useUpload(ROOT_FOLDER_ID, view, uploadMode, session, setAppNotification = () => {}) {
  // Upload State
  const [uploadTags, setUploadTags] = useState('');
  const [customName, setCustomName] = useState('');
  const [pendingUpload, setPendingUpload] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [uploadSubView, setUploadSubView] = useState('import');
  
  // Drive State
  const [driveFiles, setDriveFiles] = useState([]);
  const [drivePath, setDrivePath] = useState([{ id: ROOT_FOLDER_ID, name: 'Root' }]);
  const [currentDriveFolder, setCurrentDriveFolder] = useState(ROOT_FOLDER_ID);
  const [driveSearchTerm, setDriveSearchTerm] = useState('');
  const [driveLoading, setDriveLoading] = useState(false);
  const [selectedDriveFiles, setSelectedDriveFiles] = useState([]);

  const driveTopRef = useRef(null);

  // Load Drive files when switching to Drive mode
  useEffect(() => {
    if (view === 'upload' && uploadMode === 'drive' && session) {
      loadDriveFiles(currentDriveFolder);
    }
  }, [view, uploadMode, currentDriveFolder, session]);

  // Auto-scroll to top when Drive content changes
  useEffect(() => {
    if (uploadMode === 'drive' && driveTopRef.current && !driveLoading) {
      driveTopRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  }, [driveLoading, uploadMode]);

  const loadDriveFiles = async (folderId) => {
    try {
      setDriveLoading(true);
      const data = await api.listDriveFiles(folderId);
      setDriveFiles(data.files);
      setSelectedDriveFiles([]); // Clear selection when navigating
    } catch (error) {
      console.error('Error loading Drive files:', error);
      // REPLACE alert()
      setAppNotification('Failed to load Drive files. Check API key and folder ID.', true);
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveFolderClick = (folder) => {
    // Prevent adding the same folder twice if already at the end of path
    const lastFolder = drivePath[drivePath.length - 1];
    if (lastFolder && lastFolder.id === folder.id) {
      return; // Already in this folder, don't add again
    }

    setDrivePath([...drivePath, folder]);
    setCurrentDriveFolder(folder.id);
    setCustomName('');
  };

  const handleDriveBackClick = () => {
    if (drivePath.length <= 1) return;
    const newPath = [...drivePath];
    newPath.pop();
    setDrivePath(newPath);
    setCurrentDriveFolder(newPath[newPath.length - 1].id);
    setCustomName('');
  };

  const handleDriveRootClick = () => {
    setDrivePath([{ id: ROOT_FOLDER_ID, name: 'Root' }]);
    setCurrentDriveFolder(ROOT_FOLDER_ID);
    setCustomName('');
  };

  const handleDriveFileClick = (file) => {
    setUploadSuccess('');
    const cleanFileName = file.name.replace('.tsv', '');
    let autoName = cleanFileName;

    if (drivePath.length > 1) {
      const setterName = drivePath[1].name;
      autoName = `${setterName} - ${cleanFileName}`;
    }

    setCustomName(autoName);
    setPendingUpload({ type: 'drive', data: file });
  };

  const toggleDriveFileSelection = (file) => {
    setSelectedDriveFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const selectAllDriveFiles = () => {
    const tsvFiles = driveFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
    setSelectedDriveFiles(tsvFiles);
  };

  const clearDriveSelection = () => {
    setSelectedDriveFiles([]);
  };

  const importSelectedDriveFiles = () => {
    if (selectedDriveFiles.length === 0) return;
    setUploadSuccess('');
    setCustomName(''); // Multi-file import doesn't use custom name
    setPendingUpload({ type: 'drive-multi', data: selectedDriveFiles });
  };

  const handleLocalFileSelect = (event) => {
    setUploadSuccess('');
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    if (filesArray.length === 1) {
      setCustomName(filesArray[0].name.replace('.tsv', ''));
    } else {
      setCustomName('');
    }
    
    setPendingUpload({ type: 'local', data: filesArray });
    event.target.value = '';
  };

  const executeUpload = async (onSuccess) => {
    if (!pendingUpload) return;
    
    try {
      setUploading(true);
      setUploadError('');

      let partialUploads = [];
      // FIX #3: Track successes and failures separately for multi-file uploads
      let successCount = 0;
      let failedFiles = [];

      if (pendingUpload.type === 'local') {
        const files = pendingUpload.data;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          let setName;
          if (customName.trim()) {
            setName = files.length > 1 ? `${customName.trim()} - ${i + 1}` : customName.trim();
          } else {
            setName = file.name.replace('.tsv', '');
          }

          // FIX #3: Wrap individual upload in try-catch to handle partial failures
          try {
            const response = await api.uploadTSV(file, setName, '', uploadTags);
            successCount++;
            if (response.is_partial) {
              partialUploads.push({
                name: setName,
                imported: response.questions_imported,
                expected: response.expected_questions,
                warning: response.warning
              });
            }
          } catch (error) {
            failedFiles.push({ name: setName, error: error.message });
          }
        }
      } else if (pendingUpload.type === 'drive') {
        const file = pendingUpload.data;
        const finalName = customName.trim() || file.name.replace('.tsv', '');
        const response = await api.importDriveFile(file.id, file.name, uploadTags, finalName);
        successCount++;
        if (response.is_partial) {
          partialUploads.push({
            name: finalName,
            imported: response.questions_imported,
            expected: response.expected_questions,
            warning: response.warning
          });
        }
      } else if (pendingUpload.type === 'drive-multi') {
        const files = pendingUpload.data;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          let setName = file.name.replace('.tsv', '');

          // Add folder prefix if in subfolder
          if (drivePath.length > 1) {
            const setterName = drivePath[1].name;
            setName = `${setterName} - ${setName}`;
          }

          // FIX #3: Wrap individual import in try-catch to handle partial failures
          try {
            const response = await api.importDriveFile(file.id, file.name, uploadTags, setName);
            successCount++;
            if (response.is_partial) {
              partialUploads.push({
                name: setName,
                imported: response.questions_imported,
                expected: response.expected_questions,
                warning: response.warning
              });
            }
          } catch (error) {
            failedFiles.push({ name: setName, error: error.message });
          }
        }

        setSelectedDriveFiles([]); // Clear selection after upload
      }

      setPendingUpload(null);

      // FIX #3: Show appropriate success/error message based on results
      if (failedFiles.length > 0 && successCount === 0) {
        // All failed
        const errorMsg = failedFiles.map(f => `❌ ${f.name}: ${f.error}`).join('\n');
        setUploadError(`All uploads failed:\n${errorMsg}`);
      } else if (failedFiles.length > 0) {
        // Partial success
        const errorMsg = failedFiles.map(f => `❌ ${f.name}: ${f.error}`).join('\n');
        const warningMsg = partialUploads.length > 0 
          ? '\n\n' + partialUploads.map(p => `⚠️ ${p.name}: ${p.imported}/${p.expected} questions imported`).join('\n')
          : '';
        setUploadSuccess(`✅ ${successCount} of ${successCount + failedFiles.length} files imported successfully.\n\n${errorMsg}${warningMsg}`);
      } else if (partialUploads.length > 0) {
        // All succeeded but some partial
        const warnings = partialUploads.map(p =>
          `⚠️ ${p.name}: ${p.imported}/${p.expected} questions imported`
        ).join('\n');
        setUploadSuccess(`Import completed with warnings:\n${warnings}\n\nFiles may be too large for free tier (30s timeout). Consider splitting into smaller files.`);
      } else {
        // All succeeded fully
        setUploadSuccess('✅ Import successful! Check the "Your Library" tab.');
      }

      setCustomName('');
      setUploadTags('');

      if (onSuccess) onSuccess();

    } catch (error) {
      console.error(error);
      setUploadError(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return {
    // Upload State
    uploadTags,
    customName,
    pendingUpload,
    uploading,
    uploadError,
    uploadSuccess,
    uploadSubView,

    // Drive State
    driveFiles,
    drivePath,
    currentDriveFolder,
    driveSearchTerm,
    driveLoading,
    driveTopRef,
    selectedDriveFiles,

    // Actions
    setUploadTags,
    setCustomName,
    setPendingUpload,
    setUploadSuccess,
    setUploadError,
    setUploadSubView,
    setDriveSearchTerm,
    handleDriveFolderClick,
    handleDriveBackClick,
    handleDriveRootClick,
    handleDriveFileClick,
    handleLocalFileSelect,
    executeUpload,
    toggleDriveFileSelection,
    selectAllDriveFiles,
    clearDriveSelection,
    importSelectedDriveFiles,
  };
}