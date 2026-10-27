import React from 'react';
import {
  ExternalLink,
  Check,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { NotificationMessage, NotificationSeverity } from '../types';

interface NotificationItemProps {
  notification: NotificationMessage;
  onClick: (notification: NotificationMessage) => void;
  onMarkAsRead: (id: string) => void;
}

const formatTimeAgo = (isoString: string): string => {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 30) return 'Vừa xong';
    if (diff < 60) return `${diff} giây trước`;
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  } catch {
    return 'Gần đây';
  }
};

const getSeverityIcon = (severity: NotificationSeverity) => {
  switch (severity) {
    case 'ERROR':
      return <AlertOctagon className="w-4 h-4 text-rose-600" />;
    case 'WARNING':
      return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    case 'SUCCESS':
      return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    default:
      return <Info className="w-4 h-4 text-indigo-600" />;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onMarkAsRead,
}) => {
  return (
    <div
      onClick={() => onClick(notification)}
      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
        notification.read ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
      }`}
    >
      <div className="mt-0.5 p-1.5 rounded-xl bg-white shadow-xs border border-slate-200/80 shrink-0">
        {getSeverityIcon(notification.severity)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4
            className={`text-xs font-bold leading-tight truncate ${
              notification.read ? 'text-slate-700' : 'text-slate-900 font-extrabold'
            }`}
          >
            {notification.title}
          </h4>
          <span className="text-[10px] text-slate-400 shrink-0 font-medium">
            {formatTimeAgo(notification.timestamp)}
          </span>
        </div>

        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {notification.message}
        </p>

        <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
          {notification.link ? (
            <span className="inline-flex items-center gap-1 text-indigo-600 font-semibold group-hover:underline">
              <span>Chi tiết</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          ) : <span />}

          {!notification.read && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className="text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Check className="w-3 h-3" />
              <span>Đã đọc</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
