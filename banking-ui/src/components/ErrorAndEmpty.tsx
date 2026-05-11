// ─── Error Card ───────────────────────────────────────────────────────────────

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export const ErrorCard = ({ message, onRetry }: ErrorCardProps) => (
  <div className="bg-white rounded-xl border border-red-100 p-6 flex flex-col items-center text-center"
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
    <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    </div>
    <p className="text-gray-800 font-semibold mb-1">Something went wrong</p>
    <p className="text-sm text-gray-500 mb-4">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Retry
      </button>
    )}
  </div>
);

// ─── Empty States ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon: 'transactions' | 'accounts';
}

const ICONS = {
  transactions: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  ),
  accounts: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  ),
};

export const EmptyState = ({ title, description, actionLabel, onAction, icon }: EmptyStateProps) => (
  <div className="bg-white rounded-xl p-10 flex flex-col items-center text-center"
    style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {ICONS[icon]}
      </svg>
    </div>
    <p className="text-gray-800 font-semibold text-lg mb-1">{title}</p>
    <p className="text-sm text-gray-500 mb-6 max-w-xs">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
