import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAccountApi } from '../../api/accounts';
import { Toast } from '../common/Toast';
import { createAccountSchema, CreateAccountFormData } from '../../validation/schemas';

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AccountType = 'Savings' | 'Current';

interface AccountTypeOption {
  type: AccountType;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

const accountTypes: AccountTypeOption[] = [
  {
    type: 'Savings',
    icon: '🏦',
    title: 'Savings Account',
    description: 'Earn interest on your balance. Best for long-term saving goals.',
    badge: 'Most Popular'
  },
  {
    type: 'Current',
    icon: '💼',
    title: 'Current Account',
    description: 'No transaction limits. Best for business and frequent use.'
  }
];

export const CreateAccountModal: React.FC<CreateAccountModalProps> = ({ isOpen, onClose }) => {
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isValid }
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    mode: 'onChange',
    defaultValues: {
      type: undefined,
      agreedToTerms: false
    }
  });

  const selectedType = watch('type');

  const createAccountMutation = useMutation({
    mutationFn: createAccountApi,
    onSuccess: () => {
      setToast({ type: 'success', message: 'Account created successfully!' });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      setTimeout(() => {
        onClose();
        resetForm();
      }, 1500);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create account. Please try again.';
      setToast({ type: 'error', message });
    }
  });

  const resetForm = () => {
    reset();
    setToast(null);
  };

  const handleClose = () => {
    if (!createAccountMutation.isPending) {
      onClose();
      resetForm();
    }
  };

  const onSubmit = (data: CreateAccountFormData) => {
    createAccountMutation.mutate({ type: data.type });
  };

  const handleTypeSelect = (type: AccountType) => {
    setValue('type', type, { shouldValidate: true });
  };

  const isSubmitDisabled = !isValid || createAccountMutation.isPending;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Open New Account</h2>
                <p className="text-gray-600 mt-1">Choose account type to get started</p>
              </div>
              <button
                onClick={handleClose}
                disabled={createAccountMutation.isPending}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="px-6 py-6">
              {/* Error Message */}
              {errors.type && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{errors.type.message}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Type Selection */}
              <div className="space-y-4 mb-6">
                {accountTypes.map((accountType) => (
                  <div
                    key={accountType.type}
                    onClick={() => handleTypeSelect(accountType.type)}
                    className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedType === accountType.type
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selection Indicator */}
                    <div className="absolute top-4 right-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedType === accountType.type
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedType === accountType.type && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Badge */}
                    {accountType.badge && (
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {accountType.badge}
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex items-start space-x-4 mt-2">
                      <div className="text-3xl">{accountType.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {accountType.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {accountType.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Account Confirmation */}
              {selectedType && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Selected:</span> {selectedType} Account
                  </p>
                </div>
              )}

              {/* Terms Checkbox */}
              <div className="mb-6">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('agreedToTerms')}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the{' '}
                    <button type="button" className="text-blue-600 hover:text-blue-700 underline">
                      account terms and conditions
                    </button>
                  </span>
                </label>
                {errors.agreedToTerms && (
                  <p className="mt-1 text-sm text-red-600 ml-7">{errors.agreedToTerms.message}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={createAccountMutation.isPending}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {createAccountMutation.isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Open Account</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

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