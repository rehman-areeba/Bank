import axiosClient from './axiosClient';

export interface Account {
  id: number;
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
  id: number;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
  accountId: number;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Get all accounts for the authenticated user
export const getAccountsApi = async (): Promise<Account[]> => {
  const response = await axiosClient.get('/api/accounts');
  return response.data;
};

// Get specific account details
export const getAccountApi = async (accountId: number): Promise<Account> => {
  const response = await axiosClient.get(`/api/accounts/${accountId}`);
  return response.data;
};

// Get account balance
export const getAccountBalanceApi = async (accountId: number): Promise<{ balance: number }> => {
  const response = await axiosClient.get(`/api/accounts/${accountId}/balance`);
  return response.data;
};

// Create new account
export const createAccountApi = async (accountData: { type: string }): Promise<Account> => {
  const response = await axiosClient.post('/api/accounts', { accountType: accountData.type });
  return response.data;
};

// Deposit money
export const depositApi = async (accountId: number, depositData: DepositWithdrawRequest): Promise<void> => {
  await axiosClient.post(`/api/accounts/${accountId}/deposit`, depositData);
};

// Withdraw money
export const withdrawApi = async (accountId: number, withdrawData: DepositWithdrawRequest): Promise<void> => {
  await axiosClient.post(`/api/accounts/${accountId}/withdraw`, withdrawData);
};

// Get transaction history for an account
export const getTransactionHistoryApi = async (
  accountId: number,
  page: number = 1,
  pageSize: number = 20,
  fromDate?: string,
  toDate?: string
): Promise<TransactionHistoryResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });
  
  if (fromDate) params.append('fromDate', fromDate);
  if (toDate) params.append('toDate', toDate);
  
  const response = await axiosClient.get(`/api/accounts/${accountId}/transactions?${params}`);
  return response.data;
};

// Get recent transactions across all accounts
export const getRecentTransactionsApi = async (): Promise<Transaction[]> => {
  const response = await axiosClient.get('/api/transactions/recent');
  return response.data;
};