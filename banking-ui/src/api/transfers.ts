import axiosClient from './axiosClient';

export interface TransferRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export interface TransferResponse {
  transactionId: string;
  status: string;
  amount: number;
  timestamp: string;
  updatedBalance: number;
}

export const transferFundsApi = async (transferData: TransferRequest): Promise<TransferResponse> => {
  const response = await axiosClient.post('/api/transfers', transferData);
  return response.data;
};
