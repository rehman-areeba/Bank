import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getAccountsApi } from '../../api/accounts';
import { transferMoneyApi, TransferRequest } from '../../api/transfers';
import ConfirmDialog from '../common/ConfirmDialog';
import Toast from '../common/Toast';

interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  balance: number;
  isActive: boolean;
}

interface TransferFormData {
  fromAccountId: number;
  recipientAccountNumber: string;
  amount: string;
  description: string;
}

interface TransferFormProps {
  onSuccess?: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ onSuccess }) => {
  const [form, setForm] = useState<TransferFormData>({
    fromAccountId: 0,
    recipientAccountNumber: '',
    amount: '',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<TransferFormData>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error';
    isVisible: boolean;
  }>({
    message: '',
    type: 'success',
    isVisible: false,
  });

  // Fetch user's accounts
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccountsApi,
  });

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: (transferData: TransferRequest) => transferMoneyApi(transferData),
    onSuccess: () => {
      setToast({
        message: 'Transfer completed successfully!',
        type: 'success',
        isVisible: true,
      });
      // Reset form
      setForm({
        fromAccountId: 0,
        recipientAccountNumber: '',
        amount: '',
        description: '',
      });
      setShowConfirmDialog(false);
      // Navigate to dashboard after a short delay
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.hash = 'dashboard';
        }
      }, 2000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Transfer failed. Please try again.';
      setToast({
        message: errorMessage,
        type: 'error',
        isVisible: true,
      });
      setShowConfirmDialog(false);
    },
  });

  const formatBalance = (amount: number): string => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getSelectedAccount = (): Account | undefined => {
    return accounts?.find((account: Account) => account.id === form.fromAccountId);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<TransferFormData> = {};\n    const selectedAccount = getSelectedAccount();\n    const amount = parseFloat(form.amount);\n\n    // Source account validation\n    if (!form.fromAccountId) {\n      newErrors.fromAccountId = 'Please select a source account';\n    } else if (selectedAccount && !selectedAccount.isActive) {\n      newErrors.fromAccountId = 'Selected account is frozen';\n    }\n\n    // Recipient account validation\n    if (!form.recipientAccountNumber.trim()) {\n      newErrors.recipientAccountNumber = 'Recipient account number is required';\n    } else if (!/^\\d{10}$/.test(form.recipientAccountNumber.trim())) {\n      newErrors.recipientAccountNumber = 'Account number must be exactly 10 digits';\n    } else if (selectedAccount && form.recipientAccountNumber === selectedAccount.accountNumber) {\n      newErrors.recipientAccountNumber = 'Cannot transfer to the same account';\n    }\n\n    // Amount validation\n    if (!form.amount.trim()) {\n      newErrors.amount = 'Amount is required';\n    } else if (isNaN(amount) || amount <= 0) {\n      newErrors.amount = 'Amount must be a positive number';\n    } else if (amount < 1) {\n      newErrors.amount = 'Minimum transfer amount is PKR 1';\n    } else if (selectedAccount && amount > selectedAccount.balance) {\n      newErrors.amount = 'Amount exceeds available balance';\n    }\n\n    setErrors(newErrors);\n    return Object.keys(newErrors).length === 0;\n  };\n\n  const handleInputChange = (field: keyof TransferFormData, value: string | number) => {\n    setForm(prev => ({ ...prev, [field]: value }));\n    // Clear error when user starts typing\n    if (errors[field]) {\n      setErrors(prev => ({ ...prev, [field]: undefined }));\n    }\n  };\n\n  const handleSubmit = (e: React.FormEvent) => {\n    e.preventDefault();\n    \n    if (!validateForm()) {\n      return;\n    }\n\n    setShowConfirmDialog(true);\n  };\n\n  const handleConfirmTransfer = () => {\n    const selectedAccount = getSelectedAccount();\n    if (!selectedAccount) return;\n\n    // Find recipient account ID (for now, we'll use a placeholder)\n    // In a real app, you'd need an API to validate/find the recipient account\n    const transferData: TransferRequest = {\n      fromAccountId: form.fromAccountId,\n      toAccountId: parseInt(form.recipientAccountNumber), // This should be resolved from account number\n      amount: parseFloat(form.amount),\n      description: form.description.trim() || `Transfer to ${form.recipientAccountNumber}`,\n    };\n\n    transferMutation.mutate(transferData);\n  };\n\n  const selectedAccount = getSelectedAccount();\n  const amount = parseFloat(form.amount) || 0;\n  const isAmountExceedsBalance = selectedAccount && amount > selectedAccount.balance;\n\n  return (\n    <>\n      <div className=\"bg-white rounded-lg shadow-md p-6\">\n        <h2 className=\"text-2xl font-bold text-gray-900 mb-6\">Transfer Money</h2>\n        \n        <form onSubmit={handleSubmit} className=\"space-y-6\">\n          {/* Source Account Selection */}\n          <div>\n            <label htmlFor=\"fromAccount\" className=\"block text-sm font-medium text-gray-700 mb-2\">\n              From Account\n            </label>\n            <select\n              id=\"fromAccount\"\n              value={form.fromAccountId}\n              onChange={(e) => handleInputChange('fromAccountId', parseInt(e.target.value))}\n              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${\n                errors.fromAccountId ? 'border-red-300' : 'border-gray-300'\n              }`}\n              disabled={accountsLoading || transferMutation.isPending}\n            >\n              <option value={0}>Select source account</option>\n              {accounts?.filter((account: Account) => account.isActive).map((account: Account) => (\n                <option key={account.id} value={account.id}>\n                  {account.accountType} - ****{account.accountNumber.slice(-4)} ({formatBalance(account.balance)})\n                </option>\n              ))}\n            </select>\n            {errors.fromAccountId && (\n              <p className=\"mt-1 text-sm text-red-600\">{errors.fromAccountId}</p>\n            )}\n            \n            {/* Live Balance Display */}\n            {selectedAccount && (\n              <div className=\"mt-2 p-3 bg-blue-50 rounded-md\">\n                <p className=\"text-sm text-blue-800\">\n                  <span className=\"font-medium\">Available Balance:</span> {formatBalance(selectedAccount.balance)}\n                </p>\n              </div>\n            )}\n          </div>\n\n          {/* Recipient Account Number */}\n          <div>\n            <label htmlFor=\"recipientAccount\" className=\"block text-sm font-medium text-gray-700 mb-2\">\n              Recipient Account Number\n            </label>\n            <input\n              id=\"recipientAccount\"\n              type=\"text\"\n              value={form.recipientAccountNumber}\n              onChange={(e) => {\n                // Only allow digits and limit to 10 characters\n                const value = e.target.value.replace(/\\D/g, '').slice(0, 10);\n                handleInputChange('recipientAccountNumber', value);\n              }}\n              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${\n                errors.recipientAccountNumber ? 'border-red-300' : 'border-gray-300'\n              }`}\n              placeholder=\"Enter 10-digit account number\"\n              maxLength={10}\n              disabled={transferMutation.isPending}\n            />\n            {errors.recipientAccountNumber && (\n              <p className=\"mt-1 text-sm text-red-600\">{errors.recipientAccountNumber}</p>\n            )}\n            <p className=\"mt-1 text-xs text-gray-500\">Enter the 10-digit account number of the recipient</p>\n          </div>\n\n          {/* Amount */}\n          <div>\n            <label htmlFor=\"amount\" className=\"block text-sm font-medium text-gray-700 mb-2\">\n              Amount (PKR)\n            </label>\n            <input\n              id=\"amount\"\n              type=\"number\"\n              step=\"0.01\"\n              min=\"1\"\n              max={selectedAccount?.balance || undefined}\n              value={form.amount}\n              onChange={(e) => handleInputChange('amount', e.target.value)}\n              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${\n                errors.amount || isAmountExceedsBalance ? 'border-red-300' : 'border-gray-300'\n              }`}\n              placeholder=\"0.00\"\n              disabled={transferMutation.isPending}\n            />\n            {errors.amount && (\n              <p className=\"mt-1 text-sm text-red-600\">{errors.amount}</p>\n            )}\n            {isAmountExceedsBalance && !errors.amount && (\n              <p className=\"mt-1 text-sm text-red-600\">Amount exceeds available balance</p>\n            )}\n          </div>\n\n          {/* Description */}\n          <div>\n            <label htmlFor=\"description\" className=\"block text-sm font-medium text-gray-700 mb-2\">\n              Description (Optional)\n            </label>\n            <textarea\n              id=\"description\"\n              rows={3}\n              value={form.description}\n              onChange={(e) => handleInputChange('description', e.target.value)}\n              className=\"w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500\"\n              placeholder=\"Enter transfer description...\"\n              maxLength={200}\n              disabled={transferMutation.isPending}\n            />\n            <p className=\"mt-1 text-xs text-gray-500\">{form.description.length}/200 characters</p>\n          </div>\n\n          {/* Submit Button */}\n          <button\n            type=\"submit\"\n            disabled={\n              transferMutation.isPending ||\n              !form.fromAccountId ||\n              !form.recipientAccountNumber ||\n              !form.amount ||\n              isAmountExceedsBalance\n            }\n            className=\"w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed\"\n          >\n            {transferMutation.isPending ? (\n              <div className=\"flex items-center\">\n                <svg className=\"animate-spin -ml-1 mr-3 h-5 w-5 text-white\" xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 24 24\">\n                  <circle className=\"opacity-25\" cx=\"12\" cy=\"12\" r=\"10\" stroke=\"currentColor\" strokeWidth=\"4\"></circle>\n                  <path className=\"opacity-75\" fill=\"currentColor\" d=\"M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z\"></path>\n                </svg>\n                Processing Transfer...\n              </div>\n            ) : (\n              'Transfer Money'\n            )}\n          </button>\n        </form>\n      </div>\n\n      {/* Confirmation Dialog */}\n      <ConfirmDialog\n        isOpen={showConfirmDialog}\n        title=\"Confirm Transfer\"\n        message={`Are you sure you want to transfer ${formatBalance(parseFloat(form.amount) || 0)} to account ${form.recipientAccountNumber}? This action cannot be undone.`}\n        confirmText=\"Yes, Transfer\"\n        cancelText=\"Cancel\"\n        onConfirm={handleConfirmTransfer}\n        onCancel={() => setShowConfirmDialog(false)}\n        type=\"warning\"\n      />\n\n      {/* Toast Notification */}\n      <Toast\n        message={toast.message}\n        type={toast.type}\n        isVisible={toast.isVisible}\n        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}\n      />\n    </>\n  );\n};\n\nexport default TransferForm;