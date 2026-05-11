import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  autoDismiss: boolean;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, autoDismiss?: boolean) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Single Toast Item ────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { bar: string; icon: string; text: string; bg: string }> = {
  success: {
    bg: 'bg-white border-l-4 border-green-500',
    bar: 'bg-green-500',
    icon: 'text-green-500',
    text: 'text-gray-800',
  },
  error: {
    bg: 'bg-white border-l-4 border-red-500',
    bar: 'bg-red-500',
    icon: 'text-red-500',
    text: 'text-gray-800',
  },
  info: {
    bg: 'bg-white border-l-4 border-blue-500',
    bar: 'bg-blue-500',
    icon: 'text-blue-500',
    text: 'text-gray-800',
  },
};

const ICONS: Record<ToastType, JSX.Element> = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
    </svg>
  ),
};

const ToastItem = ({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) => {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Slide in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Auto-dismiss with progress bar
  useEffect(() => {
    if (!toast.autoDismiss) return;

    const DURATION = 3000;
    const TICK = 50;
    let elapsed = 0;

    intervalRef.current = setInterval(() => {
      elapsed += TICK;
      setProgress(100 - (elapsed / DURATION) * 100);
      if (elapsed >= DURATION) {
        clearInterval(intervalRef.current!);
        setVisible(false);
        setTimeout(() => onRemove(toast.id), 300);
      }
    }, TICK);

    return () => clearInterval(intervalRef.current!);
  }, [toast.autoDismiss, toast.id, onRemove]);

  const handleClose = () => {
    clearInterval(intervalRef.current!);
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const s = STYLES[toast.type];

  return (
    <div
      style={{
        transition: 'all 0.3s ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        borderRadius: '10px',
        overflow: 'hidden',
        minWidth: '300px',
        maxWidth: '380px',
      }}
      className={`${s.bg} relative`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className={`mt-0.5 flex-shrink-0 ${s.icon}`}>{ICONS[toast.type]}</span>
        <p className={`flex-1 text-sm font-medium ${s.text}`}>{toast.message}</p>
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {/* Progress bar for auto-dismiss */}
      {toast.autoDismiss && (
        <div className="h-0.5 bg-gray-100">
          <div
            className={`h-full ${s.bar} transition-all`}
            style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
          />
        </div>
      )}
    </div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', autoDismiss = true) => {
      const id = `${Date.now()}-${Math.random()}`;
      // Errors stay until dismissed
      const shouldAutoDismiss = type === 'error' ? false : autoDismiss;
      setToasts((prev) => [...prev, { id, type, message, autoDismiss: shouldAutoDismiss }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999 }}
        className="flex flex-col gap-3"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx.showToast;
};
