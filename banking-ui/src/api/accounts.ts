import axiosClient from './axiosClient';

export const getAccountsApi = async () => {
  const { data } = await axiosClient.get('/api/accounts');
  // Backend returns array directly
  return data.map((account: any) => ({
    id: account.id,
    accountNumber: account.accountNumber,
    accountType: account.type,
    balance: account.balance,
    isActive: account.isActive,
    createdAt: account.createdAt,
  }));
};

export const getRecentTransactionsApi = async (limit = 5) => {
  // Get first account's transactions as "recent" for dashboard
  const accounts = await axiosClient.get('/api/accounts');
  if (!accounts.data || accounts.data.length === 0) {
    return { items: [] };
  }
  
  const firstAccountId = accounts.data[0].id;
  const { data } = await axiosClient.get(
    `/api/accounts/${firstAccountId}/transactions?pageNumber=1&pageSize=${limit}`
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
  };
};
