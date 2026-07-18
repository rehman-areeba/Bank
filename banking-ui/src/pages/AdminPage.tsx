import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { getMeApi } from '../api/auth';
import {
  getAuditLogsApi,
  getFailedLoginsApi,
  freezeAccountApi,
  AuditLog,
  FailedLoginEntry,
} from '../api/admin';
import { invalidateAccountQueries } from '../lib/queryInvalidation';
import { TableSkeleton } from '../components/skeletons';
import { MobileNav } from '../components/layout/MobileNav';
import { Toast } from '../components/common/Toast';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

type TabType = 'audit-logs' | 'failed-logins' | 'freeze' | 'profile';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });

// ── Audit Logs Tab ────────────────────────────────────────────────────────────
const AuditLogsTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterEmail, setFilterEmail] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page, filterAction, filterEmail],
    queryFn: () =>
      getAuditLogsApi({
        pageNumber: page,
        pageSize: 20,
        action: filterAction || undefined,
        userEmail: filterEmail || undefined,
      }),
    staleTime: 30_000,
  });

  if (isLoading) return <TableSkeleton rows={8} showHeader={false} />;

  if (isError)
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-3">Failed to load audit logs.</p>
        <button onClick={() => refetch()} className="text-blue-600 text-sm hover:underline">
          Retry
        </button>
      </div>
    );

  const logs: AuditLog[] = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by action (e.g. TRANSFER)"
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
          aria-label="Filter by action"
        />
        <input
          type="text"
          placeholder="Filter by email"
          value={filterEmail}
          onChange={(e) => { setFilterEmail(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-56"
          aria-label="Filter by email"
        />
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No audit logs found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm" role="table">
            <thead className="bg-gray-50">
              <tr>
                {['Timestamp', 'User', 'Action', 'Status', 'IP Address', 'Details'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    scope="col"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-900">{log.userEmail ?? log.userId}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.status && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'FAILED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.ipAddress ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">
                    {log.reason ?? (log.amount != null ? `Amount: ${log.amount}` : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages} ({data?.totalCount} total)
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// ── Failed Logins Tab ─────────────────────────────────────────────────────────
const FailedLoginsTab: React.FC = () => {
  const [hours, setHours] = useState(24);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-failed-logins', hours],
    queryFn: () => getFailedLoginsApi(hours),
    staleTime: 60_000,
  });

  if (isLoading) return <TableSkeleton rows={5} showHeader={false} />;

  if (isError)
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-3">Failed to load failed login data.</p>
        <button onClick={() => refetch()} className="text-blue-600 text-sm hover:underline">
          Retry
        </button>
      </div>
    );

  const users: FailedLoginEntry[] = data?.suspiciousUsers ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="hours-select" className="text-sm font-medium text-gray-700">
          Time window:
        </label>
        <select
          id="hours-select"
          value={hours}
          onChange={(e) => setHours(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>Last 1 hour</option>
          <option value={6}>Last 6 hours</option>
          <option value={24}>Last 24 hours</option>
          <option value={72}>Last 3 days</option>
          <option value={168}>Last 7 days</option>
        </select>
        <span className="text-sm text-gray-500">{data?.count ?? 0} suspicious user(s)</span>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-10 w-10 text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          No suspicious login activity in the selected window.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm" role="table">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Email', 'Failed Attempts', 'Last Attempt', 'Risk Level'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    scope="col"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.userId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900">{u.fullName || '—'}</td>
                  <td className="px-4 py-3 text-gray-900">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.failedAttempts >= 10
                          ? 'bg-red-100 text-red-800'
                          : u.failedAttempts >= 7
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {u.failedAttempts}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(u.lastAttempt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.riskLevel === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : u.riskLevel === 'HIGH'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {u.riskLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ── Freeze / Unfreeze Tab ─────────────────────────────────────────────────────
const FreezeTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [accountId, setAccountId] = useState('');
  const [reason, setReason] = useState('');
  const [unfreeze, setUnfreeze] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => freezeAccountApi(accountId.trim(), { unfreeze, reason: reason || undefined }),
    onSuccess: (data) => {
      setToast({ type: 'success', message: data.message });
      invalidateAccountQueries(queryClient, accountId.trim());
      setAccountId('');
      setReason('');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Operation failed. Please try again.';
      setToast({ type: 'error', message: msg });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId.trim()) return;
    setConfirm(true);
  };

  return (
    <>
      <div className="max-w-md">
        <p className="text-sm text-gray-600 mb-6">
          Enter an account ID to freeze or unfreeze it. A frozen account cannot send or receive funds.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="account-id" className="block text-sm font-medium text-gray-700 mb-1">
              Account ID (UUID)
            </label>
            <input
              id="account-id"
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              aria-required="true"
            />
          </div>

          <div>
            <label htmlFor="freeze-reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason (optional)
            </label>
            <input
              id="freeze-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Suspicious activity"
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={!unfreeze}
                onChange={() => setUnfreeze(false)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">Freeze account</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={unfreeze}
                onChange={() => setUnfreeze(true)}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Unfreeze account</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!accountId.trim() || mutation.isPending}
            className={`px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              unfreeze ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {mutation.isPending ? 'Processing...' : unfreeze ? 'Unfreeze Account' : 'Freeze Account'}
          </button>
        </form>
      </div>

      <ConfirmDialog
        isOpen={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => { setConfirm(false); mutation.mutate(); }}
        title={unfreeze ? 'Confirm Unfreeze' : 'Confirm Freeze'}
        message={`Are you sure you want to ${unfreeze ? 'unfreeze' : 'freeze'} account ${accountId}?${reason ? ` Reason: ${reason}` : ''}`}
        confirmText={unfreeze ? 'Unfreeze' : 'Freeze'}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </>
  );
};

// ── User Profile Tab ──────────────────────────────────────────────────────────
const ProfileTab: React.FC = () => {
  const { user: storeUser } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: getMeApi,
    staleTime: 5 * 60_000,
  });

  if (isLoading)
    return (
      <div className="space-y-3 max-w-sm">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-6 w-full rounded" />
        ))}
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-3">Failed to load profile.</p>
        <button onClick={() => refetch()} className="text-blue-600 text-sm hover:underline">
          Retry
        </button>
      </div>
    );

  const displayName = data?.fullName || storeUser?.name || data?.email || storeUser?.email || 'Unknown';
  const displayEmail = data?.email || storeUser?.email || '—';

  return (
    <div className="max-w-sm">
      <dl className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Full Name</dt>
          <dd className="text-base font-semibold text-gray-900">{displayName}</dd>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Email</dt>
          <dd className="text-base text-gray-900">{displayEmail}</dd>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Role</dt>
          <dd>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              {data?.role || storeUser?.role || '—'}
            </span>
          </dd>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">User ID</dt>
          <dd className="text-xs font-mono text-gray-600 break-all">{data?.userId || storeUser?.id || '—'}</dd>
        </div>
      </dl>
    </div>
  );
};

// ── Main AdminPage ────────────────────────────────────────────────────────────
export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('audit-logs');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'audit-logs',    label: 'Audit Logs',    icon: '📋' },
    { id: 'failed-logins', label: 'Failed Logins', icon: '🔒' },
    { id: 'freeze',        label: 'Freeze Account', icon: '❄️' },
    { id: 'profile',       label: 'My Profile',    icon: '👤' },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'audit-logs':    return <AuditLogsTab />;
      case 'failed-logins': return <FailedLoginsTab />;
      case 'freeze':        return <FreezeTab />;
      case 'profile':       return <ProfileTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 hide-mobile">Compliance, security monitoring &amp; account management</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-700 hide-mobile" aria-label={`Logged in as ${user?.name || user?.email}`}>
                {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                aria-label="Logout from your account"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8" role="main">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow-md">
            <div className="border-b border-gray-200">
              <nav className="flex overflow-x-auto -mb-px" aria-label="Admin tabs" role="tablist">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    aria-controls={`${tab.id}-panel`}
                    id={`${tab.id}-tab`}
                  >
                    <span aria-hidden="true">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div
              className="p-6"
              role="tabpanel"
              id={`${activeTab}-panel`}
              aria-labelledby={`${activeTab}-tab`}
            >
              {renderTab()}
            </div>
          </div>
        </div>
      </main>

      <MobileNav isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
    </div>
  );
};
