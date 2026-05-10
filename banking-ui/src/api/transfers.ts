import axiosClient from './axiosClient';

interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  description?: string;
}

interface TransactionsParams {
  accountId?: string;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const transferApi = async (data: TransferRequest) => {
  const response = await axiosClient.post('/api/transfers', data);
  return response.data;
};

export const getTransactionsApi = async (params: TransactionsParams) => {
  if (!params.accountId) {
    // If no account specified, get first account's transactions
    const accounts = await axiosClient.get('/api/accounts');
    if (!accounts.data || accounts.data.length === 0) {
      return { items: [], currentPage: 1, totalPages: 0, totalCount: 0 };
    }
    params.accountId = accounts.data[0].id;
  }

  const { data } = await axiosClient.get(
    `/api/accounts/${params.accountId}/transactions?pageNumber=${params.page || 1}&pageSize=${params.pageSize || 20}`
  );
  
  return {
    items: data.data.map((txn: any) => ({
      id: txn.id,
      transactionType: txn.type,
      amount: txn.amount,
      description: txn.description,
      createdAt: txn.createdAt,
      status: txn.status,
    })),
    currentPage: data.pageNumber,
    totalPages: data.totalPages,
    totalCount: data.totalCount,
  };
};
