import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const config: Record<
  ToastType,
  { icon: ReactNode; ring: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    ring: 'ring-emerald-100',
    iconColor: 'text-emerald-600',
  },
  error: {
    icon: <XCircle className="h-5 w-5" />,
    ring: 'ring-red-100',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    ring: 'ring-amber-100',
    iconColor: 'text-amber-600',
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    ring: 'ring-sky-100',
    iconColor: 'text-sky-600',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error'),
    warning: (m) => toast(m, 'warning'),
    info: (m) => toast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-elevated ring-1 animate-slide-in',
              config[t.type].ring
            )}
          >
            <span className={cn('mt-0.5 shrink-0', config[t.type].iconColor)}>
              {config[t.type].icon}
            </span>
            <p className="flex-1 text-sm font-medium text-slate-700">
              {t.message}
            </p>
            <button
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
              className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
