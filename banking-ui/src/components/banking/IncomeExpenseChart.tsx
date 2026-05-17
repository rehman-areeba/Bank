import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { monthlyData } from '../../data/chartData';

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

  const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
  const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
  const netIncome = income - expense;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-xl shadow-2xl border border-zinc-200/60 p-4 min-w-[200px]"
    >
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-100">
        <span className="text-sm font-semibold text-zinc-900">{label}</span>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
          netIncome >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {netIncome >= 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {formatCompact(Math.abs(netIncome))}
        </div>
      </div>
      
      <div className="space-y-2">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs font-medium text-zinc-600 capitalize">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-semibold text-zinc-900">
              {formatPKR(entry.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-100">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-zinc-500">Net Income</span>
          <span className={`text-sm font-bold ${
            netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {netIncome >= 0 ? '+' : ''}{formatPKR(netIncome)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

// Custom Legend
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-zinc-100">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm font-medium text-zinc-600 capitalize">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export const IncomeExpenseChart = () => {
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6M');

  // Calculate totals
  const totalIncome = monthlyData.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = monthlyData.reduce((sum, item) => sum + item.expense, 0);
  const netIncome = totalIncome - totalExpense;
  const savingsRate = ((netIncome / totalIncome) * 100).toFixed(1);

  const periods = ['1M', '3M', '6M', '1Y'];

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
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">
              Income vs Expenses
            </h3>
            <p className="text-sm text-zinc-500">
              Financial overview for the last 6 months
            </p>
          </div>
          <div className="flex items-center gap-2">
            {periods.map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Income</span>
            </div>
            <p className="text-lg font-bold text-emerald-900">
              {formatCompact(totalIncome)}
            </p>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Expenses</span>
            </div>
            <p className="text-lg font-bold text-red-900">
              {formatCompact(totalExpense)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Savings</span>
            </div>
            <p className="text-lg font-bold text-blue-900">{savingsRate}%</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart 
            data={monthlyData} 
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            barGap={8}
            barCategoryGap="20%"
          >
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#059669" stopOpacity={1} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#DC2626" stopOpacity={1} />
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
              tick={{ fill: '#71717A', fontSize: 13, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            
            <YAxis 
              tickFormatter={(value) => `${formatCompact(value)}`}
              tick={{ fill: '#71717A', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={60}
              dx={-5}
            />
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: '#FAFAFA', opacity: 0.5, radius: 8 }}
              animationDuration={200}
            />
            
            <Legend content={<CustomLegend />} />
            
            <Bar 
              dataKey="income" 
              name="Income" 
              fill="url(#incomeGradient)"
              radius={[8, 8, 0, 0]}
              onMouseEnter={() => setHoveredBar('income')}
              onMouseLeave={() => setHoveredBar(null)}
              animationDuration={800}
              animationBegin={0}
            >
              {monthlyData.map((entry, index) => (
                <Cell 
                  key={`income-${index}`}
                  opacity={hoveredBar === null || hoveredBar === 'income' ? 1 : 0.3}
                />
              ))}
            </Bar>
            
            <Bar 
              dataKey="expense" 
              name="Expenses" 
              fill="url(#expenseGradient)"
              radius={[8, 8, 0, 0]}
              onMouseEnter={() => setHoveredBar('expense')}
              onMouseLeave={() => setHoveredBar(null)}
              animationDuration={800}
              animationBegin={100}
            >
              {monthlyData.map((entry, index) => (
                <Cell 
                  key={`expense-${index}`}
                  opacity={hoveredBar === null || hoveredBar === 'expense' ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
