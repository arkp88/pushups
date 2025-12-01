import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

export function useUpload(ROOT_FOLDER_ID, view, uploadMode, session) {
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
    } catch (error) {
      console.error('Error loading Drive files:', error);
      alert('Failed to load Drive files. Check API key and folder ID.');
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveFolderClick = (folder) => {
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
          
          await api.uploadTSV(file, setName, '', uploadTags);
        }
      } else if (pendingUpload.type === 'drive') {
        const file = pendingUpload.data;
        const finalName = customName.trim() || file.name.replace('.tsv', '');
        await api.importDriveFile(file.id, file.name, uploadTags, finalName);
      }

      setPendingUpload(null);
      setUploadSuccess('✅ Import successful! Check the "Your Library" tab.');
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
    
    // Actions
    setUploadTags,
    setCustomName,
    setPendingUpload,
    setUploadSuccess,
    setUploadSubView,
    setDriveSearchTerm,
    handleDriveFolderClick,
    handleDriveBackClick,
    handleDriveRootClick,
    handleDriveFileClick,
    handleLocalFileSelect,
    executeUpload,
  };
}
