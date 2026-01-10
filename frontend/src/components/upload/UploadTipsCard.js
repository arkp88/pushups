import React from 'react';

function UploadTipsCard() {
  return (
    <div style={{
      marginTop: '40px',
      padding: '20px',
      background: 'var(--bg-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--border-medium)'
    }}>
      <h3 style={{color: '#667eea', marginBottom: '15px', fontSize: '18px'}}>
        💡 Tips & Best Practices
      </h3>

      <div style={{color: 'var(--text-body)', lineHeight: '1.7', fontSize: '14px'}}>
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
  );
}

export default UploadTipsCard;
