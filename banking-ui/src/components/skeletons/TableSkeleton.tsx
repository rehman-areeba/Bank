import React from 'react';
import { TransactionRowSkeleton } from './TransactionRowSkeleton';

interface TableSkeletonProps {
  rows?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ 
  rows = 5,
  showHeader = true 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md" role="status" aria-label="Loading transactions">
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="skeleton h-6 w-48"></div>
        </div>
      )}
      
      <div className="p-6">
        <div className="space-y-0">
          {Array.from({ length: rows }).map((_, index) => (
            <TransactionRowSkeleton key={index} />
          ))}
        </div>
      </div>
      
      <span className="sr-only">Loading transaction data, please wait</span>
    </div>
  );
};