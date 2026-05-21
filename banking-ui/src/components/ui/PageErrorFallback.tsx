import React from 'react';

interface PageErrorFallbackProps {
  title?: string;
  error?: Error | null;
  onRetry?: () => void;
}

export const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({
  title = "Failed to load",
  error,
  onRetry
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        
        {error && (
          <p className="text-sm text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};