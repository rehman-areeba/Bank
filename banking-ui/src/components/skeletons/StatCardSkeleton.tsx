import React from 'react';

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6" role="status" aria-label="Loading statistics">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {/* Label placeholder */}
          <div className="skeleton h-3 w-20 mb-3"></div>
          
          {/* Value placeholder */}
          <div className="skeleton h-7 w-32 mb-2"></div>
          
          {/* Change placeholder */}
          <div className="skeleton h-2.5 w-16"></div>
        </div>
        
        {/* Icon placeholder */}
        <div className="skeleton skeleton-circle w-11 h-11"></div>
      </div>
      <span className="sr-only">Loading statistics, please wait</span>
    </div>
  );
};