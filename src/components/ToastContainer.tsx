import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { ToastMessage } from '../types/erp';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

// Notifikasi toast di pojok layar untuk feedback setiap aksi pengguna
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="no-print fixed right-4 bottom-20 left-4 z-50 flex flex-col gap-2 sm:top-auto sm:right-5 sm:bottom-5 sm:left-auto sm:w-96"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const styleMap = {
          success: {
            wrap: 'border-emerald-200 bg-white text-slate-900',
            icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
          },
          error: {
            wrap: 'border-red-200 bg-white text-slate-900',
            icon: <XCircle className="h-5 w-5 text-red-600 shrink-0" />,
          },
          warning: {
            wrap: 'border-amber-200 bg-white text-slate-900',
            icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
          },
          info: {
            wrap: 'border-slate-200 bg-white text-slate-900',
            icon: <Info className="h-5 w-5 text-orange-600 shrink-0" />,
          },
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ${styleMap.wrap}`}
            role="status"
          >
            <div className="mt-0.5">{styleMap.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
              {toast.description && (
                <p className="mt-0.5 text-xs text-slate-600">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Tutup notifikasi"
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
