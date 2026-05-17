import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Zap,
  MoreHorizontal,
  TrendingUp,
} from 'lucide-react';

// Category data with icons
const categoryData = [
  {
    category: 'Shopping',
    amount: 12500,
    color: '#3B82F6',
    icon: ShoppingBag,
    percentage: 27.8,
  },
  {
    category: 'Food & Dining',
    amount: 8500,
    color: '#10B981',
    icon: Utensils,
    percentage: 18.9,
  },
  {
    category: 'Transport',
    amount: 5500,
    color: '#F59E0B',
    icon: Car,
    percentage: 12.2,
  },
  {
    category: 'Bills & Utilities',
    amount: 15000,
    color: '#8B5CF6',
    icon: Zap,
    percentage: 33.3,
  },
  {
    category: 'Housing',
    amount: 2500,
    color: '#EC4899',
    icon: Home,
    percentage: 5.6,
  },
  {
    category: 'Others',
    amount: 1000,
    color: '#6B7280',
    icon: MoreHorizontal,
    percentage: 2.2,
  },
];

const formatPKR = (value: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

// Active shape for hover effect
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
    </g>
  );
};

export const SpendingCategoriesChart = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const totalSpending = categoryData.reduce((sum, item) => sum + item.amount, 0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-zinc-100">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">
              Spending by Category
            </h3>
            <p className="text-sm text-zinc-500">This month breakdown</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              {formatPKR(totalSpending)}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-8">
          {/* Donut Chart */}
          <div className="relative">
            <ResponsiveContainer width={240} height={240}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="amount"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  animationBegin={0}
                  animationDuration={800}
                >
                  {categoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedCategory(index)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xs font-medium text-zinc-500 mb-1">Total</p>
                <p className="text-xl font-bold text-zinc-900">
                  {formatPKR(totalSpending).replace('PKR', '').trim()}
                </p>
              </div>
            </div>
          </div>

          {/* Category List */}
          <div className="flex-1 w-full space-y-2">
            <AnimatePresence mode="wait">
              {categoryData.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeIndex === index || selectedCategory === index;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    onClick={() => setSelectedCategory(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-zinc-50 shadow-sm scale-[1.02]'
                        : 'hover:bg-zinc-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {item.category}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${item.percentage}%` }}
                              transition={{ duration: 0.8, delay: index * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                          </div>
                          <span className="text-xs font-medium text-zinc-500">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatPKR(item.amount)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-violet-50 rounded-xl">
          <div>
            <p className="text-xs font-medium text-zinc-600 mb-1">Top Category</p>
            <p className="text-sm font-semibold text-zinc-900">
              {categoryData[0].category}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-zinc-600 mb-1">Amount</p>
            <p className="text-sm font-semibold text-blue-600">
              {formatPKR(categoryData[0].amount)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
