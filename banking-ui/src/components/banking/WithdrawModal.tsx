import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { accountService } from '../../services/accountService';
import type { Account } from '../../types';

interface WithdrawModalProps {
  accounts: Account[];
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
}

export const WithdrawModal = ({ accounts, onClose, onSuccess, onError }: WithdrawModalProps) => {
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedAccount = accounts.find((a) => a.id === accountId);

  const formatPKR = (val: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(val);

  const amountNum = parseFloat(amount) || 0;
  const isInsufficient = !!selectedAccount && amountNum > selectedAccount.balance;

  const mutation = useMutation({
    mutationFn: async () => accountService.withdraw(accountId, {
      amount: amountNum,
      description: description || 'Cash Withdrawal',
    }),
    onSuccess: (data) => {
      setSuccess(`Withdrawal successful! New balance: ${formatPKR(data.newBalance)}`);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Withdrawal failed';
      setError(msg);
      onError?.(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!amountNum || amountNum < 100) return setError('Minimum withdrawal amount is PKR 100');
    if (isInsufficient)
      return setError(`Insufficient balance. Available: ${formatPKR(selectedAccount!.balance)}`);

    mutation.mutate();
  };

  return (
    <Modal title="Withdraw Money" onClose={onClose}>
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 font-semibold text-lg mb-1">Withdrawal Successful!</p>
          <p className="text-gray-600 text-sm mb-6">{success}</p>
          <button onClick={onClose} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Account</label>
            <select
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); setError(''); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={mutation.isPending}
            >
              {accounts.filter((a) => a.isActive).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNumber} — {a.accountType} ({formatPKR(a.balance)})
                </option>
              ))}
            </select>
            {selectedAccount && (
              <p className="mt-1 text-xs text-gray-500">
                Available balance: <span className="font-semibold text-gray-700">{formatPKR(selectedAccount.balance)}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isInsufficient ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="0.00"
              min="100"
              step="0.01"
              disabled={mutation.isPending}
            />
            {isInsufficient && (
              <p className="mt-1 text-xs text-red-600 font-medium">
                ⚠ Amount exceeds available balance of {formatPKR(selectedAccount!.balance)}
              </p>
            )}
            {selectedAccount && !isInsufficient && amountNum > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Balance after withdrawal: <span className="font-semibold">{formatPKR(selectedAccount.balance - amountNum)}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ATM withdrawal, etc."
              disabled={mutation.isPending}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={mutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !accountId || !amount || amountNum < 100 || isInsufficient}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {mutation.isPending && <Spinner />}
              {mutation.isPending ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
