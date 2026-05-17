import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../hooks/useAuth';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data for charts
const incomeExpenseData = [
  { month: 'Jan', income: 45000, expense: 32000 },
  { month: 'Feb', income: 52000, expense: 38000 },
  { month: 'Mar', income: 48000, expense: 35000 },
  { month: 'Apr', income: 61000, expense: 42000 },
  { month: 'May', income: 55000, expense: 39000 },
  { month: 'Jun', income: 67000, expense: 45000 },
];

const spendingTrendsData = [
  { category: 'Shopping', amount: 12500, color: '#3B82F6' },
  { category: 'Food', amount: 8500, color: '#10B981' },
  { category: 'Transport', amount: 5500, color: '#F59E0B' },
  { category: 'Bills', amount: 15000, color: '#8B5CF6' },
  { category: 'Others', amount: 3500, color: '#EC4899' },
];

const recentTransactionsData = [
  { id: 1, description: 'Salary Deposit', amount: 55000, type: 'credit', date: '2024-01-15', status: 'completed' },
  { id: 2, description: 'Rent Payment', amount: -15000, type: 'debit', date: '2024-01-14', status: 'completed' },
  { id: 3, description: 'Grocery Shopping', amount: -3500, type: 'debit', date: '2024-01-13', status: 'completed' },
  { id: 4, description: 'Freelance Payment', amount: 12000, type: 'credit', date: '2024-01-12', status: 'completed' },
  { id: 5, description: 'Electricity Bill', amount: -2500, type: 'debit', date: '2024-01-11', status: 'pending' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const PremiumDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { accounts, accountsLoading } = useAccounts();
  const [selectedPeriod, setSelectedPeriod] = useState('6M');

  // Calculate totals
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalIncome = incomeExpenseData.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = incomeExpenseData.reduce((sum, item) => sum + item.expense, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-zinc-200/60 p-3">
        <p className="text-xs font-medium text-zinc-500 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-xs text-zinc-600 capitalize">{entry.name}</span>
            </div>
            <span className="text-xs font-semibold text-zinc-900">
              {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', notation: 'compact' }).format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Quick actions
  const quickActions = [
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      label: 'Transfer',
      action: () => navigate('/transfer'),
      color: 'from-blue-500 to-blue-600'
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      label: 'Deposit',
      action: () => {},
      color: 'from-emerald-500 to-emerald-600'
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      label: 'Pay Bills',
      action: () => {},
      color: 'from-violet-500 to-violet-600'
    },
    { 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      label: 'History',
      action: () => navigate('/transactions'),
      color: 'from-amber-500 to-amber-600'
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-zinc-200/60 sticky top-0 z-10 backdrop-blur-xl bg-white/80"
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name || 'User'} 👋
              </h1>
              <p className="text-sm text-zinc-500 mt-1">Here's your financial overview for today</p>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-sm font-medium transition-colors"
              >
                Export Report
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all"
              >
                New Transaction
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Financial Summary Cards */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Balance */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">+12.5%</span>
              </div>
              <p className="text-sm font-medium text-blue-100 mb-1">Total Balance</p>
              <p className="text-3xl font-bold tracking-tight">
                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', notation: 'compact' }).format(totalBalance)}
              </p>
            </motion.div>

            {/* Total Income */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+8.2%</span>
              </div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Income</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', notation: 'compact' }).format(totalIncome)}
              </p>
            </motion.div>

            {/* Total Expenses */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-red-50 rounded-xl">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">-3.1%</span>
              </div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Total Expenses</p>
              <p className="text-2xl font-semibold text-zinc-900">
                {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', notation: 'compact' }).format(totalExpense)}
              </p>
            </motion.div>

            {/* Savings Rate */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-violet-50 rounded-xl">
                  <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-violet-600 bg-violet-50 px-2 py-1 rounded-full">Healthy</span>
              </div>
              <p className="text-sm font-medium text-zinc-500 mb-1">Savings Rate</p>
              <p className="text-2xl font-semibold text-zinc-900">{savingsRate}%</p>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={action.action}
                  className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <p className="text-sm font-medium text-zinc-900">{action.label}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income vs Expense Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Income vs Expenses</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Last 6 months overview</p>
                </div>
                <div className="flex items-center gap-2">
                  {['1M', '3M', '6M', '1Y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        selectedPeriod === period
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-zinc-500 hover:bg-zinc-50'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={incomeExpenseData}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#A1A1AA', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#A1A1AA', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} fill="url(#incomeGradient)" />
                  <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2} fill="url(#expenseGradient)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-zinc-600">Income</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-zinc-600">Expenses</span>
                </div>
              </div>
            </motion.div>

            {/* Spending Trends */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 border border-zinc-200/60 shadow-sm">
              <h3 className="text-lg font-semibold text-zinc-900 mb-1">Spending by Category</h3>
              <p className="text-sm text-zinc-500 mb-6">This month breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={spendingTrendsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="amount"
                  >
                    {spendingTrendsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 mt-4">
                {spendingTrendsData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-zinc-600">{item.category}</span>
                    </div>
                    <span className="text-sm font-semibold text-zinc-900">
                      {new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', notation: 'compact' }).format(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Transactions */}
          <motion.div variants={itemVariants} className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Recent Transactions</h3>
                  <p className="text-sm text-zinc-500 mt-0.5">Your latest account activity</p>
                </div>
                <button 
                  onClick={() => navigate('/transactions')}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  View all →
                </button>
              </div>
            </div>
            <div className="divide-y divide-zinc-100">
              {recentTransactionsData.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${
                      transaction.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {transaction.type === 'credit' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 truncate">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-zinc-500">
                              {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                            <span className="text-zinc-300">•</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-semibold ${transaction.type === 'credit' ? 'text-emerald-600' : 'text-zinc-900'}`}>
                            {transaction.type === 'credit' ? '+' : ''}{new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(transaction.amount)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};
