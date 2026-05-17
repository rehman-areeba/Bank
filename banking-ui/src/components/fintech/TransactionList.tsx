import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  isCredit: boolean;
  date: string;
  status: 'Success' | 'Pending' | 'Failed';
  category?: string;
}

interface TransactionListProps {
  transactions: Transaction[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Success':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Pending':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Failed':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-zinc-50 text-zinc-700 border-zinc-200';
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'Transfer':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      );
    case 'Deposit':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
  }
};

export const TransactionList = ({ transactions }: TransactionListProps) => {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200/60 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-zinc-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Recent Transactions</h3>
            <p className="text-sm text-zinc-500 mt-0.5">Your latest account activity</p>
          </div>
          <button className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            View all
          </button>
        </div>
      </div>

      <div className="divide-y divide-zinc-100">
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-6 hover:bg-zinc-50/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                ${transaction.isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}
                group-hover:scale-110 transition-transform
              `}>
                {getCategoryIcon(transaction.category)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-zinc-500">
                        {new Date(transaction.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <span className="text-zinc-300">•</span>
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border
                        ${getStatusColor(transaction.status)}
                      `}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className={`
                      text-sm font-semibold
                      ${transaction.isCredit ? 'text-emerald-600' : 'text-zinc-900'}
                    `}>
                      {transaction.isCredit ? '+' : '-'} {new Intl.NumberFormat('en-PK', {
                        style: 'currency',
                        currency: 'PKR',
                      }).format(transaction.amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <svg 
                className="w-5 h-5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>

      {transactions.length === 0 && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-zinc-900 mb-1">No transactions yet</h3>
          <p className="text-sm text-zinc-500">Your transaction history will appear here</p>
        </div>
      )}
    </div>
  );
};
