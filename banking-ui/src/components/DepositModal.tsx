import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal } from './Modal';
import axiosClient from '../api/axiosClient';

interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  isActive: boolean;
}

interface DepositModalProps {
  accounts: Account[];
  onClose: () => void;
}

const Spinner = () => (
  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export const DepositModal = ({ accounts, onClose }: DepositModalProps) => {
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatPKR = (val: number) =>
    new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(val);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await axiosClient.post(`/api/accounts/${accountId}/deposit`, {
        amount: parseFloat(amount),
        description: description || 'Cash Deposit',
      });
      return data;
    },
    onSuccess: (data) => {
      setSuccess(`Deposit successful! New balance: ${formatPKR(data.newBalance)}`);
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['recentTransactions'] });
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Deposit failed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const amt = parseFloat(amount);
    if (!amt || amt < 100) return setError('Minimum deposit amount is PKR 100');

    mutation.mutate();
  };

  return (
    <Modal title="Deposit Money" onClose={onClose}>
      {success ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-700 font-semibold text-lg mb-1">Deposit Successful!</p>
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
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={mutation.isPending}
            >
              {accounts.filter((a) => a.isActive).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNumber} — {a.accountType} ({formatPKR(a.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PKR)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimum: 100"
              min="100"
              step="0.01"
              disabled={mutation.isPending}
            />
            <p className="mt-1 text-xs text-gray-500">Minimum deposit: PKR 100</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Cash deposit, cheque, etc."
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
              disabled={mutation.isPending || !accountId || !amount || parseFloat(amount) < 100}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
            >
              {mutation.isPending && <Spinner />}
              {mutation.isPending ? 'Processing...' : 'Deposit'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
