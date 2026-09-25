import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Laptop, Smartphone, MapPin, LogOut, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { UserAccount, UserSecurityLog, UserDeviceSession } from '../types';
import { userService } from '../services/userService';

interface UserSecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onForceLogout: (userId: string) => Promise<void>;
}

export const UserSecurityAuditModal: React.FC<UserSecurityAuditModalProps> = ({
  isOpen,
  onClose,
  user,
  onForceLogout,
}) => {
  const [securityLog, setSecurityLog] = useState<UserSecurityLog | null>(null);
  const [sessions, setSessions] = useState<UserDeviceSession[]>([]);
  const [tab, setTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    Promise.all([
      userService.getUserSecurityLog(user.id),
      userService.getUserSessions(user.id),
    ])
      .then(([logData, sessionData]) => {
        setSecurityLog(logData);
        setSessions(sessionData);
      })
      .catch((err) => {
        console.warn('Lỗi tải dữ liệu an ninh:', err);
        setErrorMsg('Không thể kết nối máy chủ để lấy dữ liệu.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && user) loadData();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleRevokeSingle = async (sessionId: string) => {
    setActionLoading(true);
    try {
      await userService.revokeDeviceSession(user.id, sessionId);
      setSuccessMsg('Đã đăng xuất thiết bị thành công!');
      loadData();
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi khi đăng xuất thiết bị');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeOthers = async () => {
    setActionLoading(true);
    try {
      await userService.revokeOtherDeviceSessions(user.id);
      setSuccessMsg('Đã đăng xuất khỏi tất cả các thiết bị khác!');
      loadData();
    } catch (e: any) {
      setErrorMsg(e.message || 'Lỗi khi đăng xuất các thiết bị');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerForceLogout = async () => {
    setActionLoading(true);
    try {
      await onForceLogout(user.id);
      setSuccessMsg(`Đã đăng xuất toàn bộ thiết bị của @${user.username}!`);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi hủy phiên đăng nhập!');
    } finally {
      setActionLoading(false);
    }
  };

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);
  const displayedSessions = tab === 'ACTIVE' ? activeSessions : inactiveSessions;

  const formatReason = (reason?: string) => {
    if (!reason) return 'Đã kết thúc';
    if (reason.includes('KICKED')) return 'Hết phiên (Đăng nhập máy mới)';
    if (reason.includes('LOGOUT_ALL')) return 'Đã đăng xuất hàng loạt';
    if (reason.includes('FORCE_LOGOUT')) return 'Quản trị viên ngắt phiên';
    return 'Đã đăng xuất';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Quản Lý Thiết Bị & Phiên Đăng Nhập</h3>
              <p className="text-xs text-slate-500 font-mono">Tài khoản: @{user.username} • {user.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm max-h-[75vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Row & Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setTab('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'ACTIVE'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Đang Hoạt Động ({activeSessions.length})
              </button>
              <button
                onClick={() => setTab('HISTORY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tab === 'HISTORY'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Lịch Sử Phiên ({inactiveSessions.length})
              </button>
            </div>

            <div className="flex items-center gap-3">
              {activeSessions.length > 1 && (
                <button
                  onClick={handleRevokeOthers}
                  disabled={actionLoading}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                >
                  Đăng xuất thiết bị khác
                </button>
              )}
              <button
                onClick={handleTriggerForceLogout}
                disabled={actionLoading}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất tất cả</span>
              </button>
            </div>
          </div>

          {/* Devices List */}
          <div className="space-y-2">
            {loading ? (
              <div className="p-6 text-center text-slate-400 text-xs flex justify-center items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> Đang tải dữ liệu...
              </div>
            ) : displayedSessions.length === 0 ? (
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-500">
                {tab === 'ACTIVE'
                  ? 'Hiện không có thiết bị nào đang kết nối.'
                  : 'Không có phiên nào trong lịch sử.'}
              </div>
            ) : (
              <div className="space-y-2">
                {displayedSessions.map((s) => (
                  <div
                    key={s.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      s.isActive
                        ? 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                        : 'bg-slate-50/70 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          s.deviceType === 'MOBILE_PDA'
                            ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {s.deviceType === 'MOBILE_PDA' ? (
                          <Smartphone className="w-5 h-5" />
                        ) : (
                          <Laptop className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                          <span>{s.deviceName}</span>
                          {s.isCurrentSession && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-2xs font-extrabold border border-emerald-200">
                              Thiết bị này
                            </span>
                          )}
                          {!s.isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-2xs font-medium">
                              {formatReason(s.revokedReason)}
                            </span>
                          )}
                        </div>
                        <div className="text-2xs text-slate-500 flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-1 font-sans">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{s.locationName}</span>
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono">IP: {s.ipAddress}</span>
                        </div>
                      </div>
                    </div>

                    {s.isActive && (
                      <button
                        onClick={() => handleRevokeSingle(s.id)}
                        disabled={actionLoading}
                        title="Đăng xuất thiết bị này"
                        className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
