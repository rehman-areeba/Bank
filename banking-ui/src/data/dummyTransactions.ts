// Dummy transaction data for initial display
export const dummyTransactions = [
  {
    id: '1',
    transactionType: 'Deposit',
    amount: 25000,
    description: 'Salary Credit - January 2024',
    createdAt: new Date().toISOString(),
    status: 'Success',
    isCredit: true,
  },
  {
    id: '2',
    transactionType: 'Transfer',
    amount: 5000,
    description: 'Transfer to Savings Account',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    status: 'Success',
    isCredit: false,
  },
  {
    id: '3',
    transactionType: 'Withdrawal',
    amount: 12500,
    description: 'ATM Withdrawal - Gulberg Branch',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    status: 'Success',
    isCredit: false,
  },
  {
    id: '4',
    transactionType: 'Deposit',
    amount: 8000,
    description: 'Cash Deposit - Main Branch',
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    status: 'Success',
    isCredit: true,
  },
  {
    id: '5',
    transactionType: 'Transfer',
    amount: 2000,
    description: 'Bill Payment - K-Electric',
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
    status: 'Pending',
    isCredit: false,
  },
  {
    id: '6',
    transactionType: 'Transfer',
    amount: 15000,
    description: 'Online Transfer - Failed',
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
    status: 'Failed',
    isCredit: false,
  },
  {
    id: '7',
    transactionType: 'Deposit',
    amount: 50000,
    description: 'Cheque Deposit - Business Payment',
    createdAt: new Date(Date.now() - 518400000).toISOString(), // 6 days ago
    status: 'Success',
    isCredit: true,
  },
  {
    id: '8',
    transactionType: 'Withdrawal',
    amount: 3500,
    description: 'ATM Withdrawal - DHA Branch',
    createdAt: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
    status: 'Success',
    isCredit: false,
  },
];
