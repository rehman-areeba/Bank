import { QueryClient } from '@tanstack/react-query';

/**
 * Invalidates the accounts list and, optionally, a specific account.
 * Use after: create account, deposit, withdraw, freeze/unfreeze.
 */
export const invalidateAccountQueries = (
  queryClient: QueryClient,
  accountId?: string,
): void => {
  queryClient.invalidateQueries({ queryKey: ['accounts'] });
  if (accountId) {
    queryClient.invalidateQueries({ queryKey: ['account', accountId] });
  }
};

/**
 * Invalidates recent transactions and, optionally, a specific account's transaction history.
 * Use after: deposit, withdraw, transfer.
 */
export const invalidateTransactionQueries = (
  queryClient: QueryClient,
  accountId?: string,
): void => {
  queryClient.invalidateQueries({ queryKey: ['recent-transactions'] });
  if (accountId) {
    queryClient.invalidateQueries({ queryKey: ['transactions', accountId] });
  }
};

/**
 * Invalidates the scheduled payments list.
 * Use after: create or cancel a scheduled payment.
 */
export const invalidateScheduledPaymentQueries = (queryClient: QueryClient): void => {
  queryClient.invalidateQueries({ queryKey: ['scheduled-payments'] });
};
