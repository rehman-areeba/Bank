import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getAccountsApi } from '../api/accounts';
import { transferApi } from '../api/transfers';

export const TransferPage = () => {
  const navigate = useNavigate();
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccountsApi,
  });

  const mutation = useMutation({
    mutationFn: transferApi,
    onSuccess: () => {
      setSuccessMessage('Transfer completed successfully!');
      setTimeout(() => navigate('/dashboard'), 2000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Transfer failed');
      setShowConfirm(false);
    },
  });

  const selectedAccount = accounts?.find((acc: any) => acc.id === fromAccountId);

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(balance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fromAccountId) {
      setError('Please select a source account');
      return;
    }

    if (!toAccountNumber || toAccountNumber.length !== 10) {
      setError('Recipient account number must be 10 digits');
      return;
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 1) {
      setError('Amount must be at least PKR 1');
      return;
    }

    if (selectedAccount && amountNum > selectedAccount.balance) {
      setError('Insufficient balance');
      return;
    }

    setShowConfirm(true);
  };

  const confirmTransfer = () => {
    mutation.mutate({
      fromAccountId: fromAccountId,
      toAccountNumber,
      amount: parseFloat(amount),
      description,
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Transfer Money</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Transfer Funds</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-700 mb-1">
                From Account
              </label>
              <select
                id="fromAccount"
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading || mutation.isPending}
              >
                <option value="">Select an account</option>
                {accounts?.map((account: any) => (
                  <option key={account.id} value={account.id} disabled={!account.isActive}>
                    {account.accountNumber} - {account.accountType} ({formatBalance(account.balance)})
                    {!account.isActive && ' (Frozen)'}
                  </option>
                ))}
              </select>
              {selectedAccount && (
                <p className="mt-2 text-sm text-gray-600">
                  Available Balance: <span className="font-semibold">{formatBalance(selectedAccount.balance)}</span>
                </p>
              )}
            </div>

            <div>
              <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Account Number
              </label>
              <input
                id="toAccount"
                type="text"
                value={toAccountNumber}
                onChange={(e) => setToAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="1234567890"
                maxLength={10}
                disabled={mutation.isPending}
              />
              <p className="mt-1 text-xs text-gray-500">{toAccountNumber.length}/10 digits</p>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                Amount (PKR)
              </label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
                min="1"
                step="0.01"
                disabled={mutation.isPending}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Payment for..."
                rows={3}
                disabled={mutation.isPending}
              />
            </div>

            <button
              type="submit"
              disabled={
                mutation.isPending ||
                !fromAccountId ||
                !toAccountNumber ||
                !amount ||
                (selectedAccount && parseFloat(amount) > selectedAccount.balance)
              }
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {mutation.isPending ? 'Processing...' : 'Transfer Money'}
            </button>
          </form>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Transfer</h3>
            <div className="space-y-2 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">From:</span> {selectedAccount?.accountNumber}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">To:</span> {toAccountNumber}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Amount:</span> {formatBalance(parseFloat(amount))}
              </p>
              {description && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {description}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-6">Are you sure you want to proceed with this transfer?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={mutation.isPending}
              >
                Cancel
              </button>
              <button
                onClick={confirmTransfer}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
