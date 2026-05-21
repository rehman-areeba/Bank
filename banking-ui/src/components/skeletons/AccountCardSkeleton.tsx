import React from 'react';

export const AccountCardSkeleton: React.FC = () => {
  return (
    <div 
      className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white"
      role="status"
      aria-label="Loading account information"
    >
      {/* Account type badge placeholder */}
      <div className="flex justify-between items-start mb-4">
        <div className="skeleton h-6 w-24 bg-white/20"></div>
        <div className="skeleton h-6 w-16 bg-white/20"></div>
      </div>
      
      {/* Balance label placeholder */}
      <div className="skeleton h-3 w-20 mb-2 bg-white/30"></div>
      
      {/* Balance amount placeholder */}
      <div className="skeleton h-10 w-40 mb-4 bg-white/30"></div>
      
      {/* Account number placeholder */}
      <div className="skeleton h-4 w-32 bg-white/20"></div>
      
      <span className="sr-only">Loading account details, please wait</span>
    </div>
  );
};