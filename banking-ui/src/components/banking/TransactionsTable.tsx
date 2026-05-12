import React from 'react';

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  createdAt: string;
  isCredit: boolean;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  title?: string;
}

export const TransactionsTable: React.FC<TransactionsTableProps> = ({ 
  transactions, 
  title = "Recent Transactions" 
}) => {
  const formatAmount = (amount: number, isCredit: boolean) => {
    const formatted = new Intl.NumberFormat('en-PK', { 
      style: 'currency', 
      currency: 'PKR' 
    }).format(amount);
    return isCredit ? `+${formatted}` : `-${formatted}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success') return 'status-success';
    if (statusLower === 'failed') return 'status-failed';
    return 'status-pending';
  };

  const getTransactionIcon = (type: string, isCredit: boolean) => {
    if (type === 'Deposit' || isCredit) {
      return (
        <div className="transaction-icon icon-credit">
          <span>↓</span>
        </div>
      );
    }
    if (type === 'Withdrawal') {
      return (
        <div className="transaction-icon icon-debit">
          <span>↑</span>
        </div>
      );
    }
    return (
      <div className="transaction-icon icon-pending">
        <span>⟳</span>
      </div>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="transactions-container">
        <div className="transactions-header">
          <h3>{title}</h3>
        </div>
        <div style={{ 
          padding: '3rem', 
          textAlign: 'center', 
          color: 'var(--text-muted)' 
        }}>
          <p>No transactions found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h3>{title}</h3>
        <span style={{ 
          fontSize: '0.875rem', 
          color: 'var(--text-muted)' 
        }}>
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Transaction</th>
              <th>Date</th>
              <th>Type</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td>
                  <div className="transaction-info">
                    {getTransactionIcon(txn.type, txn.isCredit)}
                    <div>
                      <div className="transaction-desc">
                        {txn.description || 'Transaction'}
                      </div>
                      <div className="transaction-id">
                        ID: {txn.id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td>{formatDate(txn.createdAt)}</td>
                <td>{txn.type}</td>
                <td style={{ textAlign: 'right' }}>
                  <span className={txn.isCredit ? 'amount-credit' : 'amount-debit'}>
                    {formatAmount(txn.amount, txn.isCredit)}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`status-badge ${getStatusClass(txn.status)}`}>
                    {txn.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
