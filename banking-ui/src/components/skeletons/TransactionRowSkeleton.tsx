import React from 'react';

export const TransactionRowSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center space-x-4 flex-1">
        {/* Icon placeholder */}
        <div className="skeleton skeleton-circle w-10 h-10"></div>
        
        {/* Text content placeholder */}
        <div className="flex-1">
          {/* Title placeholder */}
          <div className="skeleton h-4 w-48 mb-2"></div>
          
          {/* Subtitle placeholder */}
          <div className="skeleton h-3 w-32"></div>
        </div>
      </div>
      
      {/* Right side content */}
      <div className="text-right">
        {/* Amount placeholder */}
        <div className="skeleton h-5 w-24 mb-2"></div>
        
        {/* Badge placeholder */}
        <div className="skeleton h-5 w-20"></div>
      </div>
    </div>
  );
};