import axiosClient from './axiosClient';

export const getAuditLogsByUserApi = async (userId: string, page = 1, pageSize = 50) => {
  const { data } = await axiosClient.get(`/api/admin/audit-logs/${userId}?pageNumber=${page}&pageSize=${pageSize}`);
  return data;
};

export const getFailedLoginsApi = async (hours = 24) => {
  const { data } = await axiosClient.get(`/api/admin/failed-logins?hours=${hours}`);
  return data;
};

export const freezeAccountApi = async (accountId: string, unfreeze = false, reason?: string) => {
  const { data } = await axiosClient.put(`/api/admin/accounts/${accountId}/freeze`, {
    unfreeze,
    reason,
  });
  return data;
};

export const getAllAccountsApi = async () => {
  const { data } = await axiosClient.get('/api/accounts');
  return data;
};
