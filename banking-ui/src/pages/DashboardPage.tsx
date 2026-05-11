import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../components/ui/Toast';
import { PageWrapper } from '../components/layout/PageWrapper';
import { AccountCard, TransferModal, DepositModal, WithdrawModal, IncomeExpenseChart, BalanceTrendChart } from '../components/banking';
import { AccountCardSkeleton, TransactionRowSkeleton, ErrorCard, EmptyState } from '../components/ui';
import { dummyTransactions } from '../data/dummyTransactions';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatAmount = (amount: number, isCredit: boolean) => {
  const formatted = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount);
  return (
    <span className={isCredit ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
      {isCredit ? '+' : '-'} {formatted}
    </span>
  );
};

const STATUS_COLORS: Record<string, string> = {
  Success: 'bg-green-100 text-green-800',
  Completed: 'bg-green-100 text-green-800',
  Pending: 'bg-yellow-100 text-yellow-800',
  Failed: 'bg-red-100 text-red-800',
};

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const showToast = useToast();
  const [showTransfer, setShowTransfer] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  const {
    accounts,
    recentTransactions,
    accountsLoading,
    transactionsLoading,
    accountsError,
    transactionsError,
    refetchAccounts,
  } = useAccounts();

  const displayTransactions = recentTransactions.length > 0 ? recentTransactions : dummyTransactions;

  return (
    <PageWrapper title="Banking Dashboard">
      <div className="dashboard-container">

        {/* Accounts Section */}
        <div className="section">
          <h2 className="section-title">Your Accounts</h2>

          {accountsLoading && (
            <div className="accounts-grid">
              {[1, 2, 3].map((i) => <AccountCardSkeleton key={i} />)}
            </div>
          )}

          {accountsError && (
            <ErrorCard
              message="Failed to load accounts. Please check your connection."
              onRetry={() => refetchAccounts()}
            />
          )}

          {!accountsLoading && accounts.length > 0 && (
            <div className="accounts-grid">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  accountNumber={account.accountNumber}
                  type={account.accountType}
                  balance={account.balance}
                  isActive={account.isActive}
                />
              ))}
            </div>
          )}

          {!accountsLoading && !accountsError && accounts.length === 0 && (
            <EmptyState
              icon="accounts"
              title="No accounts yet"
              description="Open your first bank account to start managing your finances."
              actionLabel="Create Your First Account"
              onAction={() => navigate('/new-account')}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div className="section">
          <h3 className="section-title">Quick Actions</h3>
          <div className="actions-grid">
            {[
              { label: 'Transfer Money', color: 'bg-blue-600 hover:bg-blue-700', onClick: () => setShowTransfer(true), icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
              { label: 'Deposit', color: 'bg-green-600 hover:bg-green-700', onClick: () => setShowDeposit(true), icon: 'M12 4v16m8-8H4' },
              { label: 'Withdraw', color: 'bg-red-600 hover:bg-red-700', onClick: () => setShowWithdraw(true), icon: 'M20 12H4' },
              { label: 'Transactions', color: 'bg-white hover:bg-gray-50 border border-gray-300 !text-gray-700', onClick: () => navigate('/transactions'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
              { label: 'New Account', color: 'bg-white hover:bg-gray-50 border border-gray-300 !text-gray-700', onClick: () => navigate('/new-account'), icon: 'M12 4v16m8-8H4' },
              ...(user?.role === 'Admin' ? [{ label: 'Admin Panel', color: 'bg-purple-600 hover:bg-purple-700', onClick: () => navigate('/admin'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }] : []),
            ].map(({ label, color, onClick, icon }) => (
              <button
                key={label}
                onClick={onClick}
                className={`card text-center py-6 text-white transition-colors cursor-pointer border-0 ${color}`}
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div className="section">
          <h3 className="section-title">Financial Overview</h3>
          <div className="grid-container">
            <IncomeExpenseChart />
            <BalanceTrendChart />
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="section">
          <h3 className="section-title">Recent Transactions</h3>

          {transactionsLoading && (
            <div className="transactions-container">
              <table className="min-w-full divide-y divide-gray-200">
                <tbody>{[1, 2, 3, 4, 5].map((i) => <TransactionRowSkeleton key={i} />)}</tbody>
              </table>
            </div>
          )}

          {transactionsError && <ErrorCard message="Failed to load recent transactions." />}

          {!transactionsLoading && displayTransactions.length > 0 ? (
            <div className="transactions-container">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Date', 'Type', 'Description', 'Amount', 'Status'].map((h) => (
                        <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${h === 'Amount' ? 'text-right' : h === 'Status' ? 'text-center' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayTransactions.slice(0, 6).map((txn: any) => (
                      <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(txn.createdAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            txn.transactionType === 'Deposit' ? 'bg-green-100 text-green-800' :
                            txn.transactionType === 'Withdrawal' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>{txn.transactionType}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">{txn.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">{formatAmount(txn.amount, txn.isCredit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[txn.status] || 'bg-gray-100 text-gray-800'}`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {recentTransactions.length === 0 && (
                <div className="bg-blue-50 border-t border-blue-200 px-6 py-3">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Demo Data:</span> Real transactions will appear here once you start using your account.
                  </p>
                </div>
              )}
            </div>
          ) : (
            !transactionsLoading && !transactionsError && (
              <EmptyState
                icon="transactions"
                title="No transactions yet"
                description="Your transaction history will appear here once you make your first transfer, deposit, or withdrawal."
                actionLabel="Make a Transfer"
                onAction={() => setShowTransfer(true)}
              />
            )
          )}
        </div>
      </div>

      {/* Modals */}
      {showTransfer && accounts.length > 0 && (
        <TransferModal accounts={accounts} onClose={() => setShowTransfer(false)}
          onSuccess={() => showToast('Transfer completed successfully!', 'success')}
          onError={(msg) => showToast(msg, 'error')} />
      )}
      {showDeposit && accounts.length > 0 && (
        <DepositModal accounts={accounts} onClose={() => setShowDeposit(false)}
          onSuccess={() => showToast('Deposit successful!', 'success')}
          onError={(msg) => showToast(msg, 'error')} />
      )}
      {showWithdraw && accounts.length > 0 && (
        <WithdrawModal accounts={accounts} onClose={() => setShowWithdraw(false)}
          onSuccess={() => showToast('Withdrawal successful!', 'success')}
          onError={(msg) => showToast(msg, 'error')} />
      )}
    </PageWrapper>
  );
};
