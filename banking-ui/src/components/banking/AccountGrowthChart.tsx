import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Award, Calendar } from 'lucide-react';

// Generate growth data
const generateGrowthData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  let balance = 25000;
  const target = 100000;

  return months.map((month, index) => {
    const growth = Math.random() * 8000 + 3000;
    balance += growth;
    return {
      month,
      balance: Math.round(balance),
      target,
      growth: Math.round(growth),
    };
  });
};

const growthData = generateGrowthData();

const formatPKR = (value: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatCompact = (value: number) =>
  new Intl.NumberFormat('en-PK', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);

// Premium Custom Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const balance = payload.find((p: any) => p.dataKey === 'balance')?.value || 0;
  const growth = payload.find((p: any) => p.dataKey === 'growth')?.value || 0;
  const target = payload.find((p: any) => p.dataKey === 'target')?.value || 0;
  const progress = ((balance / target) * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-2xl border border-zinc-200/60 p-4 min-w-[200px]"
    >
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100">
        <Calendar className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-semibold text-zinc-900">{label}</span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Account Balance</p>
          <p className="text-xl font-bold text-blue-600">{formatPKR(balance)}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
          <div>
            <p className="text-xs font-medium text-zinc-500 mb-1">Monthly Growth</p>
            <p className="text-sm font-semibold text-emerald-600">+{formatPKR(growth)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-zinc-500 mb-1">Target Progress</p>
            <p className="text-sm font-semibold text-violet-600">{progress}%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const AccountGrowthChart = () => {
  const [selectedMetric, setSelectedMetric] = useState<'balance' | 'growth'>('balance');

  const currentBalance = growthData[growthData.length - 1].balance;
  const startBalance = growthData[0].balance;
  const totalGrowth = currentBalance - startBalance;
  const growthPercent = ((totalGrowth / startBalance) * 100).toFixed(1);
  const target = growthData[0].target;
  const targetProgress = ((currentBalance / target) * 100).toFixed(1);
  const avgMonthlyGrowth =
    growthData.reduce((sum, item) => sum + item.growth, 0) / growthData.length;

  const metrics = [
    { key: 'balance' as const, label: 'Balance' },
    { key: 'growth' as const, label: 'Growth' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm hover:shadow-md transition-all overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-zinc-100">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">Account Growth</h3>
            <p className="text-sm text-zinc-500">Year-to-date performance</p>
          </div>
          <div className="flex items-center gap-2">
            {metrics.map((metric) => (
              <button
                key={metric.key}
                onClick={() => setSelectedMetric(metric.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedMetric === metric.key
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                {metric.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Total Growth</span>
            </div>
            <p className="text-base font-bold text-blue-900">{formatCompact(totalGrowth)}</p>
            <p className="text-xs text-blue-600 mt-0.5">+{growthPercent}%</p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Avg Monthly</span>
            </div>
            <p className="text-base font-bold text-emerald-900">
              {formatCompact(avgMonthlyGrowth)}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Per month</p>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-medium text-violet-700">Target</span>
            </div>
            <p className="text-base font-bold text-violet-900">{targetProgress}%</p>
            <p className="text-xs text-violet-600 mt-0.5">of {formatCompact(target)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="balanceLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="growthLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={selectedMetric === 'balance' ? '#3B82F6' : '#10B981'}
                  stopOpacity={0.2}
                />
                <stop
                  offset="100%"
                  stopColor={selectedMetric === 'balance' ? '#3B82F6' : '#10B981'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F4F4F5"
              vertical={false}
              strokeOpacity={0.5}
            />

            <XAxis
              dataKey="month"
              tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />

            <YAxis
              yAxisId="left"
              tickFormatter={(value) => formatCompact(value)}
              tick={{ fill: '#71717A', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={60}
              dx={-5}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '5 5' }} />

            {/* Target line */}
            <ReferenceLine
              yAxisId="left"
              y={target}
              stroke="#8B5CF6"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{
                value: 'Target',
                position: 'right',
                fill: '#8B5CF6',
                fontSize: 11,
                fontWeight: 600,
              }}
            />

            {/* Area fill */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey={selectedMetric}
              fill="url(#areaGradient)"
              stroke="none"
              animationDuration={800}
            />

            {/* Main line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey={selectedMetric}
              stroke={
                selectedMetric === 'balance'
                  ? 'url(#balanceLineGradient)'
                  : 'url(#growthLineGradient)'
              }
              strokeWidth={3}
              dot={{
                r: 4,
                fill: '#fff',
                strokeWidth: 2,
                stroke: selectedMetric === 'balance' ? '#3B82F6' : '#10B981',
              }}
              activeDot={{
                r: 6,
                fill: selectedMetric === 'balance' ? '#3B82F6' : '#10B981',
                stroke: '#fff',
                strokeWidth: 3,
              }}
              animationDuration={1000}
              animationBegin={0}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-violet-50 to-blue-50 rounded-xl">
          <div>
            <p className="text-xs font-medium text-zinc-600 mb-1">Current Balance</p>
            <p className="text-lg font-bold text-zinc-900">{formatPKR(currentBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-zinc-600 mb-1">To Reach Target</p>
            <p className="text-lg font-bold text-violet-600">
              {formatPKR(target - currentBalance)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
