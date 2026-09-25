import React, { useEffect, useState } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  MapPin,
  Clock,
  LogOut,
  Loader2,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { userService } from '../../services/userService';
import { UserDeviceSession } from '../../types';

interface ActiveSessionsTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ActiveSessionsTab: React.FC<ActiveSessionsTabProps> = ({
  onSuccess,
  onError,
}) => {
  const [sessions, setSessions] = useState<UserDeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await userService.getMySessions();
      setSessions(data);
    } catch (err: any) {
      onError(err.message || 'Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeSingle = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await userService.revokeMySession(sessionId);
      onSuccess('Đã đăng xuất thiết bị thành công!');
      await loadSessions();
    } catch (err: any) {
      onError(err.message || 'Không thể đăng xuất thiết bị');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOthers = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác không?')) {
      return;
    }
    setRevokingOthers(true);
    try {
      await userService.revokeMyOtherSessions();
      onSuccess('Đã đăng xuất khỏi tất cả các thiết bị khác thành công!');
      await loadSessions();
    } catch (err: any) {
      onError(err.message || 'Không thể đăng xuất các thiết bị khác');
    } finally {
      setRevokingOthers(false);
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toUpperCase()) {
      case 'MOBILE':
        return <Smartphone className="w-5 h-5 text-indigo-600" />;
      case 'TABLET':
        return <Tablet className="w-5 h-5 text-indigo-600" />;
      case 'DESKTOP':
        return <Monitor className="w-5 h-5 text-indigo-600" />;
      default:
        return <Laptop className="w-5 h-5 text-indigo-600" />;
    }
  };

  const otherActiveSessions = sessions.filter((s) => !s.isCurrentSession && s.isActive);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
        <span className="text-xs font-medium">Đang tải danh sách thiết bị...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 text-sm">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Thiết Bị Đang Đăng Nhập
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các thiết bị hiện đang duy trì phiên hoạt động trên tài khoản.
          </p>
        </div>

        {otherActiveSessions.length > 0 && (
          <button
            onClick={handleRevokeOthers}
            disabled={revokingOthers}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {revokingOthers ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}
            <span>Đăng xuất thiết bị khác</span>
          </button>
        )}
      </div>

      {/* Session list */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
            <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-medium">Chưa có thông tin phiên làm việc.</p>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className={`p-4 rounded-xl border transition-all ${
                s.isCurrentSession
                  ? 'bg-indigo-50/40 border-indigo-200 shadow-sm'
                  : s.isActive
                  ? 'bg-white border-slate-200 hover:border-slate-300'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 shrink-0 mt-0.5">
                    {getDeviceIcon(s.deviceType)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {s.deviceName || 'Thiết bị không xác định'}
                      </span>
                      {s.isCurrentSession && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Thiết bị này
                        </span>
                      )}
                      {s.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Đã đăng xuất
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {s.locationName || 'Nội bộ (LAN)'} ({s.ipAddress})
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(s.lastActiveAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>

                {!s.isCurrentSession && s.isActive && (
                  <button
                    onClick={() => handleRevokeSingle(s.id)}
                    disabled={revokingId === s.id}
                    className="shrink-0 p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50 cursor-pointer"
                    title="Đăng xuất thiết bị này"
                  >
                    {revokingId === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
