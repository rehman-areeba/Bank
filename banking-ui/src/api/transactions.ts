import axiosClient from './axiosClient';

export interface TransactionFilters {
  page: number;
  pageSize: number;
  accountId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
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

export interface TransactionsResponse {
  transactions: Transaction[];
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
}

export const getTransactionsApi = async (filters: TransactionFilters): Promise<TransactionsResponse> => {
  const params = new URLSearchParams();
  
  params.append('page', filters.page.toString());
  params.append('pageSize', filters.pageSize.toString());
  
  if (filters.accountId) params.append('accountId', filters.accountId);
  if (filters.type) params.append('type', filters.type);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);

  const response = await axiosClient.get(`/api/transactions?${params.toString()}`);
  return response.data;
};
