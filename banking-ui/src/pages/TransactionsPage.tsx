import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getAccountsApi, getTransactionHistoryApi } from '../api/accounts';
import { formatAccountLabel, formatPKR } from '../utils/formatters';
import { MobileNav } from '../components/layout/MobileNav';
import { TableSkeleton } from '../components/skeletons';

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending:   'bg-yellow-100 text-yellow-800',
  failed:    'bg-red-100 text-red-800',
};

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccountsApi,
    staleTime: 5 * 60_000,
  });

  const accountId = selectedAccountId || accounts?.[0]?.id || '';

  const {
    data: txData,
    isLoading: txLoading,
    error: txError,
    refetch,
  } = useQuery({
    queryKey: ['transactions', accountId, page],
    queryFn: () => getTransactionHistoryApi(accountId, page, 20),
    enabled: !!accountId,
    staleTime: 2 * 60_000,
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleAccountChange = (id: string) => {
    setSelectedAccountId(id);
    setPage(1);
  };

  const handleTypeChange = (type: string) => {
    setTypeFilter(type);
    setPage(1);
  };

  const allTransactions = txData?.data ?? [];
  const filtered = typeFilter
    ? allTransactions.filter((t) => t.type.toLowerCase() === typeFilter.toLowerCase())
    : allTransactions;
  const totalPages = txData?.totalPages ?? 1;

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'withdrawal':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
                aria-label="Open navigation menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 hidden lg:block" aria-label="Back to dashboard">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Transaction History</h1>
                <p className="text-sm text-gray-600 hidden lg:block">View all your transactions</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 hidden lg:inline">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0 space-y-6">

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Transactions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="account-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Account
                </label>
                {accountsLoading ? (
                  <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
                ) : (
                  <select
                    id="account-select"
                    value={selectedAccountId || accountId}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {formatAccountLabel(acc)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction Type
                </label>
                <select
                  id="type-select"
                  value={typeFilter}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Deposit">Deposit</option>
                  <option value="Withdrawal">Withdrawal</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => { setTypeFilter(''); setPage(1); }}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Transactions ({filtered.length}{txData && txData.totalCount > 20 ? `+ of ${txData.totalCount}` : ''})
              </h2>
            </div>

            {!accountId ? (
              <div className="p-6 text-center text-gray-500">
                No accounts found. <Link to="/dashboard" className="text-blue-600 hover:underline">Create one</Link>.
              </div>
            ) : txLoading ? (
              <div className="p-6">
                <TableSkeleton rows={10} showHeader={false} />
              </div>
            ) : txError ? (
              <div className="p-6 text-center">
                <p className="text-red-600 mb-4">Failed to load transactions</p>
                <button onClick={() => refetch()} className="text-blue-600 hover:text-blue-700 font-medium">
                  Try Again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No transactions found</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200" role="list">
                {filtered.map((tx) => (
                  <li key={tx.id} className="p-4 sm:p-6 hover:bg-gray-50">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center space-x-4">
                        {getIcon(tx.type)}
                        <div>
                          <p className="font-medium text-gray-900">{tx.description || tx.type}</p>
                          <p className="text-sm text-gray-500">
                            {tx.type} · {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2">
                        <p className={`font-semibold text-lg ${
                          tx.type.toLowerCase() === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.type.toLowerCase() === 'deposit' ? '+' : '-'}{formatPKR(tx.amount)}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[tx.status.toLowerCase()] ?? 'bg-gray-100 text-gray-800'
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            {!txLoading && !txError && totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
};

export default TransactionsPage;
