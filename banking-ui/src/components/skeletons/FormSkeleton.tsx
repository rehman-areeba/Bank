import React from 'react';

interface FormSkeletonProps {
  fields?: number;
  showTitle?: boolean;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ 
  fields = 4,
  showTitle = true 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6" role="status" aria-label="Loading form">
      {showTitle && (
        <div className="mb-6">
          <div className="skeleton h-7 w-48 mb-2"></div>
          <div className="skeleton h-4 w-64"></div>
        </div>
      )}

      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, index) => (
          <div key={index}>
            {/* Label placeholder */}
            <div className="skeleton h-4 w-32 mb-2"></div>
            
            {/* Input placeholder */}
            <div className="skeleton h-10 w-full"></div>
          </div>
        ))}

        {/* Button placeholder */}
        <div className="skeleton skeleton-button w-full mt-6"></div>
      </div>
      
      <span className="sr-only">Loading form, please wait</span>
    </div>
  );
};