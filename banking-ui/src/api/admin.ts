import axiosClient from './axiosClient';

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string | null;
  transactionId: string | null;
  action: string;
  amount: number | null;
  status: string | null;
  ipAddress: string | null;
  reason: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface FailedLoginEntry {
  userId: string;
  email: string;
  fullName: string;
  failedAttempts: number;
  lastAttempt: string;
  ipAddresses: string[];
  riskLevel: 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface FailedLoginsResponse {
  timeWindow: string;
  suspiciousUsers: FailedLoginEntry[];
  count: number;
}

export interface FreezeAccountRequest {
  unfreeze: boolean;
  reason?: string;
}

export interface FreezeAccountResponse {
  accountId: string;
  status: string;
  message: string;
  reason: string | null;
}

export interface AuditLogsParams {
  pageNumber?: number;
  pageSize?: number;
  action?: string;
  status?: string;
  userEmail?: string;
  from?: string;
  to?: string;
  sortBy?: string;
  descending?: boolean;
}

export const getAuditLogsApi = async (params: AuditLogsParams = {}): Promise<AuditLogsResponse> => {
  const response = await axiosClient.get('/api/v1/admin/audit-logs', { params });
  return response.data;
};

export const getUserAuditLogsApi = async (userId: string, pageNumber = 1, pageSize = 50): Promise<AuditLogsResponse> => {
  const response = await axiosClient.get(`/api/v1/admin/audit-logs/${userId}`, {
    params: { pageNumber, pageSize },
  });
  return response.data;
};

export const getFailedLoginsApi = async (hours = 24): Promise<FailedLoginsResponse> => {
  const response = await axiosClient.get('/api/v1/admin/failed-logins', { params: { hours } });
  return response.data;
};

export const freezeAccountApi = async (
  accountId: string,
  body: FreezeAccountRequest
): Promise<FreezeAccountResponse> => {
  const response = await axiosClient.put(`/api/v1/admin/accounts/${accountId}/freeze`, body);
  return response.data;
};
