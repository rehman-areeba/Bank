import axiosClient from './axiosClient';

export interface AuditLog {
  id: number;
  userId: number;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

export interface FailedLogin {
  id: number;
  email: string;
  ipAddress: string;
  attemptTime: string;
  reason: string;
}

export interface AccountFreezeRequest {
  accountId: number;
  freeze: boolean;
  reason?: string;
}

// Get audit logs (Admin only)
export const getAuditLogsApi = async (): Promise<AuditLog[]> => {
  const response = await axiosClient.get('/api/admin/audit-logs');
  return response.data;
};

// Get audit logs for specific user (Admin only)
export const getUserAuditLogsApi = async (userId: number): Promise<AuditLog[]> => {
  const response = await axiosClient.get(`/api/admin/audit-logs/${userId}`);
  return response.data;
};

// Get failed login attempts (Admin only)
export const getFailedLoginsApi = async (): Promise<FailedLogin[]> => {
  const response = await axiosClient.get('/api/admin/failed-logins');
  return response.data;
};

// Freeze or unfreeze account (Admin only)
export const freezeAccountApi = async (freezeData: AccountFreezeRequest): Promise<void> => {
  await axiosClient.put(`/api/admin/accounts/${freezeData.accountId}/freeze`, {
    freeze: freezeData.freeze,
    reason: freezeData.reason,
  });
};