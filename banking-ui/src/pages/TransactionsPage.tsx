import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PageWrapper } from '../components/layout/PageWrapper';
import { TransactionTable } from '../components/banking/TransactionTable';
import { accountService } from '../services/accountService';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../hooks/useAuth';
import { generateStatement } from '../utils/generateStatement';
import type { TransactionsParams } from '../types';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const PKR = (amount: number, type: string) => {
  const formatted = new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(amount);
  const isCredit = type === 'Deposit' || type === 'Credit';
  return (
    <span className={isCredit ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
      {isCredit ? '+' : '-'}{formatted}
    </span>
  );
};

const STATUS_COLORS: Record<string, string> = {
  Completed: 'bg-green-100 text-green-800',
  Success:   'bg-green-100 text-green-800',
  Pending:   'bg-yellow-100 text-yellow-800',
  Failed:    'bg-red-100 text-red-800',
};

const TYPE_COLORS: Record<string, string> = {
  Deposit:    'bg-green-100 text-green-800',
  Withdrawal: 'bg-red-100 text-red-800',
  Transfer:   'bg-blue-100 text-blue-800',
};

export const TransactionsPage = () => {
  const { user } = useAuth();
  const { accounts } = useAccounts();

  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  const params: Omit<TransactionsParams, 'page'> = {
    accountId: selectedAccountId || undefined,
    transactionType: (transactionType as any) || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useInfiniteQuery({
      queryKey: ['transactions', params],
      queryFn: ({ pageParam = 1 }) =>
        accountService.getTransactions({ ...params, page: pageParam, pageSize: 20 }),
      getNextPageParam: (last) => (last.currentPage < last.totalPages ? last.currentPage + 1 : undefined),
      initialPageParam: 1,
    });

  const allTransactions = data?.pages.flatMap((p) => p.items) ?? [];

  // ── Statement period label ────────────────────────────────────────────────
  const now = new Date();
  const periodLabel =
    startDate && endDate
      ? `${startDate} to ${endDate}`
      : `${now.toLocaleString('en-PK', { month: 'long' })} ${now.getFullYear()}`;

  // ── Download handler ──────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Fetch ALL pages for the statement (not just loaded ones)
      const allPages = await accountService.getTransactions({ ...params, page: 1, pageSize: 1000 });
      const account = accounts.find((a) => a.id === selectedAccountId) ?? accounts[0];
      if (!account) return;
      generateStatement(account, user?.name ?? 'Account Holder', allPages.items, periodLabel);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageWrapper title="Transaction History" backTo="/dashboard" backLabel="Dashboard">

      {/* Filters + Download */}
      <div className="card mb-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Filters</h2>
          <button
            onClick={handleDownload}
            disabled={downloading || accounts.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: downloading ? '#6b7280' : '#2563eb' }}
          >
            {downloading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Download Statement
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-secondary)' }}>Account</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            >
              <option value="">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNumber} — {a.accountType}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-secondary)' }}>Type</label>
            <select
              value={transactionType}
              onChange={(e) => setTransactionType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            >
              <option value="">All Types</option>
              <option value="Transfer">Transfer</option>
              <option value="Deposit">Deposit</option>
              <option value="Withdrawal">Withdrawal</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-secondary)' }}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-secondary)' }}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Modern Transaction Table */}
      {error && (
        <div className="p-10 text-center text-red-500">Failed to load transactions.</div>
      )}

      {!error && (
        <TransactionTable
          transactions={allTransactions}
          isLoading={isLoading}
          onLoadMore={() => fetchNextPage()}
          hasMore={hasNextPage}
          showFilters={false}
          showSearch={true}
          showPagination={true}
          pageSize={20}
        />
      )}
    </PageWrapper>
  );
};
