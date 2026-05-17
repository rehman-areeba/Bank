interface BalanceCardProps {
  accountNumber: string;
  type: string;
  balance: number;
  isActive: boolean;
}

const TYPE_CONFIG: Record<string, { border: string; badge: string; dot: string }> = {
  Savings:  { border: '#2563eb', badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',  dot: 'bg-blue-500' },
  Checking: { border: '#16a34a', badge: 'bg-green-50 text-green-700 ring-1 ring-green-200', dot: 'bg-green-500' },
  Current:  { border: '#16a34a', badge: 'bg-green-50 text-green-700 ring-1 ring-green-200', dot: 'bg-green-500' },
};

const DEFAULT_CONFIG = { border: '#6b7280', badge: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200', dot: 'bg-gray-400' };

export const BalanceCard = ({ accountNumber, type, balance, isActive }: BalanceCardProps) => {
  const config = TYPE_CONFIG[type] ?? DEFAULT_CONFIG;

  const formattedBalance = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
  }).format(balance);

  return (
    <div
      style={{
        borderTop: `3px solid ${isActive ? config.border : '#9ca3af'}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        borderRadius: '12px',
        transition: 'box-shadow 0.2s ease, transform 0.2s ease',
      }}
      className={`account-card bg-white p-6 flex flex-col gap-4 w-full max-w-full ${
        !isActive ? 'opacity-60' : ''
      }`}
    >
      {/* Top row: account number + badges */}
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">
            Account Number
          </p>
          <p style={{ fontSize: '0.85rem' }} className="text-gray-500 font-mono tracking-widest">
            {accountNumber}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${config.badge}`}>
            {type}
          </span>
          {!isActive && (
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-600 ring-1 ring-red-200">
              Frozen
            </span>
          )}
        </div>
      </div>

      {/* Balance */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          Available Balance
        </p>
        <p
          style={{ fontSize: '2.5rem', lineHeight: 1.1 }}
          className={`font-bold tracking-tight ${
            isActive ? 'text-gray-900' : 'text-gray-400'
          }`}
        >
          {formattedBalance}
        </p>
      </div>

      {/* Bottom status indicator */}
      <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-gray-100">
        <span className={`w-2 h-2 rounded-full ${isActive ? config.dot : 'bg-gray-400'}`} />
        <span className="text-xs text-gray-400">
          {isActive ? 'Active' : 'Frozen'}
        </span>
      </div>
    </div>
  );
};
