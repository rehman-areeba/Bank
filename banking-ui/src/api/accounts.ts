import axiosClient from './axiosClient';

export interface Account {
  id: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAccountRequest {
  accountType: string;
}

export interface DepositWithdrawRequest {
  amount: number;
  description?: string;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  accountId: string;
}

export interface TransactionHistoryResponse {
  data: Transaction[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Get all accounts for the authenticated user
export const getAccountsApi = async (): Promise<Account[]> => {
  const response = await axiosClient.get('/api/v1/accounts');
  return response.data;
};

// Get specific account details
export const getAccountApi = async (accountId: string): Promise<Account> => {
  const response = await axiosClient.get(`/api/v1/accounts/${accountId}`);
  return response.data;
};

// Get account balance
export const getAccountBalanceApi = async (accountId: string): Promise<{ balance: number }> => {
  const response = await axiosClient.get(`/api/v1/accounts/${accountId}/balance`);
  return response.data;
};

// Create new account
export const createAccountApi = async (accountData: CreateAccountRequest): Promise<Account> => {
  const response = await axiosClient.post('/api/v1/accounts', { accountType: accountData.accountType });
  return response.data;
};

// Deposit money
export const depositApi = async (accountId: string, depositData: DepositWithdrawRequest): Promise<void> => {
  await axiosClient.post(`/api/v1/accounts/${accountId}/deposit`, depositData);
};

// Withdraw money
export const withdrawApi = async (accountId: string, withdrawData: DepositWithdrawRequest): Promise<void> => {
  await axiosClient.post(`/api/v1/accounts/${accountId}/withdraw`, withdrawData);
};

// Get transaction history for an account
export const getTransactionHistoryApi = async (
  accountId: string,
  pageNumber: number = 1,
  pageSize: number = 20
): Promise<TransactionHistoryResponse> => {
  const response = await axiosClient.get(`/api/v1/accounts/${accountId}/transactions`, {
    params: { pageNumber, pageSize }
  });
  return response.data;
};

// Get recent transactions across all accounts
export const getRecentTransactionsApi = async (): Promise<Transaction[]> => {
  const response = await axiosClient.get('/api/v1/transactions/recent');
  return response.data;
};