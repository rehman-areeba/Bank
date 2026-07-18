import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { depositApi, withdrawApi } from '../../api/accounts';
import { invalidateAccountQueries, invalidateTransactionQueries } from '../../lib/queryInvalidation';
import { Toast } from '../common/Toast';
import { AccessibleModal } from '../ui/AccessibleModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mode: 'deposit' | 'withdraw';
  accountId: string;
  currentBalance: number;
}

interface FormData {
  amount: number;
  description: string;
}

export const DepositWithdrawModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mode,
  accountId,
  currentBalance,
}) => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<FormData>({ mode: 'onChange' });

  const mutationFn = mode === 'deposit' ? depositApi : withdrawApi;

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; description?: string } }) =>
      mutationFn(id, data),
    onSuccess: () => {
      invalidateAccountQueries(queryClient, accountId);
      invalidateTransactionQueries(queryClient, accountId);
      setToast({ type: 'success', message: `${mode === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!` });
      reset();
      setTimeout(onClose, 1500);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || `${mode === 'deposit' ? 'Deposit' : 'Withdrawal'} failed. Please try again.`;
      setToast({ type: 'error', message });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate({ id: accountId, data: { amount: data.amount, description: data.description || undefined } });
  };

  const handleClose = () => {
    if (!mutation.isPending) {
      reset();
      setToast(null);
      onClose();
    }
  };

  const title = mode === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds';
  const isDeposit = mode === 'deposit';

  return (
    <>
      <AccessibleModal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (PKR)
            </label>
            <input
              type="number"
              step="0.01"
              min="100"
              max={isDeposit ? undefined : currentBalance}
              placeholder="Minimum PKR 100"
              {...register('amount', {
                valueAsNumber: true,
                required: 'Amount is required',
                min: { value: 100, message: 'Minimum amount is PKR 100' },
                ...(!isDeposit && {
                  max: { value: currentBalance, message: 'Insufficient balance' },
                }),
              })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
            {!isDeposit && (
              <p className="mt-1 text-xs text-gray-500">
                Available: PKR {currentBalance.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              maxLength={200}
              placeholder={isDeposit ? 'e.g. Salary deposit' : 'e.g. ATM withdrawal'}
              {...register('description', { maxLength: { value: 200, message: 'Max 200 characters' } })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || mutation.isPending}
              className={`px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDeposit
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {mutation.isPending ? 'Processing...' : isDeposit ? 'Deposit' : 'Withdraw'}
            </button>
          </div>
        </form>
      </AccessibleModal>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
};
