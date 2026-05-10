interface BalanceCardProps {
  accountNumber: string;
  type: string;
  balance: number;
  isActive: boolean;
}

export const BalanceCard = ({ accountNumber, type, balance, isActive }: BalanceCardProps) => {
  const formattedBalance = new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
  }).format(balance);

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 border-l-4 ${
        isActive ? 'border-blue-500' : 'border-gray-400 opacity-60'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm text-gray-600">Account Number</p>
          <p className="text-lg font-semibold text-gray-900">{accountNumber}</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {type}
          </span>
          {!isActive && (
            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              Frozen
            </span>
          )}
        </div>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">Available Balance</p>
        <p className={`text-2xl font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
          {formattedBalance}
        </p>
      </div>
    </div>
  );
};
