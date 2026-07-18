import React from 'react';
import { Account } from '../../api/accounts';
import { formatPKR, maskAccountNumber } from '../../utils/formatters';

interface BalanceCardProps {
  account: Account;
  onClick?: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ account, onClick }) => {
  const { accountNumber, accountType, balance, isActive } = account;
  const getAccountTypeColor = (accountType?: string): string => {
    const normalizedType = accountType?.toLowerCase() || '';
    switch (normalizedType) {
      case 'savings':
        return 'bg-green-100 text-green-800';
      case 'checking':
        return 'bg-blue-100 text-blue-800';
      case 'business':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccountIcon = (accountType?: string): JSX.Element => {
    const normalizedType = accountType?.toLowerCase() || '';
    switch (normalizedType) {
      case 'savings':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'checking':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'business':
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      } ${
        !isActive ? 'opacity-60' : ''
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${
            isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {getAccountIcon(accountType)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{accountType || 'Unknown'} Account</h3>
            <p className="text-sm text-gray-500">{maskAccountNumber(accountNumber || '0000')}</p>
          </div>
        </div>
        
        {/* Status Badges */}
        <div className="flex flex-col items-end space-y-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            getAccountTypeColor(accountType)
          }`}>
            {accountType || 'Unknown'}
          </span>
          {!isActive && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Frozen
            </span>
          )}
        </div>
      </div>

      {/* Balance */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">Available Balance</p>
        <p className={`text-2xl font-bold ${
          isActive ? 'text-gray-900' : 'text-gray-500'
        }`}>
          {formatPKR(balance)}
        </p>
      </div>

      {/* Account Number */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-1">Account Number</p>
        <p className="text-sm font-mono text-gray-700">{accountNumber || 'N/A'}</p>
      </div>
    </div>
  );
};

export default BalanceCard;
