import axiosClient from './axiosClient';
import type {
  Account,
  Transaction,
  TransactionPage,
  TransactionsParams,
  TransferRequest,
  TransferResponse,
  CreateAccountRequest,
  DepositWithdrawRequest,
  AuditLogPage,
  FailedLoginsResponse,
  FreezeAccountResponse,
  PaginatedResponse,
} from '../types';

// ─── Raw backend shapes (before mapping) ─────────────────────────────────────

interface RawAccount {
  id: string;
  accountNumber: string;
  type: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

interface RawTransaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  createdAt: string;
  status: string;
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

const mapAccount = (raw: RawAccount): Account => ({
  id: raw.id,
  accountNumber: raw.accountNumber,
  accountType: raw.type as Account['accountType'],
  balance: raw.balance,
  isActive: raw.isActive,
  createdAt: raw.createdAt,
});

const mapTransaction = (raw: RawTransaction): Transaction => ({
  id: raw.id,
  transactionType: raw.type as Transaction['transactionType'],
  amount: raw.amount,
  description: raw.description,
  createdAt: raw.createdAt,
  status: raw.status as Transaction['status'],
  isCredit: raw.type === 'Deposit',
});

// ─── Account Service ──────────────────────────────────────────────────────────

export const accountService = {
  // Accounts
  getAll: async (): Promise<Account[]> => {
    const { data } = await axiosClient.get<RawAccount[]>('/api/accounts');
    return data.map(mapAccount);
  },

  getBalance: async (accountId: string): Promise<number> => {
    const { data } = await axiosClient.get<{ balance: number }>(
      `/api/accounts/${accountId}/balance`
    );
    return data.balance;
  },

  create: async (dto: CreateAccountRequest): Promise<Account> => {
    const { data } = await axiosClient.post<RawAccount>('/api/accounts', dto);
    return mapAccount(data);
  },

  deposit: async (accountId: string, dto: DepositWithdrawRequest) => {
    const { data } = await axiosClient.post<{ accountId: string; newBalance: number; message: string }>(
      `/api/accounts/${accountId}/deposit`,
      dto
    );
    return data;
  },

  withdraw: async (accountId: string, dto: DepositWithdrawRequest) => {
    const { data } = await axiosClient.post<{ accountId: string; newBalance: number; message: string }>(
      `/api/accounts/${accountId}/withdraw`,
      dto
    );
    return data;
  },

  // Transactions
  getTransactions: async (params: TransactionsParams): Promise<TransactionPage> => {
    let accountId = params.accountId;

    if (!accountId) {
      const { data: accounts } = await axiosClient.get<RawAccount[]>('/api/accounts');
      if (!accounts.length) return { items: [], currentPage: 1, totalPages: 0, totalCount: 0 };
      accountId = accounts[0].id;
    }

    const { data } = await axiosClient.get<PaginatedResponse<RawTransaction>>(
      `/api/accounts/${accountId}/transactions`,
      {
        params: {
          pageNumber: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
        },
      }
    );

    return {
      items: data.data.map(mapTransaction),
      currentPage: data.pageNumber,
      totalPages: data.totalPages,
      totalCount: data.totalCount,
    };
  },

  getRecentTransactions: async (limit = 5): Promise<{ items: Transaction[] }> => {
    const { data: accounts } = await axiosClient.get<RawAccount[]>('/api/accounts');
    if (!accounts.length) return { items: [] };

    const { data } = await axiosClient.get<PaginatedResponse<RawTransaction>>(
      `/api/accounts/${accounts[0].id}/transactions`,
      { params: { pageNumber: 1, pageSize: limit } }
    );

    return { items: data.data.map(mapTransaction) };
  },

  // Transfers
  transfer: async (dto: TransferRequest): Promise<TransferResponse> => {
    const { data } = await axiosClient.post<TransferResponse>('/api/transfers', dto);
    return data;
  },

  // Admin
  getAuditLogs: async (userId: string, page = 1, pageSize = 50): Promise<AuditLogPage> => {
    const { data } = await axiosClient.get<AuditLogPage>(
      `/api/admin/audit-logs/${userId}`,
      { params: { pageNumber: page, pageSize } }
    );
    return data;
  },

  getFailedLogins: async (hours = 24): Promise<FailedLoginsResponse> => {
    const { data } = await axiosClient.get<FailedLoginsResponse>(
      '/api/admin/failed-logins',
      { params: { hours } }
    );
    return data;
  },

  freezeAccount: async (
    accountId: string,
    unfreeze = false,
    reason?: string
  ): Promise<FreezeAccountResponse> => {
    const { data } = await axiosClient.put<FreezeAccountResponse>(
      `/api/admin/accounts/${accountId}/freeze`,
      { unfreeze, reason }
    );
    return data;
  },
};
