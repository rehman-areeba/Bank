import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { accountService } from '../../services/accountService';
import type { Account } from '../../types';

interface TransferModalProps {
  accounts: Account[];
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (msg: string) => void;
} = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const TransferModal = ({ accounts, onClose, onSuccess, onError }: TransferModalProps) => {
  const queryClient = useQueryClient();
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id ?? '');
  const [toAccountNumber, setToAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedAccount = accounts.find((a) => a.id === fromAccountId);

  const formatPKR = (val: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(val);

  const mutation = useMutation({
    mutationFn: () =>
      accountService.transfer({ fromAccountId, toAccountNumber, amount: parseFloat(amount), description }),
    onSuccess: (data) => {
      setSuccess(`Transfer successful! New balance: ${formatPKR(data.updatedBalance)}`);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
      onSuccess?.();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Transfer failed';
      setError(msg);
      onError?.(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!toAccountNumber || toAccountNumber.length !== 10)
      return setError('Recipient account number must be exactly 10 digits');

    const amt = parseFloat(amount);
    if (!amt || amt < 1) return setError('Amount must be at least PKR 1');
    if (selectedAccount && amt > selectedAccount.balance)
      return setError(`Insufficient balance. Available: ${formatPKR(selectedAccount.balance)}`);

    mutation.mutate();
  };

  return (
    <Modal title="Transfer Money" onClose={onClose}>
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 font-semibold text-lg mb-1">Transfer Successful!</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
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
                Available: <span className="font-semibold text-gray-700">{formatPKR(selectedAccount.balance)}</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Account Number</label>
            <input
              type="text"
              value={toAccountNumber}
              onChange={(e) => setToAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234567890"
              disabled={mutation.isPending}
            />
            <p className="mt-1 text-xs text-gray-400">{toAccountNumber.length}/10 digits</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              min="1"
              step="0.01"
              disabled={mutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Payment for..."
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
              disabled={
                mutation.isPending ||
                !fromAccountId ||
                !toAccountNumber ||
                !amount ||
                (!!selectedAccount && parseFloat(amount) > selectedAccount.balance)
              }
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {mutation.isPending && <Spinner />}
              {mutation.isPending ? 'Transferring...' : 'Transfer'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
