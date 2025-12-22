import React from 'react';

export function SkeletonSetCard() {
  return (
    <div className="set-card" style={{ pointerEvents: 'none', opacity: 0.6 }}>
      {/* Title Skeleton */}
      <div className="skeleton" style={{ height: '24px', width: '60%', marginBottom: '15px', borderRadius: '6px' }}></div>

      {/* Meta Info Skeletons */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <div className="skeleton" style={{ height: '16px', width: '50px', borderRadius: '4px' }}></div>
        <div className="skeleton" style={{ height: '16px', width: '50px', borderRadius: '4px' }}></div>
        <div className="skeleton" style={{ height: '16px', width: '80px', borderRadius: '4px' }}></div>
      </div>

      {/* Progress Bar Skeleton */}
      <div className="progress-bar">
        <div className="skeleton" style={{ height: '100%', width: '45%', borderRadius: 'inherit' }}></div>
      </div>
    </div>
  );
}

export default SkeletonSetCard;
