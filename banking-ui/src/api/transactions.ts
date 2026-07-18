import { getTransactionHistoryApi } from './accounts';

export type { TransactionHistoryResponse } from './accounts';

export interface TransactionFilters {
  accountId: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

// Re-export the real endpoint — the old /api/transactions does not exist.
// TransactionsPage now calls GET /api/accounts/{id}/transactions via this wrapper.
export { getTransactionHistoryApi as getTransactionsApi };
