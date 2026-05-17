import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { balanceTrendData } from '../../data/chartData';

const formatPKR = (value: number) =>
  `Rs ${new Intl.NumberFormat('en-PK').format(value)}`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="text-gray-500 mb-1">{label}</p>
      <p className="font-bold text-blue-700 text-base">{formatPKR(payload[0].value)}</p>
    </div>
  );
};

// Show only every 5th label to avoid crowding
const tickFormatter = (_: any, index: number) => {
  if (index % 5 !== 0) return '';
  return balanceTrendData[index]?.date ?? '';
};

export const BalanceTrendChart = () => {
  return (
    <div
      className="bg-white p-6 w-full max-w-full"
      style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
    >
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">Balance Trend</h3>
        <p className="text-sm text-gray-500">Last 30 days</p>
      </div>
      <div className="w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={balanceTrendData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={tickFormatter}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tickFormatter={(v) => `Rs ${v / 1000}k`}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
              width={65}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              name="Balance"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="url(#balanceGradient)"
              dot={false}
              activeDot={{ r: 5, fill: '#2563eb', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
