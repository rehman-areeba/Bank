import axiosClient from './axiosClient';

export interface ScheduledPayment {
  id: string;
  accountId: string;
  recipientAccount: string;
  amount: number;
  frequencyDays: number;
  nextRunDate: string; // ISO UTC string
  isActive: boolean;
}

export interface CreateScheduledPaymentRequest {
  fromAccountId: string;
  toAccountNumber: string;
  amount: number;
  frequencyDays: number;
  firstRunDate: string; // ISO string — sent as-is; backend calls .ToUniversalTime()
}

export const getScheduledPaymentsApi = async (): Promise<ScheduledPayment[]> => {
  const response = await axiosClient.get('/api/v1/scheduled-payments');
  return response.data;
};

export const createScheduledPaymentApi = async (
  data: CreateScheduledPaymentRequest
): Promise<ScheduledPayment> => {
  const response = await axiosClient.post('/api/v1/scheduled-payments', data);
  return response.data;
};

export const cancelScheduledPaymentApi = async (id: string): Promise<void> => {
  await axiosClient.delete(`/api/v1/scheduled-payments/${id}`);
};
