import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Wallet,
  Building2,
  CreditCard,
} from 'lucide-react';
import type { Transaction, TransactionType, TransactionStatus } from '../../types';

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  pageSize?: number;
}

// Transaction category icons
const getTransactionIcon = (type: TransactionType, isCredit?: boolean) => {
  if (type === 'Deposit' || isCredit) {
    return <ArrowDownLeft className="w-4 h-4" />;
  }
  if (type === 'Withdrawal') {
    return <ArrowUpRight className="w-4 h-4" />;
  }
  return <ArrowLeftRight className="w-4 h-4" />;
};

// Status badge configuration
const statusConfig: Record<TransactionStatus, { icon: React.ReactNode; className: string }> = {
  Completed: {
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  Pending: {
    icon: <Clock className="w-3.5 h-3.5" />,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Failed: {
    icon: <XCircle className="w-3.5 h-3.5" />,
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};

// Transaction type badge colors
const typeConfig: Record<TransactionType, string> = {
  Deposit: 'bg-emerald-50 text-emerald-700',
  Withdrawal: 'bg-red-50 text-red-700',
  Transfer: 'bg-blue-50 text-blue-700',
};

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  showFilters = true,
  showSearch = true,
  showPagination = true,
  pageSize = 10,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | ''>('');
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | ''>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter and search logic
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      !searchQuery ||
      txn.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !filterType || txn.transactionType === filterType;
    const matchesStatus = !filterStatus || txn.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / pageSize);
  const paginatedTransactions = showPagination
    ? filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : filteredTransactions;

  const formatAmount = (amount: number, isCredit?: boolean) => {
    const formatted = new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(amount);
    return isCredit ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || filterType || filterStatus;

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          {showSearch && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          )}

          {/* Filter Button */}
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-all ${
                hasActiveFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex items-center justify-center w-5 h-5 text-xs font-semibold bg-blue-600 text-white rounded-full">
                  {[filterType, filterStatus].filter(Boolean).length}
                </span>
              )}
            </button>
          )}

          {/* Export Button */}
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-all">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      )}

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900">Filter Transactions</h3>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Type Filter */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as TransactionType | '');
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Deposit">Deposit</option>
                    <option value="Withdrawal">Withdrawal</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => {
                      setFilterStatus(e.target.value as TransactionStatus | '');
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <span className="font-medium">{filteredTransactions.length}</span>
          <span>
            {filteredTransactions.length === 1 ? 'transaction' : 'transactions'} found
          </span>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-200 rounded-lg" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-zinc-200 rounded" />
                          <div className="h-3 w-24 bg-zinc-200 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-20 bg-zinc-200 rounded-full" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-24 bg-zinc-200 rounded" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 w-20 bg-zinc-200 rounded ml-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 w-24 bg-zinc-200 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))
              ) : paginatedTransactions.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={5} className="px-6 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                        <Wallet className="w-8 h-8 text-zinc-400" />
                      </div>
                      <h3 className="text-base font-semibold text-zinc-900 mb-1">
                        No transactions found
                      </h3>
                      <p className="text-sm text-zinc-500 mb-4">
                        {hasActiveFilters
                          ? 'Try adjusting your filters'
                          : 'Your transactions will appear here'}
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                // Transaction Rows
                paginatedTransactions.map((txn, index) => (
                  <motion.tr
                    key={txn.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                            txn.isCredit
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {getTransactionIcon(txn.transactionType, txn.isCredit)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-zinc-900">
                            {txn.description || 'Transaction'}
                          </div>
                          <div className="text-xs text-zinc-500 font-mono">
                            #{txn.id.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                          typeConfig[txn.transactionType]
                        }`}
                      >
                        {txn.transactionType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-900">{formatDate(txn.createdAt)}</div>
                      <div className="text-xs text-zinc-500">{formatTime(txn.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          txn.isCredit ? 'text-emerald-600' : 'text-red-600'
                        }`}
                      >
                        {formatAmount(txn.amount, txn.isCredit)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${
                            statusConfig[txn.status].className
                          }`}
                        >
                          {statusConfig[txn.status].icon}
                          {txn.status}
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-zinc-100">
          {isLoading ? (
            // Mobile Loading Skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-zinc-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-zinc-200 rounded" />
                    <div className="h-3 w-24 bg-zinc-200 rounded" />
                  </div>
                  <div className="h-4 w-20 bg-zinc-200 rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="h-6 w-20 bg-zinc-200 rounded-full" />
                  <div className="h-6 w-24 bg-zinc-200 rounded-full" />
                </div>
              </div>
            ))
          ) : paginatedTransactions.length === 0 ? (
            // Mobile Empty State
            <div className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
                  <Wallet className="w-8 h-8 text-zinc-400" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 mb-1">
                  No transactions found
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  {hasActiveFilters
                    ? 'Try adjusting your filters'
                    : 'Your transactions will appear here'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            // Mobile Transaction Cards
            paginatedTransactions.map((txn, index) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="p-4 hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 ${
                      txn.isCredit
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {getTransactionIcon(txn.transactionType, txn.isCredit)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 truncate">
                      {txn.description || 'Transaction'}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {formatDate(txn.createdAt)} • {formatTime(txn.createdAt)}
                    </div>
                  </div>
                  <div
                    className={`text-sm font-semibold flex-shrink-0 ${
                      txn.isCredit ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {formatAmount(txn.amount, txn.isCredit)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                      typeConfig[txn.transactionType]
                    }`}
                  >
                    {txn.transactionType}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${
                      statusConfig[txn.status].className
                    }`}
                  >
                    {statusConfig[txn.status].icon}
                    {txn.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Pagination */}
        {showPagination && !isLoading && paginatedTransactions.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-zinc-200 flex items-center justify-between">
            <div className="text-sm text-zinc-600">
              Showing {(currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredTransactions.length)} of{' '}
              {filteredTransactions.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-zinc-600 hover:bg-zinc-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Load More (Alternative to Pagination) */}
        {!showPagination && hasMore && !isLoading && (
          <div className="px-6 py-4 border-t border-zinc-200 text-center">
            <button
              onClick={onLoadMore}
              className="px-6 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Load more transactions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
