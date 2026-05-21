import React from 'react';

interface NetworkErrorProps {
  onRetry?: () => void;
}

export const NetworkError: React.FC<NetworkErrorProps> = ({ onRetry }) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
          <svg className="h-6 w-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2v6m0 8v6m10-10h-6M8 12H2" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">Cannot connect to server</h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Make sure the banking API is running on localhost:7001
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};