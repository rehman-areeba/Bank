import { motion } from 'framer-motion';
import { PageWrapper } from '../components/layout/PageWrapper';
import {
  IncomeExpenseChart,
  BalanceTrendChart,
  SpendingCategoriesChart,
  AccountGrowthChart,
} from '../components/banking';
import { BarChart3, TrendingUp, PieChart, LineChart } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const AnalyticsPage = () => {
  const stats = [
    {
      icon: BarChart3,
      label: 'Total Charts',
      value: '4',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: TrendingUp,
      label: 'Data Points',
      value: '120+',
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      icon: PieChart,
      label: 'Categories',
      value: '6',
      color: 'from-violet-500 to-violet-600',
    },
    {
      icon: LineChart,
      label: 'Time Range',
      value: '12M',
      color: 'from-amber-500 to-amber-600',
    },
  ];

  return (
    <PageWrapper title="Financial Analytics" backTo="/dashboard" backLabel="Dashboard">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -4, scale: 1.02 }}
                className="bg-white rounded-xl p-5 border border-zinc-200/60 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white flex-shrink-0`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Grid */}
        <div className="space-y-6">
          {/* Row 1: Income vs Expense */}
          <motion.div variants={itemVariants}>
            <IncomeExpenseChart />
          </motion.div>

          {/* Row 2: Balance Trend */}
          <motion.div variants={itemVariants}>
            <BalanceTrendChart />
          </motion.div>

          {/* Row 3: Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
              <SpendingCategoriesChart />
            </motion.div>
            <motion.div variants={itemVariants}>
              <AccountGrowthChart />
            </motion.div>
          </div>
        </div>

        {/* Footer Info */}
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-r from-blue-50 via-violet-50 to-pink-50 rounded-2xl p-8 border border-zinc-200/60"
        >
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">
              Premium Fintech Analytics
            </h3>
            <p className="text-zinc-600 mb-6">
              Enterprise-grade financial visualizations with smooth animations, interactive
              tooltips, and modern design inspired by Stripe and leading fintech platforms.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-zinc-600">Real-time Updates</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-zinc-600">Interactive Charts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-zinc-600">Responsive Design</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
};
