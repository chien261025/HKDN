import React, { useEffect, useState } from 'react';
import {
  Laptop, Smartphone, Tablet, Monitor, MapPin, Clock,
  LogOut, Loader2, CheckCircle2, ShieldCheck, RefreshCw, AlertTriangle, History
} from 'lucide-react';
import { userService } from '../../services/userService';
import { UserDeviceSession } from '../../types';

interface ActiveSessionsTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ActiveSessionsTab: React.FC<ActiveSessionsTabProps> = ({ onSuccess, onError }) => {
  const [sessions, setSessions] = useState<UserDeviceSession[]>([]);
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showConfirmOthers, setShowConfirmOthers] = useState(false);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const loadSessions = async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const data = await userService.getMySessions();
      setSessions(data);
    } catch (err: any) {
      onError(err.message || 'Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const handleRevokeSingle = async (sessionId: string) => {
    setRevokingId(sessionId);
    try {
      await userService.revokeMySession(sessionId);
      onSuccess('Đã đăng xuất thiết bị thành công!');
      await loadSessions(true);
    } catch (err: any) {
      onError(err.message || 'Không thể đăng xuất thiết bị');
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOthers = async () => {
    setRevokingOthers(true);
    try {
      await userService.revokeMyOtherSessions();
      setShowConfirmOthers(false);
      onSuccess('Đã đăng xuất khỏi tất cả các thiết bị khác!');
      await loadSessions(true);
    } catch (err: any) {
      onError(err.message || 'Không thể đăng xuất các thiết bị khác');
    } finally {
      setRevokingOthers(false);
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    const t = deviceType?.toUpperCase();
    if (t === 'MOBILE') return <Smartphone className="w-4 h-4 text-indigo-600" />;
    if (t === 'TABLET') return <Tablet className="w-4 h-4 text-indigo-600" />;
    if (t === 'DESKTOP') return <Monitor className="w-4 h-4 text-indigo-600" />;
    return <Laptop className="w-4 h-4 text-indigo-600" />;
  };

  const formatReason = (reason?: string) => {
    if (!reason) return 'Đã kết thúc phiên';
    if (reason.includes('KICKED')) return 'Hết phiên (Đăng nhập máy mới)';
    if (reason.includes('LOGOUT_ALL')) return 'Đã đăng xuất đồng loạt';
    if (reason.includes('REMOTE_LOGOUT')) return 'Đăng xuất từ xa qua cài đặt';
    if (reason.includes('FORCE_LOGOUT')) return 'Quản trị viên ngắt phiên';
    return 'Đã đăng xuất';
  };

  const activeSessions = sessions.filter((s) => s.isActive);
  const inactiveSessions = sessions.filter((s) => !s.isActive);
  const currentSession = activeSessions.find((s) => s.isCurrentSession);
  const otherActiveSessions = activeSessions.filter((s) => !s.isCurrentSession);

  if (loading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-600" />
        <span className="text-xs font-semibold">Đang kiểm tra các phiên đăng nhập...</span>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4 text-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            Thiết Bị & Phiên Đăng Nhập
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý các thiết bị đang có quyền truy cập vào tài khoản của bạn.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadSessions(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {otherActiveSessions.length > 0 && !showConfirmOthers && (
            <button
              onClick={() => setShowConfirmOthers(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất thiết bị khác ({otherActiveSessions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Box */}
      {showConfirmOthers && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-rose-800 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Xác nhận đăng xuất khỏi tất cả các thiết bị khác?</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRevokeOthers}
              disabled={revokingOthers}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {revokingOthers && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Đồng ý</span>
            </button>
            <button
              onClick={() => setShowConfirmOthers(false)}
              disabled={revokingOthers}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold w-fit">
        <button
          onClick={() => setViewMode('ACTIVE')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'ACTIVE' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Đang hoạt động ({activeSessions.length})</span>
        </button>
        <button
          onClick={() => setViewMode('HISTORY')}
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            viewMode === 'HISTORY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Lịch sử phiên ({inactiveSessions.length})</span>
        </button>
      </div>

      {/* Active Tab View */}
      {viewMode === 'ACTIVE' ? (
        <div className="space-y-3">
          {currentSession && (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800 shrink-0">
                  {getDeviceIcon(currentSession.deviceType)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900 text-sm">{currentSession.deviceName}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
                      </span>
                      Thiết bị này
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {currentSession.locationName || 'Nội bộ (LAN)'} ({currentSession.ipAddress})
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" /> Đang sử dụng
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {otherActiveSessions.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center gap-3 text-slate-600">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-xs">Không có thiết bị lạ nào khác đang đăng nhập. Tài khoản an toàn.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-600 px-1">Thiết bị khác đang trực tuyến</div>
              {otherActiveSessions.map((s) => (
                <div key={s.id} className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-700 shrink-0">{getDeviceIcon(s.deviceType)}</div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{s.deviceName}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="w-3 h-3 text-slate-400" /> {s.locationName || 'Mạng LAN'} ({s.ipAddress})
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {new Date(s.lastActiveAt).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeSingle(s.id)}
                    disabled={revokingId === s.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {revokingId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    <span>Đăng xuất</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* History View */
        <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
          {inactiveSessions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              Chưa có lịch sử phiên làm việc nào trước đây.
            </div>
          ) : (
            inactiveSessions.map((s) => (
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
            ))
          )}
        </div>
      )}

      {/* Security Rule Note */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Tài khoản được giới hạn tối đa 2 thiết bị đồng thời để đảm bảo an ninh.</span>
        <span className="font-mono text-emerald-600 font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> BẢO VỆ PHIÊN
        </span>
      </div>
    </div>
  );
};
