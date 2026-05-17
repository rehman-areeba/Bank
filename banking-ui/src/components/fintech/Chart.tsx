import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface ChartData {
  month: string;
  income: number;
  expense: number;
}

interface FintechChartProps {
  data: ChartData[];
  title: string;
  subtitle?: string;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-white rounded-xl border border-zinc-200/60 shadow-lg p-3">
      <p className="text-xs font-medium text-zinc-500 mb-2">{payload[0].payload.month}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-zinc-600 capitalize">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-zinc-900">
            {new Intl.NumberFormat('en-PK', {
              style: 'currency',
              currency: 'PKR',
              notation: 'compact',
            }).format(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export const FintechChart = ({ data, title, subtitle }: FintechChartProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-900">{title}</h3>
        {subtitle && <p className="text-sm text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="w-full" style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" vertical={false} />
            <XAxis 
              dataKey="month" 
              tick={{ fill: '#A1A1AA', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: '#A1A1AA', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E4E4E7', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="income"
              name="income"
              stroke="#10B981"
              strokeWidth={2}
              fill="url(#incomeGradient)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="expense"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#expenseGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-zinc-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-zinc-600">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-zinc-600">Expenses</span>
        </div>
      </div>
    </motion.div>
  );
};
