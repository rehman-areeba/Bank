import { motion } from 'framer-motion';

interface AccountCardProps {
  accountNumber: string;
  type: string;
  balance: number;
  isActive: boolean;
}

const TYPE_CONFIG: Record<string, { gradient: string; icon: string; label: string }> = {
  Savings: { 
    gradient: 'from-blue-500 to-blue-600', 
    icon: '💰',
    label: 'Savings'
  },
  Checking: { 
    gradient: 'from-emerald-500 to-emerald-600', 
    icon: '💳',
    label: 'Checking'
  },
  Current: { 
    gradient: 'from-violet-500 to-violet-600', 
    icon: '🏢',
    label: 'Business'
  },
};

export const FintechAccountCard = ({ accountNumber, type, balance, isActive }: AccountCardProps) => {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.Savings;
  
  const formattedBalance = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
  }).format(balance);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative overflow-hidden"
    >
      <div className={`
        relative bg-white rounded-2xl border border-zinc-200/60 
        shadow-sm hover:shadow-md transition-all duration-200
        ${!isActive ? 'opacity-60' : ''}
      `}>
        <div className={`h-32 bg-gradient-to-br ${config.gradient} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-20 translate-x-20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-16 -translate-x-16" />
          </div>
          
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full">
              <span className="text-lg">{config.icon}</span>
              <span className="text-xs font-medium text-white">{config.label}</span>
            </div>
          </div>

          <div className="absolute top-4 right-4">
            <div className={`
              px-2.5 py-1 rounded-full text-xs font-medium
              ${isActive 
                ? 'bg-emerald-500/20 text-white backdrop-blur-sm' 
                : 'bg-red-500/20 text-white backdrop-blur-sm'
              }
            `}>
              {isActive ? 'Active' : 'Frozen'}
            </div>
          </div>

          <div className="absolute bottom-4 left-4">
            <p className="text-xs font-medium text-white/70 mb-1">Account Number</p>
            <p className="text-sm font-mono font-medium text-white tracking-wider">
              {accountNumber}
            </p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                Available Balance
              </p>
              <p className="text-3xl font-semibold text-zinc-900 tracking-tight">
                {formattedBalance}
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 border border-zinc-200/60 transition-colors"
            >
              <svg className="w-5 h-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Last transaction: 2 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
