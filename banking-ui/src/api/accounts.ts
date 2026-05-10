import axiosClient from './axiosClient';

export const getAccountsApi = async () => {
  const { data } = await axiosClient.get('/api/accounts');
  return data;
};

export const getRecentTransactionsApi = async (limit = 5) => {
  const { data } = await axiosClient.get(`/api/transactions?pageSize=${limit}`);
  return data;
};
