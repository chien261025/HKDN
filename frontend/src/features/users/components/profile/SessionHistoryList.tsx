import React from 'react';
import { UserDeviceSession } from '../../types';
import { Laptop, Smartphone, Tablet, Monitor } from 'lucide-react';

interface SessionHistoryListProps {
  sessions: UserDeviceSession[];
}

export const SessionHistoryList: React.FC<SessionHistoryListProps> = ({ sessions }) => {
  const getDeviceIcon = (type?: string) => {
    const t = type?.toUpperCase();
    if (t === 'MOBILE') return <Smartphone className="w-4 h-4 text-indigo-600" />;
    if (t === 'TABLET') return <Tablet className="w-4 h-4 text-indigo-600" />;
    return t === 'DESKTOP' ? <Monitor className="w-4 h-4 text-indigo-600" /> : <Laptop className="w-4 h-4 text-indigo-600" />;
  };

  const formatReason = (r?: string) => {
    if (!r) return 'Đã kết thúc phiên';
    if (r.includes('KICKED')) return 'Hết phiên (Đăng nhập máy mới)';
    if (r.includes('REMOTE_LOGOUT')) return 'Đăng xuất từ xa qua cài đặt';
    if (r.includes('FORCE_LOGOUT')) return 'Quản trị viên ngắt phiên';
    return r.includes('LOGOUT_ALL') ? 'Đã đăng xuất đồng loạt' : 'Đã đăng xuất';
  };

  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
        Chưa có lịch sử phiên làm việc nào trước đây.
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
      {sessions.map((s) => (
        <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-slate-200 text-slate-600 shrink-0">{getDeviceIcon(s.deviceType)}</div>
            <div className="min-w-0">
              <p className="font-bold text-slate-800 truncate">{s.deviceName}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{s.ipAddress} • {s.locationName || 'Nội bộ'}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
              {formatReason(s.revokedReason)}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(s.lastActiveAt).toLocaleString('vi-VN')}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
