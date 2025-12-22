import React from 'react';

function EmptyState({ icon: Icon, title, description, actionButton }) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      {Icon && (
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--bg-secondary)',
          border: '2px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px'
        }}>
          <Icon size={40} color="var(--text-muted)" strokeWidth={1.5} />
        </div>
      )}
      <div>
        <h3 style={{
          color: 'var(--text-heading)',
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '8px'
        }}>
          {title}
        </h3>
        {description && (
          <p style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            lineHeight: '1.6',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            {description}
          </p>
        )}
      </div>
      {actionButton && (
        <div style={{ marginTop: '10px' }}>
          {actionButton}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
