import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { TableSkeleton } from '../components/skeletons';
import { MobileNav } from '../components/layout/MobileNav';

type TabType = 'users' | 'transactions' | 'audit-logs';

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Mock queries for each tab - replace with actual API calls
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [];
    },
    enabled: activeTab === 'users'
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: async () => {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [];
    },
    enabled: activeTab === 'transactions'
  });

  const { data: auditLogsData, isLoading: auditLogsLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return [];
    },
    enabled: activeTab === 'audit-logs'
  });

  const tabs = [
    { id: 'users' as TabType, label: 'Users', icon: '👥' },
    { id: 'transactions' as TabType, label: 'Transactions', icon: '💸' },
    { id: 'audit-logs' as TabType, label: 'Audit Logs', icon: '📋' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'users':
        if (usersLoading) return <TableSkeleton rows={6} showHeader={false} />;
        return (
          <div className="text-center py-8 text-gray-500">
            <p>User management coming soon...</p>
          </div>
        );
      
      case 'transactions':
        if (transactionsLoading) return <TableSkeleton rows={6} showHeader={false} />;
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Transaction monitoring coming soon...</p>
          </div>
        );
      
      case 'audit-logs':
        if (auditLogsLoading) return <TableSkeleton rows={6} showHeader={false} />;
        return (
          <div className="text-center py-8 text-gray-500">
            <p>Audit logs coming soon...</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 hide-mobile">Manage users and monitor system</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 hide-mobile" aria-label={`Logged in as ${user?.name}`}>
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                aria-label="Logout from your account"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" role="main">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav 
                className="flex overflow-x-auto -mb-px" 
                aria-label="Admin tabs"
                role="tablist"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    id={`${tab.id}-tab`}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div 
              className="p-6"
              role="tabpanel"
              id={`${activeTab}-panel`}
              aria-labelledby={`${activeTab}-tab`}
            >
              {renderTabContent()}
            </div>
          </div>

        </div>
      </main>

      {/* Mobile Navigation */}
      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
};