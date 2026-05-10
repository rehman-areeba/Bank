import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAccountsApi, getRecentTransactionsApi } from '../api/accounts';
import { BalanceCard } from '../components/BalanceCard';
import { useAuthStore } from '../store/authStore';
import { dummyTransactions } from '../data/dummyTransactions';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const {
    data: accounts,
    isLoading: accountsLoading,
    error: accountsError,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccountsApi,
  });

  const {
    data: transactions,
    isLoading: transactionsLoading,
    error: transactionsError,
  } = useQuery({
    queryKey: ['recentTransactions'],
    queryFn: () => getRecentTransactionsApi(5),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number, isCredit: boolean) => {
    const formatted = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(amount);

    return (
      <span className={isCredit ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
        {isCredit ? '+' : '-'} {formatted}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      Success: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  // Use dummy transactions if no real transactions available
  const displayTransactions = transactions?.items?.length > 0 ? transactions.items : dummyTransactions;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Banking Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        {/* Accounts Section */}
        <div className="section">
          <h2 className="section-title">Your Accounts</h2>

          {accountsLoading && (
            <div className="accounts-grid">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          )}

          {accountsError && (
            <div className="card bg-red-50 border border-red-200">
              <p className="text-red-700 mb-4">Failed to load accounts</p>
              <button
                onClick={() => refetchAccounts()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          )}

          {accounts && accounts.length > 0 && (
            <div className="accounts-grid">
              {accounts.map((account: any) => (
                <BalanceCard
                  key={account.id}
                  accountNumber={account.accountNumber}
                  type={account.accountType}
                  balance={account.balance}
                  isActive={account.isActive}
                />
              ))}
            </div>
          )}

          {accounts && accounts.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-gray-600 mb-4">No accounts found</p>
              <button
                onClick={() => navigate('/new-account')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Account
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions Section */}
        <div className="section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="actions-grid">
            <button
              onClick={() => navigate('/transfer')}
              className="card text-center py-6 bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer border-0"
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="font-medium">Transfer Money</span>
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="card text-center py-6 bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-300"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium text-gray-700">View Transactions</span>
            </button>
            {user?.role === 'Admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="card text-center py-6 bg-purple-600 text-white hover:bg-purple-700 transition-colors cursor-pointer border-0"
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Admin Panel</span>
              </button>
            )}
            <button
              onClick={() => navigate('/new-account')}
              className="card text-center py-6 bg-white hover:bg-gray-50 transition-colors cursor-pointer border border-gray-300"
            >
              <svg className="w-8 h-8 mx-auto mb-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium text-gray-700">New Account</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions Section */}
        <div className="section">
          <h3 className="section-title">Recent Transactions</h3>

          {transactionsLoading && (
            <div className="card">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-4 border-b border-gray-200 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {transactionsError && (
            <div className="card text-center py-8">
              <p className="text-gray-600">Failed to load recent transactions</p>
            </div>
          )}

          {displayTransactions && displayTransactions.length > 0 ? (
            <div className="transactions-container">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayTransactions.slice(0, 6).map((txn: any) => (
                      <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(txn.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            txn.transactionType === 'Deposit' ? 'bg-green-100 text-green-800' :
                            txn.transactionType === 'Withdrawal' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {txn.transactionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{txn.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          {formatAmount(txn.amount, txn.isCredit)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {getStatusBadge(txn.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!transactions?.items?.length && (
                <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Demo Data:</span> These are sample transactions. Real transactions will appear here once you start using your account.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
