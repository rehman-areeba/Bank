import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react';
import { balanceTrendData } from '../../data/chartData';

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

  const value = payload[0].value;
  const previousValue = payload[0].payload.previousBalance || value;
  const change = value - previousValue;
  const changePercent = previousValue !== 0 ? ((change / previousValue) * 100).toFixed(2) : '0.00';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white rounded-xl shadow-2xl border border-zinc-200/60 p-4 min-w-[220px]"
    >
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-zinc-100">
        <Calendar className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-semibold text-zinc-900">{label}</span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-1">Balance</p>
          <p className="text-2xl font-bold text-blue-600">{formatPKR(value)}</p>
        </div>

        {change !== 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-1.5">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className="text-xs font-medium text-zinc-600">Change</span>
            </div>
            <div className="text-right">
              <p className={`text-sm font-bold ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{formatPKR(change)}
              </p>
              <p className={`text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{changePercent}%
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Custom Dot for active point
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload.isActive) return null;

  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#3B82F6" opacity={0.2} />
      <circle cx={cx} cy={cy} r={5} fill="#3B82F6" stroke="#fff" strokeWidth={2} />
    </g>
  );
};

export const BalanceTrendChart = () => {
  const [selectedRange, setSelectedRange] = useState('30D');
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Calculate statistics
  const balances = balanceTrendData.map((d) => d.balance);
  const currentBalance = balances[balances.length - 1];
  const startBalance = balances[0];
  const minBalance = Math.min(...balances);
  const maxBalance = Math.max(...balances);
  const avgBalance = balances.reduce((a, b) => a + b, 0) / balances.length;
  const totalChange = currentBalance - startBalance;
  const changePercent = ((totalChange / startBalance) * 100).toFixed(2);

  // Add previous balance for change calculation
  const enrichedData = balanceTrendData.map((item, index) => ({
    ...item,
    previousBalance: index > 0 ? balanceTrendData[index - 1].balance : item.balance,
    isActive: index === hoveredPoint,
  }));

  const ranges = ['7D', '30D', '90D', '1Y'];

  // Show only every nth label to avoid crowding
  const tickFormatter = (_: any, index: number) => {
    const interval = Math.ceil(balanceTrendData.length / 6);
    if (index % interval !== 0) return '';
    return balanceTrendData[index]?.date ?? '';
  };

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
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">Balance Trend</h3>
            <p className="text-sm text-zinc-500">Account balance over time</p>
          </div>
          <div className="flex items-center gap-2">
            {ranges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedRange === range
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Current</span>
            </div>
            <p className="text-base font-bold text-blue-900">
              {formatCompact(currentBalance)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Peak</span>
            </div>
            <p className="text-base font-bold text-emerald-900">
              {formatCompact(maxBalance)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Low</span>
            </div>
            <p className="text-base font-bold text-amber-900">
              {formatCompact(minBalance)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className={`flex items-center gap-1 ${totalChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">Change</span>
              </div>
            </div>
            <p className={`text-base font-bold ${totalChange >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
              {totalChange >= 0 ? '+' : ''}{changePercent}%
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart
            data={enrichedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            onMouseMove={(e: any) => {
              if (e && e.activeTooltipIndex !== undefined) {
                setHoveredPoint(e.activeTooltipIndex);
              }
            }}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.4} />
                <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#F4F4F5"
              vertical={false}
              strokeOpacity={0.5}
            />

            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fill: '#71717A', fontSize: 12, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              dy={10}
            />

            <YAxis
              tickFormatter={(value) => formatCompact(value)}
              tick={{ fill: '#71717A', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={60}
              dx={-5}
              domain={['dataMin - 5000', 'dataMax + 5000']}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: '#3B82F6',
                strokeWidth: 1,
                strokeDasharray: '5 5',
              }}
              animationDuration={200}
            />

            {/* Average line */}
            <ReferenceLine
              y={avgBalance}
              stroke="#71717A"
              strokeDasharray="3 3"
              strokeOpacity={0.3}
              label={{
                value: 'Avg',
                position: 'right',
                fill: '#71717A',
                fontSize: 11,
              }}
            />

            <Area
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke="url(#strokeGradient)"
              strokeWidth={3}
              fill="url(#balanceGradient)"
              dot={<CustomDot />}
              activeDot={{
                r: 6,
                fill: '#3B82F6',
                stroke: '#fff',
                strokeWidth: 3,
              }}
              animationDuration={1000}
              animationBegin={0}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-medium text-zinc-600">Account Balance</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-zinc-500">Average</p>
              <p className="text-sm font-semibold text-zinc-900">{formatCompact(avgBalance)}</p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div className="text-right">
              <p className="text-xs text-zinc-500">Total Change</p>
              <p className={`text-sm font-semibold ${totalChange >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {totalChange >= 0 ? '+' : ''}{formatCompact(totalChange)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
