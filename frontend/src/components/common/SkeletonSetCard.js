import React from 'react';

function SkeletonSetCard() {
  return (
    <div className="set-card" style={{ pointerEvents: 'none', opacity: 0.6 }}>
      {/* Title Skeleton */}
      <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '15px', borderRadius: '0' }}></div>

      {/* Meta Info Skeletons */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div className="skeleton" style={{ height: '16px', width: '50px', borderRadius: '0' }}></div>
        <div className="skeleton" style={{ height: '16px', width: '50px', borderRadius: '0' }}></div>
        <div className="skeleton" style={{ height: '16px', width: '80px', borderRadius: '0' }}></div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className="progress-bar">
        <div className="skeleton" style={{ height: '100%', width: '45%', borderRadius: 'inherit' }}></div>
      </div>
    </div>
  );
}

export default SkeletonSetCard;
