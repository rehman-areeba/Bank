import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: JSX.Element;
  trend?: number[];
}

export const StatsCard = ({ title, value, change, changeType = 'neutral', icon, trend }: StatsCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="
        bg-white rounded-2xl border border-zinc-200/60 
        p-6 shadow-sm hover:shadow-md transition-all duration-200
      "
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
          <p className="text-2xl font-semibold text-zinc-900 tracking-tight">{value}</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-50 text-zinc-600">
          {icon}
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-2">
          <span className={`
            inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
            ${changeType === 'positive' ? 'bg-emerald-50 text-emerald-700' : ''}
            ${changeType === 'negative' ? 'bg-red-50 text-red-700' : ''}
            ${changeType === 'neutral' ? 'bg-zinc-50 text-zinc-700' : ''}
          `}>
            {changeType === 'positive' && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {changeType === 'negative' && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {change}
          </span>
          <span className="text-xs text-zinc-500">vs last month</span>
        </div>
      )}

      {trend && (
        <div className="mt-4 h-12 flex items-end gap-1">
          {trend.map((value, index) => (
            <div
              key={index}
              className="flex-1 bg-zinc-100 rounded-sm transition-all hover:bg-blue-200"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};
