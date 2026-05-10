import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export const NewAccountPage = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('Savings');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await axiosClient.post('/api/accounts', { type: accountType });
      return data;
    },
    onSuccess: (data) => {
      setSuccess(`Account created successfully! Account Number: ${data.accountNumber}`);
      setTimeout(() => navigate('/dashboard'), 3000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to create account');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Create New Account</h1>
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
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Open a New Bank Account</h2>

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <select
                id="accountType"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={mutation.isPending}
              >
                <option value="Savings">Savings Account</option>
                <option value="Checking">Checking Account</option>
                <option value="Current">Current Account</option>
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Account Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                {accountType === 'Savings' && (
                  <>
                    <li>• Interest earning account</li>
                    <li>• Ideal for long-term savings</li>
                    <li>• Minimum balance: PKR 0</li>
                  </>
                )}
                {accountType === 'Checking' && (
                  <>
                    <li>• Unlimited transactions</li>
                    <li>• Debit card included</li>
                    <li>• No minimum balance</li>
                  </>
                )}
                {accountType === 'Current' && (
                  <>
                    <li>• Business account</li>
                    <li>• High transaction limits</li>
                    <li>• Overdraft facility available</li>
                  </>
                )}
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Important Information:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Your new account will start with PKR 0.00 balance</li>
                <li>• A unique 10-digit account number will be generated</li>
                <li>• You can transfer funds from your existing accounts</li>
                <li>• Account will be active immediately</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {mutation.isPending ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
