import React from 'react';
import { StatCardSkeleton } from './StatCardSkeleton';
import { AccountCardSkeleton } from './AccountCardSkeleton';
import { TableSkeleton } from './TableSkeleton';

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-8" role="status" aria-label="Loading dashboard">
      {/* Total Balance Summary Skeleton */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6">
        <div className="skeleton h-5 w-32 mb-2 bg-white/30"></div>
        <div className="skeleton h-10 w-48 mb-2 bg-white/30"></div>
        <div className="skeleton h-4 w-40 bg-white/20"></div>
      </div>

      {/* Stats Cards Grid */}
      <div>
        <div className="skeleton h-6 w-32 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      </div>

      {/* Account Cards */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <div className="skeleton h-7 w-40"></div>
          <div className="skeleton skeleton-button w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AccountCardSkeleton />
          <AccountCardSkeleton />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="skeleton h-7 w-32 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="skeleton h-24 rounded-lg"></div>
          <div className="skeleton h-24 rounded-lg"></div>
          <div className="skeleton h-24 rounded-lg"></div>
        </div>
      </div>

      {/* Recent Transactions */}
      <TableSkeleton rows={5} showHeader={true} />
      
      <span className="sr-only">Loading dashboard content, please wait</span>
    </div>
  );
};