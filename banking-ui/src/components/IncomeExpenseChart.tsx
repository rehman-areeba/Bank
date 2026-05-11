import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { monthlyData } from '../data/chartData';

const formatPKR = (value: number) =>
  `Rs ${new Intl.NumberFormat('en-PK').format(value)}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {formatPKR(entry.value)}
        </p>
      ))}
    </div>
  );
};

export const IncomeExpenseChart = () => {
  return (
    <div
      className="bg-white p-6"
      style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Income vs Expenses</h3>
        <p className="text-sm text-gray-500">Last 6 months overview</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 13, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => `Rs ${v / 1000}k`}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
          <Legend
            wrapperStyle={{ fontSize: '13px', paddingTop: '16px' }}
            formatter={(value) => (
              <span style={{ color: '#374151', fontWeight: 500 }}>{value}</span>
            )}
          />
          <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Expenses" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
