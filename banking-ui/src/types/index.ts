// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Customer' | 'Admin';
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  userId: string;
  fullName: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface MeResponse {
  userId: string;
  email: string;
  role: string;
  fullName: string;
}

// ─── Account ──────────────────────────────────────────────────────────────────

export type AccountType = 'Savings' | 'Checking' | 'Current';
export type AccountStatus = 'Active' | 'Frozen';

export interface Account {
  id: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateAccountRequest {
  type: AccountType;
}

export interface DepositWithdrawRequest {
  amount: number;
  description?: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export type TransactionType = 'Transfer' | 'Deposit' | 'Withdrawal';
export type TransactionStatus = 'Completed' | 'Pending' | 'Failed';

export interface Transaction {
  id: string;
  transactionType: TransactionType;
  amount: number;
  description: string | null;
  createdAt: string;
  status: TransactionStatus;
  isCredit?: boolean;
}

export interface TransactionPage {
  items: Transaction[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export interface TransactionsParams {
  accountId?: string;
  transactionType?: TransactionType | '';
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ─── Transfer ─────────────────────────────────────────────────────────────────

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

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string | null;
  transactionId: string | null;
  action: string;
  amount: number | null;
  status: string;
  ipAddress: string | null;
  createdAt: string;
}

export interface AuditLogPage {
  data: AuditLog[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface SuspiciousUser {
  userEmail: string | null;
  failedAttempts: number;
  lastAttempt: string;
  ipAddress: string | null;
}

export interface FailedLoginsResponse {
  timeWindow: string;
  suspiciousUsers: SuspiciousUser[];
  count: number;
}

export interface FreezeAccountResponse {
  accountId: string;
  status: 'ACTIVE' | 'FROZEN';
  message: string;
  reason: string | null;
}

// ─── API Pagination ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  autoDismiss: boolean;
}
