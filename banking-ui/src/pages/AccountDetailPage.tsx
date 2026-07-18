import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAccountApi, getTransactionHistoryApi } from '../api/accounts';
import { useAuthStore } from '../store/authStore';
import { formatPKR, maskAccountNumber } from '../utils/formatters';
import { DepositWithdrawModal } from '../components/banking/DepositWithdrawModal';
import { MobileNav } from '../components/layout/MobileNav';
import ErrorState from '../components/ui/ErrorState';

const statusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending':   return 'bg-yellow-100 text-yellow-800';
    case 'failed':    return 'bg-red-100 text-red-800';
    default:          return 'bg-gray-100 text-gray-800';
  }
};

const txAmountColor = (type: string) =>
  type.toLowerCase() === 'deposit' ? 'text-green-600' : 'text-red-600';

const AccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [modal, setModal] = useState<'deposit' | 'withdraw' | null>(null);
  const [page, setPage] = useState(1);

  const {
    data: account,
    isLoading: accountLoading,
    error: accountError,
    refetch: refetchAccount,
  } = useQuery({
    queryKey: ['account', id],
    queryFn: () => getAccountApi(id!),
    enabled: !!id,
    staleTime: 60_000,
  });

  const {
    data: txData,
    isLoading: txLoading,
    error: txError,
    refetch: refetchTx,
  } = useQuery({
    queryKey: ['transactions', id, page],
    queryFn: () => getTransactionHistoryApi(id!, page, 10),
    enabled: !!id,
    staleTime: 60_000,
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  if (accountLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading account details...</div>
      </div>
    );
  }

  if (accountError || !account) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <ErrorState
          title="Account not found"
          message="This account doesn't exist or you don't have access to it."
          onRetry={refetchAccount}
        />
      </div>
    );
  }

  const transactions = txData?.data ?? [];
  const totalPages = txData?.totalPages ?? 1;

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
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700" aria-label="Back to dashboard">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{account.accountType} Account</h1>
                <p className="text-sm text-gray-500">{maskAccountNumber(account.accountNumber)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 hidden lg:inline">{user?.name || user?.email}</span>
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

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6" role="main">

        {/* Balance Card */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm mb-1">Current Balance</p>
              <p className="text-4xl font-bold">{formatPKR(account.balance)}</p>
              <p className="text-blue-100 text-sm mt-2">Account: {account.accountNumber}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {account.isActive ? 'Active' : 'Frozen'}
            </span>
          </div>
        </section>

        {/* Action Buttons */}
        {account.isActive && (
          <section className="grid grid-cols-3 gap-4" aria-label="Account actions">
            <button
              onClick={() => setModal('deposit')}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
              aria-label="Deposit funds"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Deposit</span>
            </button>

            <button
              onClick={() => setModal('withdraw')}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center"
              aria-label="Withdraw funds"
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Withdraw</span>
            </button>

            <Link
              to="/transfer"
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow text-center block"
              aria-label="Transfer money"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-900">Transfer</span>
            </Link>
          </section>
        )}

        {/* Account Info */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-gray-500">Account Type</dt>
              <dd className="text-sm font-medium text-gray-900">{account.accountType}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Account Number</dt>
              <dd className="text-sm font-mono text-gray-900">{account.accountNumber}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Status</dt>
              <dd className="text-sm font-medium text-gray-900">{account.isActive ? 'Active' : 'Frozen'}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Opened</dt>
              <dd className="text-sm text-gray-900">{new Date(account.createdAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </section>

        {/* Transaction History */}
        <section className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Transaction History</h2>
            <Link to="/transactions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </Link>
          </div>

          {txLoading && (
            <div className="p-6 text-center text-gray-500">Loading transactions...</div>
          )}
          {txError && (
            <div className="p-6 text-center">
              <p className="text-red-600 mb-2">Failed to load transactions</p>
              <button onClick={() => refetchTx()} className="text-blue-600 text-sm hover:underline">Retry</button>
            </div>
          )}
          {!txLoading && !txError && transactions.length === 0 && (
            <div className="p-6 text-center text-gray-500">No transactions yet.</div>
          )}
          {transactions.length > 0 && (
            <>
              <ul className="divide-y divide-gray-100" role="list">
                {transactions.map((tx) => (
                  <li key={tx.id} className="px-6 py-4 flex items-center justify-between" role="listitem">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description || tx.type}</p>
                      <p className="text-xs text-gray-500">
                        {tx.type} · {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${txAmountColor(tx.type)}`}>
                        {tx.type.toLowerCase() === 'deposit' ? '+' : '-'}{formatPKR(Math.abs(tx.amount))}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Deposit / Withdraw Modal */}
      {modal && (
        <DepositWithdrawModal
          isOpen={true}
          onClose={() => setModal(null)}
          mode={modal}
          accountId={account.id}
          currentBalance={account.balance}
        />
      )}

      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
};

export default AccountDetailPage;
