import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { NotificationSeverity, ToastItem } from '../types';

const getSeverityTheme = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'ERROR':
      return {
        bg: 'bg-rose-50/95 border-rose-200 text-rose-900',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        icon: <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />,
        progress: 'bg-rose-500',
      };
    case 'WARNING':
      return {
        bg: 'bg-amber-50/95 border-amber-200 text-amber-900',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
        progress: 'bg-amber-500',
      };
    case 'SUCCESS':
      return {
        bg: 'bg-emerald-50/95 border-emerald-200 text-emerald-900',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
        progress: 'bg-emerald-500',
      };
    default:
      return {
        bg: 'bg-white/95 border-indigo-200 text-slate-800',
        badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        icon: <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />,
        progress: 'bg-indigo-600',
      };
  }
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const navigate = useNavigate();
  const theme = getSeverityTheme(toast.severity);

  const handleClickLink = () => {
    if (toast.link) {
      navigate(toast.link);
      onDismiss();
    }
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto w-84 md:w-96 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 relative overflow-hidden flex flex-col gap-2 ${theme.bg}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-xl bg-white/80 shadow-xs border border-white">
          {theme.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${theme.badge}`}
            >
              {toast.type.replace(/_/g, ' ')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {new Date(toast.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          <h4 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
            {toast.title}
          </h4>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>

          {toast.link && (
            <button
              onClick={handleClickLink}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              <span>Xem chi tiết tác vụ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-black/5 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress animation bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 overflow-hidden">
        <div
          className={`h-full ${theme.progress} opacity-75`}
          style={{
            animation: `shrinkWidth ${toast.duration || 6000}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
};

export const ToastNotificationContainer: React.FC = () => {
  const { toasts, removeToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-20 right-5 z-50 flex flex-col gap-3 pointer-events-none max-h-[calc(100vh-6rem)] overflow-y-auto no-scrollbar"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.toastId}
          toast={toast}
          onDismiss={() => removeToast(toast.toastId)}
        />
      ))}
    </div>
  );
};
