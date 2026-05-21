import axiosClient from './axiosClient';

export interface TransferRequest {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  description?: string;
}

export interface TransferResponse {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

export interface TransferHistoryItem {
  id: number;
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

// Execute a transfer between accounts
export const transferMoneyApi = async (transferData: TransferRequest): Promise<TransferResponse> => {
  const response = await axiosClient.post('/api/transfers', transferData);
  return response.data;
};

// Get transfer history for the authenticated user
export const getTransferHistoryApi = async (): Promise<TransferHistoryItem[]> => {
  const response = await axiosClient.get('/api/transfers/history');
  return response.data;
};