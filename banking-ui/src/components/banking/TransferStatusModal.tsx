import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTransferStatusApi } from '../../api/transfers';
import { formatPKR } from '../../utils/formatters';
import { AccessibleModal } from '../ui/AccessibleModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
}

const statusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'pending':   return 'bg-yellow-100 text-yellow-800';
    case 'failed':    return 'bg-red-100 text-red-800';
    default:          return 'bg-gray-100 text-gray-800';
  }
};

export const TransferStatusModal: React.FC<Props> = ({ isOpen, onClose, transactionId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['transfer', transactionId],
    queryFn: () => getTransferStatusApi(transactionId),
    enabled: isOpen && !!transactionId,
    staleTime: 30_000,
  });

  return (
    <AccessibleModal isOpen={isOpen} onClose={onClose} title="Transfer Details" size="sm">
      {isLoading && (
        <div className="py-8 text-center text-gray-500">Loading transfer details...</div>
      )}
      {error && (
        <div className="py-8 text-center text-red-600">Failed to load transfer details.</div>
      )}
      {data && (
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Transaction ID</dt>
            <dd className="text-sm font-mono text-gray-900 truncate max-w-[180px]">{data.transactionId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Type</dt>
            <dd className="text-sm text-gray-900 capitalize">{data.type}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Amount</dt>
            <dd className="text-sm font-semibold text-gray-900">{formatPKR(data.amount)}</dd>
          </div>
          <div className="flex justify-between items-center">
            <dt className="text-sm text-gray-500">Status</dt>
            <dd>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor(data.status)}`}>
                {data.status}
              </span>
            </dd>
          </div>
          {data.description && (
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Description</dt>
              <dd className="text-sm text-gray-900">{data.description}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-sm text-gray-500">Date</dt>
            <dd className="text-sm text-gray-900">{new Date(data.createdAt).toLocaleString()}</dd>
          </div>
        </dl>
      )}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Close
        </button>
      </div>
    </AccessibleModal>
  );
};
