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
    <div className="page-wrapper">
      <div className="navbar">
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navbar-text)' }}>Create New Account</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-ghost"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="page-container" style={{ maxWidth: '600px' }}>
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Open a New Bank Account</h2>
          </div>

          <div className="card-body">
            {success && (
              <div className="badge badge-success" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                ✓ {success}
              </div>
            )}

            {error && (
              <div className="badge badge-danger" style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center' }}>
                ✕ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="form-group">
                <label htmlFor="accountType" className="form-label">
                  Account Type <span className="required">*</span>
                </label>
                <select
                  id="accountType"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="form-input form-select"
                  disabled={mutation.isPending}
                >
                  <option value="Savings">Savings Account</option>
                  <option value="Checking">Checking Account</option>
                  <option value="Current">Current Account</option>
                </select>
              </div>

              <div style={{ background: 'var(--badge-info-bg)', border: '1px solid var(--badge-info-border)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                <h3 style={{ fontWeight: 600, color: 'var(--badge-info-text)', marginBottom: '0.75rem' }}>Account Features:</h3>
                <ul style={{ fontSize: '0.875rem', color: 'var(--badge-info-text)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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

              <div style={{ background: 'var(--color-bg-sunken)', border: '1px solid var(--color-border-default)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                <h3 style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.75rem' }}>Important Information:</h3>
                <ul style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>• Your new account will start with PKR 0.00 balance</li>
                  <li>• A unique 10-digit account number will be generated</li>
                  <li>• You can transfer funds from your existing accounts</li>
                  <li>• Account will be active immediately</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-primary btn-lg btn-block"
              >
                {mutation.isPending ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
