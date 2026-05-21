import { axiosClient } from './axiosClient';

export interface TransferRequest {
  fromAccountId: number;
  toAccountNumber: string;
  amount: number;
  description: string;
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

export const transferFundsApi = async (transferData: TransferRequest): Promise<TransferResponse> => {
  const response = await axiosClient.post('/api/transfers', transferData);
  return response.data;
};