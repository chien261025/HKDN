import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Laptop,
  Smartphone,
  Building2,
  Save,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Clock,
} from 'lucide-react';
import { userService } from '../services/userService';
import { UserAccount, UserDeviceSession } from '../types';

interface TrustedWarehouseRow {
  id: number;
  code: string;
  name: string;
  trustedIps?: string;
  isActive?: boolean;
}

interface PdaDeviceManagerTabProps {
  users?: UserAccount[];
}

export const PdaDeviceManagerTab: React.FC<PdaDeviceManagerTabProps> = ({ users = [] }) => {
  const [networks, setNetworks] = useState<TrustedWarehouseRow[]>([]);
  const [ipDrafts, setIpDrafts] = useState<Record<number, string>>({});
  const [savingWhId, setSavingWhId] = useState<number | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string>(() => (users[0]?.id ? String(users[0].id) : ''));
  const [sessions, setSessions] = useState<UserDeviceSession[]>([]);
  const [loadingNetworks, setLoadingNetworks] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadNetworks = async () => {
    setLoadingNetworks(true);
    try {
      const data = await userService.getTrustedNetworks();
      setNetworks(data);
      const drafts: Record<number, string> = {};
      data.forEach((w) => {
        drafts[w.id] = w.trustedIps || '';
      });
      setIpDrafts(drafts);
    } catch (err: any) {
      setFeedback({ type: 'error', msg: err?.message || 'Không thể tải cấu hình mạng tin cậy từ máy chủ.' });
    } finally {
      setLoadingNetworks(false);
    }
  };

  const loadUserSessions = async (userId: string) => {
    if (!userId) {
      setSessions([]);
      return;
    }
    setLoadingSessions(true);
    try {
      const data = await userService.getUserSessions(userId);
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    void loadNetworks();
  }, []);

  useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(String(users[0].id));
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      void loadUserSessions(selectedUserId);
    }
  }, [selectedUserId]);

  const showNotice = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleSaveIp = async (warehouseId: number, warehouseName: string) => {
    setSavingWhId(warehouseId);
    try {
      const msg = await userService.updateTrustedNetwork(warehouseId, (ipDrafts[warehouseId] || '').trim());
      showNotice('success', `${msg} (${warehouseName})`);
      await loadNetworks();
    } catch (err: any) {
      showNotice('error', err?.response?.data?.message || err?.message || 'Lỗi cập nhật dải IP tin cậy.');
    } finally {
      setSavingWhId(null);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!selectedUserId) return;
    setRevokingId(sessionId);
    try {
      await userService.revokeDeviceSession(selectedUserId, sessionId);
      showNotice('success', 'Đã thu hồi phiên thiết bị từ xa thành công.');
      await loadUserSessions(selectedUserId);
    } catch (err: any) {
      showNotice('error', err?.message || 'Không thể thu hồi phiên làm việc.');
    } finally {
      setRevokingId(null);
    }
  };

  const activeSessions = sessions.filter((s) => s.isActive);

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* 1. Cấu hình dải IP mạng nội bộ kho (MySQL /users/trusted-networks) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Mạng Nội Bộ Tin Cậy Theo Chi Nhánh Kho</h3>
              <p className="text-xs text-slate-500">
                Khai báo dải IP LAN/VPN của các trạm máy tính và máy quét tại từng chi nhánh kho
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void loadNetworks()}
            disabled={loadingNetworks}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingNetworks ? 'animate-spin' : ''}`} />
            <span>Tải lại</span>
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {networks.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              {loadingNetworks ? 'Đang tải cấu hình mạng kho...' : 'Chưa có chi nhánh kho nào trong cơ sở dữ liệu.'}
            </div>
          ) : (
            networks.map((wh) => (
              <div key={wh.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                      {wh.code}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">{wh.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nhập dải IP cách nhau bởi dấu phẩy (VD: 192.168.1.0/24, 10.0.0.10)
                  </p>
                </div>

                <div className="flex items-center gap-2 sm:min-w-[340px]">
                  <input
                    type="text"
                    value={ipDrafts[wh.id] ?? ''}
                    onChange={(e) => setIpDrafts((prev) => ({ ...prev, [wh.id]: e.target.value }))}
                    placeholder="VD: 192.168.1.0/24"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:border-blue-600 outline-none"
                  />
                  <button
                    type="button"
                    disabled={savingWhId === wh.id}
                    onClick={() => void handleSaveIp(wh.id, wh.name)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingWhId === wh.id ? 'Đang lưu...' : 'Lưu IP'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Giám sát phiên thiết bị thực tế theo tài khoản */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Phiên Thiết Bị Đang Đăng Nhập</h3>
              <p className="text-xs text-slate-500">
                Kiểm tra thiết bị đang giữ JWT hợp lệ và thu hồi từ xa khi cần thiết
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-blue-600"
            >
              {users.length === 0 ? (
                <option value="">Đang tải nhân sự...</option>
              ) : (
                users.map((u) => (
                  <option key={u.id} value={u.id}>
                    @{u.username} — {u.fullName}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={() => void loadUserSessions(selectedUserId)}
              disabled={loadingSessions || !selectedUserId}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              title="Làm mới danh sách phiên"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSessions ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-2.5">
          {loadingSessions ? (
            <div className="py-8 text-center text-xs text-slate-500">Đang tải danh sách phiên đăng nhập...</div>
          ) : activeSessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Tài khoản này hiện không có phiên thiết bị nào đang hoạt động.
            </div>
          ) : (
            activeSessions.map((sess) => (
              <div
                key={sess.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 shrink-0">
                    {sess.deviceType === 'MOBILE_PDA' ? (
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Laptop className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{sess.deviceName || 'Trình duyệt Web'}</span>
                      {sess.isCurrentSession && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Phiên hiện tại
                        </span>
                      )}
                      {sess.isWarehouseNetwork && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          Mạng nội bộ kho
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>IP: {sess.ipAddress}</span>
                      {sess.locationName && <span>• {sess.locationName}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sess.lastActiveAt ? new Date(sess.lastActiveAt).toLocaleString('vi-VN') : 'Đang hoạt động'}
                      </span>
                    </div>
                  </div>
                </div>

                {!sess.isCurrentSession && (
                  <button
                    type="button"
                    disabled={revokingId === sess.id}
                    onClick={() => void handleRevokeSession(sess.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{revokingId === sess.id ? 'Đang thu hồi...' : 'Đăng xuất từ xa'}</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
