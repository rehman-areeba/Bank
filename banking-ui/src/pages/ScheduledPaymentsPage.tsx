import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '../store/authStore';
import { getAccountsApi } from '../api/accounts';
import {
  getScheduledPaymentsApi,
  createScheduledPaymentApi,
  cancelScheduledPaymentApi,
  ScheduledPayment,
} from '../api/scheduledPayments';
import { scheduledPaymentSchema, ScheduledPaymentFormData } from '../validation/schemas';
import { formatAccountOption, formatPKR } from '../utils/formatters';
import { invalidateScheduledPaymentQueries } from '../lib/queryInvalidation';
import { AccessibleModal } from '../components/ui/AccessibleModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Toast } from '../components/common/Toast';
import { MobileNav } from '../components/layout/MobileNav';
import { TableSkeleton } from '../components/skeletons';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

// Today's date in YYYY-MM-DD for the date input min attribute
const todayStr = () => new Date().toISOString().split('T')[0];

// ── Create Form Modal ─────────────────────────────────────────────────────────
interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateScheduledPaymentModal: React.FC<CreateModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccountsApi,
    staleTime: 5 * 60_000,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<ScheduledPaymentFormData>({
    resolver: zodResolver(scheduledPaymentSchema),
    mode: 'onChange',
  });

  const mutation = useMutation({
    mutationFn: (data: ScheduledPaymentFormData) =>
      createScheduledPaymentApi({
        fromAccountId: data.fromAccountId,
        toAccountNumber: data.toAccountNumber,
        amount: data.amount,
        frequencyDays: data.frequencyDays,
        // Send as ISO string; backend calls .ToUniversalTime() on it
        firstRunDate: new Date(data.firstRunDate).toISOString(),
      }),
    onSuccess: () => {
      invalidateScheduledPaymentQueries(queryClient);
      setToast({ type: 'success', message: 'Scheduled payment created successfully!' });
      reset();
      setTimeout(onClose, 1500);
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message ||
        'Failed to create scheduled payment. Please try again.';
      setToast({ type: 'error', message: msg });
    },
  });

  const handleClose = () => {
    if (!mutation.isPending) {
      reset();
      setToast(null);
      onClose();
    }
  };

  const activeAccounts = accounts?.filter((a) => a.isActive) ?? [];

  return (
    <>
      <AccessibleModal
        isOpen={isOpen}
        onClose={handleClose}
        title="New Scheduled Payment"
        description="Set up a recurring transfer that runs automatically."
        size="md"
      >
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {/* From Account */}
          <div>
            <label htmlFor="sp-from" className="block text-sm font-medium text-gray-700 mb-1">
              From Account
            </label>
            <select
              id="sp-from"
              {...register('fromAccountId')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.fromAccountId ? 'border-red-300' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.fromAccountId}
              aria-describedby={errors.fromAccountId ? 'sp-from-error' : undefined}
            >
              <option value="">Select source account</option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {formatAccountOption(acc)}
                </option>
              ))}
            </select>
            {errors.fromAccountId && (
              <p id="sp-from-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.fromAccountId.message}
              </p>
            )}
          </div>

          {/* To Account Number */}
          <div>
            <label htmlFor="sp-to" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Account Number
            </label>
            <input
              id="sp-to"
              type="text"
              maxLength={10}
              placeholder="9–10 digit account number"
              {...register('toAccountNumber')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.toAccountNumber ? 'border-red-300' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.toAccountNumber}
              aria-describedby={errors.toAccountNumber ? 'sp-to-error' : undefined}
            />
            {errors.toAccountNumber && (
              <p id="sp-to-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.toAccountNumber.message}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="sp-amount" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (PKR)
            </label>
            <input
              id="sp-amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="Minimum PKR 1"
              {...register('amount', { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.amount ? 'border-red-300' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? 'sp-amount-error' : undefined}
            />
            {errors.amount && (
              <p id="sp-amount-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.amount.message}
              </p>
            )}
          </div>

          {/* Frequency */}
          <div>
            <label htmlFor="sp-freq" className="block text-sm font-medium text-gray-700 mb-1">
              Repeat Every (days)
            </label>
            <input
              id="sp-freq"
              type="number"
              min="1"
              max="365"
              placeholder="e.g. 30 for monthly"
              {...register('frequencyDays', { valueAsNumber: true })}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.frequencyDays ? 'border-red-300' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.frequencyDays}
              aria-describedby={errors.frequencyDays ? 'sp-freq-error' : undefined}
            />
            {errors.frequencyDays && (
              <p id="sp-freq-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.frequencyDays.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Common: 7 = weekly, 14 = fortnightly, 30 = monthly
            </p>
          </div>

          {/* First Run Date */}
          <div>
            <label htmlFor="sp-date" className="block text-sm font-medium text-gray-700 mb-1">
              First Run Date
            </label>
            <input
              id="sp-date"
              type="date"
              min={todayStr()}
              {...register('firstRunDate')}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.firstRunDate ? 'border-red-300' : 'border-gray-300'
              }`}
              aria-invalid={!!errors.firstRunDate}
              aria-describedby={errors.firstRunDate ? 'sp-date-error' : undefined}
            />
            {errors.firstRunDate && (
              <p id="sp-date-error" className="mt-1 text-sm text-red-600" role="alert">
                {errors.firstRunDate.message}
              </p>
            )}
          </div>

          {/* Actions */}
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
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? 'Scheduling...' : 'Schedule Payment'}
            </button>
          </div>
        </form>
      </AccessibleModal>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
};

// ── Payment Row ───────────────────────────────────────────────────────────────
interface PaymentRowProps {
  payment: ScheduledPayment;
  onCancel: (payment: ScheduledPayment) => void;
}

const PaymentRow: React.FC<PaymentRowProps> = ({ payment, onCancel }) => (
  <li className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <div className="flex items-start space-x-4">
      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">
          To: <span className="font-mono">{payment.recipientAccount}</span>
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Every {payment.frequencyDays} day{payment.frequencyDays !== 1 ? 's' : ''} ·{' '}
          Next: {formatDate(payment.nextRunDate)}
        </p>
      </div>
    </div>

    <div className="flex items-center justify-between sm:justify-end gap-4">
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">{formatPKR(payment.amount)}</p>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            payment.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {payment.isActive ? 'Active' : 'Cancelled'}
        </span>
      </div>

      {payment.isActive && (
        <button
          onClick={() => onCancel(payment)}
          className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
          aria-label={`Cancel scheduled payment to ${payment.recipientAccount}`}
        >
          Cancel
        </button>
      )}
    </div>
  </li>
);

// ── Main Page ─────────────────────────────────────────────────────────────────
const ScheduledPaymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<ScheduledPayment | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data: payments, isLoading, isError, refetch } = useQuery({
    queryKey: ['scheduled-payments'],
    queryFn: getScheduledPaymentsApi,
    staleTime: 30_000,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelScheduledPaymentApi(id),
    onSuccess: () => {
      invalidateScheduledPaymentQueries(queryClient);
      setCancelTarget(null);
    },
    onError: (error: any) => {
      const msg =
        error.response?.data?.message || 'Failed to cancel payment. Please try again.';
      setToast({ type: 'error', message: msg });
      setCancelTarget(null);
    },
  });

  const handleLogout = () => { logout(); navigate('/login'); };

  const activePayments = payments?.filter((p) => p.isActive) ?? [];
  const inactivePayments = payments?.filter((p) => !p.isActive) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-900"
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700" aria-label="Back to dashboard">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Scheduled Payments</h1>
                <p className="text-sm text-gray-600 hide-mobile">Manage your recurring transfers</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 hide-mobile">{user?.name || user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                aria-label="Logout"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6" role="main">

        {/* Action bar */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            {isLoading ? '' : `${activePayments.length} active payment${activePayments.length !== 1 ? 's' : ''}`}
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            aria-label="Create new scheduled payment"
          >
            + New Scheduled Payment
          </button>
        </div>

        {/* Loading */}
        {isLoading && <TableSkeleton rows={4} showHeader={false} />}

        {/* Error */}
        {isError && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-700 font-medium mb-2">Failed to load scheduled payments</p>
            <button
              onClick={() => refetch()}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Active Payments */}
        {!isLoading && !isError && (
          <section aria-labelledby="active-heading">
            <h2 id="active-heading" className="text-lg font-semibold text-gray-900 mb-3">
              Active
            </h2>

            {activePayments.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled payments</h3>
                <p className="text-gray-500 mb-4">
                  Set up a recurring transfer and it will run automatically.
                </p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Create Scheduled Payment
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md">
                <ul className="divide-y divide-gray-100" role="list" aria-label="Active scheduled payments">
                  {activePayments.map((p) => (
                    <PaymentRow key={p.id} payment={p} onCancel={setCancelTarget} />
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Cancelled Payments */}
        {!isLoading && !isError && inactivePayments.length > 0 && (
          <section aria-labelledby="cancelled-heading">
            <h2 id="cancelled-heading" className="text-lg font-semibold text-gray-900 mb-3">
              Cancelled
            </h2>
            <div className="bg-white rounded-lg shadow-md opacity-75">
              <ul className="divide-y divide-gray-100" role="list" aria-label="Cancelled scheduled payments">
                {inactivePayments.map((p) => (
                  <PaymentRow key={p.id} payment={p} onCancel={setCancelTarget} />
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>

      {/* Create Modal */}
      <CreateScheduledPaymentModal isOpen={showCreate} onClose={() => setShowCreate(false)} />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
        title="Cancel Scheduled Payment"
        message={
          cancelTarget
            ? `Are you sure you want to cancel the ${formatPKR(cancelTarget.amount)} payment to account ${cancelTarget.recipientAccount}? This cannot be undone.`
            : ''
        }
        confirmText="Yes, Cancel Payment"
        cancelText="Keep It"
      />

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
};

export default ScheduledPaymentsPage;
