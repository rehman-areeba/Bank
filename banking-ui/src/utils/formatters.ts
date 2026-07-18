import { Account } from '../api/accounts';

/** PKR currency formatter — single source of truth for all monetary display */
export const formatPKR = (amount: number): string =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 2,
  }).format(amount);

/** "****6789" — masked last-4 display for account numbers */
export const maskAccountNumber = (accountNumber: string): string =>
  `****${accountNumber.slice(-4)}`;

/** "Savings — ****6789"  — used in account selectors where balance is not shown */
export const formatAccountLabel = (account: Account): string =>
  `${account.accountType} — ${maskAccountNumber(account.accountNumber)}`;

/** "123456789 — Savings (PKR 1,000.00)"  — used in transfer/payment source selectors */
export const formatAccountOption = (account: Account): string =>
  `${account.accountNumber} — ${account.accountType} (${formatPKR(account.balance)})`;
