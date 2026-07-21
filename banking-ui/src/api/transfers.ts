import axiosClient from './axiosClient';

export interface TransferRequest {
  fromAccountId: string;
  toAccountNumber: string;
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

export interface TransferStatus {
  transactionId: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: string;
}

export const transferFundsApi = async (transferData: TransferRequest): Promise<TransferResponse> => {
  const response = await axiosClient.post('/api/v1/transfers', transferData);
  return response.data;
};

export const getTransferStatusApi = async (id: string): Promise<TransferStatus> => {
  const response = await axiosClient.get(`/api/v1/transfers/${id}`);
  return response.data;
};
