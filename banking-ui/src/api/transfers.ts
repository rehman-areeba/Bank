import axiosClient from './axiosClient';

interface TransferRequest {
  fromAccountId: number;
  toAccountNumber: string;
  amount: number;
  description?: string;
}

interface TransactionsParams {
  accountId?: number;
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
  const queryParams = new URLSearchParams();
  
  if (params.accountId) queryParams.append('accountId', params.accountId.toString());
  if (params.transactionType) queryParams.append('transactionType', params.transactionType);
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());

  const { data } = await axiosClient.get(`/api/transactions?${queryParams.toString()}`);
  return data;
};
