import { motion } from 'framer-motion';
import { useAccounts } from '../hooks/useAccounts';
import { 
  FintechAccountCard, 
  FintechSidebar, 
  FintechTopNav, 
  StatsCard, 
  TransactionList,
  FintechChart 
} from '../components/fintech';
import { dummyTransactions } from '../data/dummyTransactions';
import { monthlyData } from '../data/chartData';

export const FintechDashboard = () => {
  const { accounts, recentTransactions, accountsLoading } = useAccounts();

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeAccounts = accounts.filter(acc => acc.isActive).length;

  const displayTransactions = recentTransactions.length > 0 
    ? recentTransactions.slice(0, 5).map(txn => ({
        id: txn.id.toString(),
        description: txn.description,
        amount: txn.amount,
        isCredit: txn.isCredit,
        date: txn.createdAt,
        status: txn.status as 'Success' | 'Pending' | 'Failed',
        category: txn.transactionType,
      }))
    : dummyTransactions.slice(0, 5).map(txn => ({
        id: txn.id.toString(),
        description: txn.description,
        amount: txn.amount,
        isCredit: txn.isCredit,
        date: txn.createdAt,
        status: txn.status as 'Success' | 'Pending' | 'Failed',
        category: txn.transactionType,
      }));

  return (
    <div className="min-h-screen bg-zinc-50">
      <FintechSidebar />
      
      <div className="lg:pl-64">
        <FintechTopNav />
        
        <main className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-semibold text-zinc-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-zinc-500 mt-1">
              Welcome back! Here's your financial overview
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Balance"
              value={new Intl.NumberFormat('en-PK', {
                style: 'currency',
                currency: 'PKR',
                notation: 'compact',
              }).format(totalBalance)}
              change="+12.5%"
              changeType="positive"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            
            <StatsCard
              title="Active Accounts"
              value={activeAccounts.toString()}
              change="+2"
              changeType="positive"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
            
            <StatsCard
              title="This Month"
              value="PKR 45.2k"
              change="-8.3%"
              changeType="negative"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
            
            <StatsCard
              title="Transactions"
              value={displayTransactions.length.toString()}
              change="24 pending"
              changeType="neutral"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
          </div>

          {/* Accounts Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900">Your Accounts</h2>
                <p className="text-sm text-zinc-500 mt-0.5">Manage your banking accounts</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-fintech btn-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Account
              </motion.button>
            </div>

            {accountsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-white rounded-2xl border border-zinc-200/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {accounts.map((account) => (
                  <FintechAccountCard
                    key={account.id}
                    accountNumber={account.accountNumber}
                    type={account.accountType}
                    balance={account.balance}
                    isActive={account.isActive}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Charts and Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FintechChart
                data={monthlyData}
                title="Financial Overview"
                subtitle="Income vs Expenses over the last 6 months"
              />
            </div>
            
            <div className="lg:col-span-1">
              <TransactionList transactions={displayTransactions} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
