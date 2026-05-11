import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountService } from '../services/accountService';
import type { CreateAccountRequest, DepositWithdrawRequest, TransferRequest } from '../types';

export const ACCOUNTS_KEY = ['accounts'] as const;
export const RECENT_TXN_KEY = ['recentTransactions'] as const;

export const useAccounts = () => {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY });
    queryClient.invalidateQueries({ queryKey: RECENT_TXN_KEY });
  };

  // ── Queries ────────────────────────────────────────────────────────────────

  const accountsQuery = useQuery({
    queryKey: ACCOUNTS_KEY,
    queryFn: accountService.getAll,
  });

  const recentTransactionsQuery = useQuery({
    queryKey: RECENT_TXN_KEY,
    queryFn: () => accountService.getRecentTransactions(5),
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createAccount = useMutation({
    mutationFn: (dto: CreateAccountRequest) => accountService.create(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEY }),
  });

  const deposit = useMutation({
    mutationFn: ({ accountId, dto }: { accountId: string; dto: DepositWithdrawRequest }) =>
      accountService.deposit(accountId, dto),
    onSuccess: invalidate,
  });

  const withdraw = useMutation({
    mutationFn: ({ accountId, dto }: { accountId: string; dto: DepositWithdrawRequest }) =>
      accountService.withdraw(accountId, dto),
    onSuccess: invalidate,
  });

  const transfer = useMutation({
    mutationFn: (dto: TransferRequest) => accountService.transfer(dto),
    onSuccess: invalidate,
  });

  return {
    // Data
    accounts: accountsQuery.data ?? [],
    recentTransactions: recentTransactionsQuery.data?.items ?? [],

    // Loading states
    accountsLoading: accountsQuery.isLoading,
    transactionsLoading: recentTransactionsQuery.isLoading,

    // Errors
    accountsError: accountsQuery.error,
    transactionsError: recentTransactionsQuery.error,

    // Refetch
    refetchAccounts: accountsQuery.refetch,

    // Mutations
    createAccount,
    deposit,
    withdraw,
    transfer,
  };
};
