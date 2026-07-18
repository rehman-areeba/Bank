import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAccountsApi } from '../../api/accounts';
import { transferFundsApi } from '../../api/transfers';
import { formatAccountOption, formatPKR } from '../../utils/formatters';
import { invalidateAccountQueries, invalidateTransactionQueries } from '../../lib/queryInvalidation';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Toast } from '../common/Toast';
import { TransferStatusModal } from '../banking/TransferStatusModal';
import { transferSchema } from '../../validation/schemas';

type TransferFormData = {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  description?: string;
};

export const TransferForm: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [toast, setToast] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [completedTransactionId, setCompletedTransactionId] = React.useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccountsApi
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<TransferFormData>({
    resolver: zodResolver(
      transferSchema.refine(
        (data) => {
          const selectedAccount = accounts?.find((acc) => acc.id === data.fromAccountId);
          return !selectedAccount || data.amount <= selectedAccount.balance;
        },
        {
          message: 'Insufficient balance',
          path: ['amount']
        }
      ).refine(
        (data) => {
          const selectedAccount = accounts?.find((acc) => acc.id === data.fromAccountId);
          return !selectedAccount || selectedAccount.accountNumber !== data.toAccountNumber;
        },
        {
          message: 'Cannot transfer to same account',
          path: ['toAccountNumber']
        }
      )
    ),
    mode: 'onChange'
  });

  const fromAccountId = watch('fromAccountId');
  const toAccountNumber = watch('toAccountNumber');
  const amount = watch('amount');

  const selectedAccount = accounts?.find((acc) => acc.id === fromAccountId);
  const maxAmount = selectedAccount?.balance || 0;

  const transferMutation = useMutation({
    mutationFn: transferFundsApi,
    onSuccess: (data) => {
      invalidateAccountQueries(queryClient);
      invalidateTransactionQueries(queryClient);
      setCompletedTransactionId(data.transactionId);
      setToast({ type: 'success', message: 'Transfer completed successfully!' });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Transfer failed. Please try again.';
      setToast({ type: 'error', message });
    }
  });

  const onSubmit = () => {
    setShowConfirm(true);
  };

  const handleConfirmTransfer = () => {
    const formData = watch();
    transferMutation.mutate({
      fromAccountId: formData.fromAccountId,
      toAccountNumber: formData.toAccountNumber,
      amount: formData.amount,
      description: formData.description || 'Money transfer'
    });
    setShowConfirm(false);
  };

  const isSubmitDisabled = !isValid || transferMutation.isPending;

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="skeleton h-6 w-40 mb-6"></div>
        <div className="space-y-6">
          {/* From Account Skeleton */}
          <div>
            <div className="skeleton h-4 w-32 mb-2"></div>
            <div className="skeleton h-10 w-full"></div>
          </div>
          
          {/* To Account Skeleton */}
          <div>
            <div className="skeleton h-4 w-40 mb-2"></div>
            <div className="skeleton h-10 w-full"></div>
          </div>
          
          {/* Amount Skeleton */}
          <div>
            <div className="skeleton h-4 w-32 mb-2"></div>
            <div className="skeleton h-10 w-full"></div>
          </div>
          
          {/* Description Skeleton */}
          <div>
            <div className="skeleton h-4 w-48 mb-2"></div>
            <div className="skeleton h-24 w-full"></div>
          </div>
          
          {/* Button Skeleton */}
          <div className="skeleton skeleton-button w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Transfer Money</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Source Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Account
            </label>
            <select
              {...register('fromAccountId')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.fromAccountId ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select source account</option>
              {accounts?.filter((acc) => acc.isActive).map((account) => (
                <option key={account.id} value={account.id}>
                  {formatAccountOption(account)}
                </option>
              ))}
            </select>
            {errors.fromAccountId && (
              <p className="mt-1 text-sm text-red-600">{errors.fromAccountId.message}</p>
            )}
            {selectedAccount && (
              <p className="mt-2 text-sm text-gray-600">
                Available balance: <span className="font-semibold text-green-600">
                  {formatPKR(selectedAccount.balance)}
                </span>
              </p>
            )}
          </div>

          {/* Recipient Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Account Number
            </label>
            <input
              type="text"
              {...register('toAccountNumber')}
              placeholder="Enter 9-10 digit account number"
              maxLength={10}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.toAccountNumber ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.toAccountNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.toAccountNumber.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (PKR)
            </label>
            <input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              placeholder="Enter amount"
              min="1"
              max={maxAmount}
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              placeholder="Enter transfer description"
              rows={3}
              maxLength={200}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {transferMutation.isPending ? 'Processing...' : 'Transfer Money'}
          </button>
        </form>
      </div>

      {/* Transfer Status Modal */}
      {completedTransactionId && (
        <TransferStatusModal
          isOpen={true}
          onClose={() => { setCompletedTransactionId(null); navigate('/dashboard'); }}
          transactionId={completedTransactionId}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmTransfer}
        title="Confirm Transfer"
        message={`Are you sure you want to transfer ${formatPKR(amount || 0)} to account ${toAccountNumber}?`}
        confirmText="Transfer"
        cancelText="Cancel"
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};