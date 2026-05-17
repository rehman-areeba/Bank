import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/layout/PageWrapper';
import axiosClient from '../api/axiosClient';

const ACCOUNT_FEATURES = {
  Savings: [
    'Interest earning account',
    'Ideal for long-term savings',
    'Minimum balance: PKR 0',
    'Competitive interest rates'
  ],
  Checking: [
    'Unlimited transactions',
    'Debit card included',
    'No minimum balance',
    'Online banking access'
  ],
  Current: [
    'Business account',
    'High transaction limits',
    'Overdraft facility available',
    'Dedicated business support'
  ]
};

export const NewAccountPage = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState<'Savings' | 'Checking' | 'Current'>('Savings');
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
    <PageWrapper title="Create New Account" backTo="/dashboard" backLabel="Back to Dashboard">
      <div className="w-full max-w-full overflow-x-hidden">
        <div className="max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Open a New Bank Account
            </h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              Choose your account type and start managing your finances
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div 
              className="w-full max-w-full mb-6 p-4 rounded-lg border flex items-start gap-3"
              style={{ 
                background: 'var(--badge-success-bg)', 
                borderColor: 'var(--accent-green)',
                color: 'var(--badge-success-text)'
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">Success!</p>
                <p className="text-sm mt-1">{success}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div 
              className="w-full max-w-full mb-6 p-4 rounded-lg border flex items-start gap-3"
              style={{ 
                background: 'var(--badge-danger-bg)', 
                borderColor: 'var(--accent-red)',
                color: 'var(--badge-danger-text)'
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="card w-full max-w-full">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Type Selection */}
              <div className="form-group">
                <label htmlFor="accountType" style={{ color: 'var(--text-secondary)' }}>
                  Account Type <span style={{ color: 'var(--accent-red)' }}>*</span>
                </label>
                <select
                  id="accountType"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as 'Savings' | 'Checking' | 'Current')}
                  disabled={mutation.isPending}
                  className="w-full max-w-full"
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Checking">Checking Account</option>
                  <option value="Current">Current Account</option>
                </select>
              </div>

              {/* Account Features */}
              <div 
                className="w-full max-w-full p-4 rounded-lg border"
                style={{ 
                  background: 'rgba(59, 130, 246, 0.05)',
                  borderColor: 'rgba(59, 130, 246, 0.2)'
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" style={{ color: 'var(--accent-blue)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Account Features</h3>
                </div>
                <ul className="space-y-2">
                  {ACCOUNT_FEATURES[accountType].map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-blue)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Important Information */}
              <div 
                className="w-full max-w-full p-4 rounded-lg border"
                style={{ 
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Important Information</h3>
                </div>
                <ul className="space-y-2">
                  {[
                    'Your new account will start with PKR 0.00 balance',
                    'A unique 10-digit account number will be generated',
                    'You can transfer funds from your existing accounts',
                    'Account will be active immediately'
                  ].map((info, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      <span>{info}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn btn-secondary flex-1"
                  disabled={mutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {mutation.isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
