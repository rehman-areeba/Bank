import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getFailedLoginsApi, freezeAccountApi } from '../api/admin';
import axiosClient from '../api/axiosClient';

export const AdminPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'accounts' | 'audit' | 'security'>('accounts');
  const [selectedUserId, setSelectedUserId] = useState('');

  // Fetch all accounts
  const { data: accounts, isLoading: accountsLoading, refetch: refetchAccounts } = useQuery({
    queryKey: ['adminAccounts'],
    queryFn: async () => {
      const { data } = await axiosClient.get('/api/accounts');
      return data;
    },
  });

  // Fetch failed logins
  const { data: failedLogins, isLoading: securityLoading } = useQuery({
    queryKey: ['failedLogins'],
    queryFn: () => getFailedLoginsApi(24),
    enabled: activeTab === 'security',
  });

  // Fetch audit logs for selected user
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['auditLogs', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      const { data } = await axiosClient.get(`/api/admin/audit-logs/${selectedUserId}`);
      return data;
    },
    enabled: activeTab === 'audit' && !!selectedUserId,
  });

  const freezeMutation = useMutation({
    mutationFn: ({ accountId, unfreeze, reason }: { accountId: string; unfreeze: boolean; reason?: string }) =>
      freezeAccountApi(accountId, unfreeze, reason),
    onSuccess: (data) => {
      setMessage(data.message);
      refetchAccounts();
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (err: any) => {
      setMessage(err.response?.data?.detail || 'Operation failed');
    },
  });

  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
    }).format(balance);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'accounts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account Management
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security & Fraud
            </button>
          </nav>
        </div>

        {/* Account Management Tab */}
        {activeTab === 'accounts' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">All User Accounts</h2>

            {accountsLoading && <p className="text-gray-600">Loading accounts...</p>}

            {accounts && accounts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Account Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Type
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Balance
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Created
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accounts.map((account: any) => (
                      <tr key={account.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {account.accountNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {account.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {formatBalance(account.balance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {account.isActive ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Frozen
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                          {formatDate(account.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() =>
                              freezeMutation.mutate({
                                accountId: account.id,
                                unfreeze: !account.isActive,
                                reason: account.isActive ? 'Admin action' : 'Unfrozen by admin',
                              })
                            }
                            disabled={freezeMutation.isPending}
                            className={`px-3 py-1 rounded text-white text-xs ${
                              account.isActive
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-green-600 hover:bg-green-700'
                            } disabled:bg-gray-400`}
                          >
                            {account.isActive ? 'Freeze' : 'Unfreeze'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No accounts found</p>
            )}
          </div>
        )}

        {/* Audit Logs Tab */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Audit Logs</h2>

            <div className="mb-6">
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
                Select User ID to view audit logs:
              </label>
              <input
                id="userId"
                type="text"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Enter User GUID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500">
                Tip: Get User ID from the database or user profile
              </p>
            </div>

            {auditLoading && <p className="text-gray-600">Loading audit logs...</p>}

            {auditLogs && auditLogs.data && auditLogs.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date/Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        IP Address
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.data.map((log: any) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                          {log.amount ? formatBalance(log.amount) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              log.status === 'SUCCESS'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {log.ipAddress || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : selectedUserId ? (
              <p className="text-gray-600">No audit logs found for this user</p>
            ) : (
              <p className="text-gray-600">Enter a User ID to view audit logs</p>
            )}
          </div>
        )}

        {/* Security & Fraud Tab */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Security & Fraud Detection</h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Failed Login Attempts (Last 24 Hours)</h3>

              {securityLoading && <p className="text-gray-600">Loading security data...</p>}

              {failedLogins && failedLogins.suspiciousUsers && failedLogins.suspiciousUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          User Email
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                          Failed Attempts
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Last Attempt
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          IP Address
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {failedLogins.suspiciousUsers.map((user: any, index: number) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.userEmail || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              {user.failedAttempts}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(user.lastAttempt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.ipAddress || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-sm text-gray-600">
                    Total suspicious activities: {failedLogins.count}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-green-600 font-medium">✓ No suspicious activity detected</p>
                  <p className="text-sm text-gray-500 mt-2">All login attempts are normal</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
