import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { UserAccount } from '../types';
import { getRoleBadge } from '../utils/userBadges';

interface LockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onConfirmToggle: (userId: string, reason: string, forceLogout: boolean) => Promise<void>;
}

export const LockUserModal: React.FC<LockUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirmToggle,
}) => {
  const [reason, setReason] = useState('Nghi ngờ vi phạm an toàn thông tin');
  const [customReason, setCustomReason] = useState('');
  const [forceLogout, setForceLogout] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('Nghi ngờ vi phạm an toàn thông tin');
      setCustomReason('');
      setForceLogout(true);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const isLocking = user.status === 'ACTIVE';
  const isRootAdmin = user.username.toLowerCase() === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRootAdmin && isLocking) {
      setErrorMsg('Không thể khóa tài khoản Quản trị viên tối cao (root admin)!');
      return;
    }

    if (isLocking && reason === 'Khác' && !customReason.trim()) {
      setErrorMsg('Vui lòng nhập chi tiết lý do khóa tài khoản!');
      return;
    }

    const finalReason = isLocking
      ? reason === 'Khác'
        ? customReason.trim()
        : reason
      : 'Kích hoạt lại tài khoản';

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmToggle(user.id, finalReason, forceLogout);
      onClose();
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message || 'Lỗi khi cập nhật trạng thái tài khoản!';
      setErrorMsg(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isLocking ? 'bg-rose-50/70 border-rose-100' : 'bg-emerald-50/70 border-emerald-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                isLocking ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isLocking ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isLocking ? 'Xác Nhận Khóa Tài Khoản' : 'Xác Nhận Mở Khóa Tài Khoản'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">Tài khoản: @{user.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{user.fullName}</span>
              {getRoleBadge(user.role)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Email: {user.email}</div>
            <div className="text-xs text-slate-600 mt-0.5 font-medium">{user.assignedWarehouse}</div>
          </div>

          {isLocking ? (
            <>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 text-xs">
                  Lý do khóa tài khoản: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value !== 'Khác') {
                      setErrorMsg(null);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-medium cursor-pointer text-slate-800 text-xs"
                >
                  <option value="Nghi ngờ vi phạm an toàn thông tin">Nghi ngờ vi phạm an toàn thông tin</option>
                  <option value="Tạm nghỉ việc / Luân chuyển công tác">Tạm nghỉ việc / Luân chuyển công tác</option>
                  <option value="Chấm dứt hợp đồng lao động">Chấm dứt hợp đồng lao động</option>
                  <option value="Khác">Lý do khác (Nhập chi tiết)</option>
                </select>
              </div>

              {/* Ô nhập lý do cụ thể khi chọn "Lý do khác" */}
              {reason === 'Khác' && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="font-semibold text-slate-700 text-xs flex items-center justify-between">
                    <span>Chi tiết lý do khóa: <span className="text-rose-500">*</span></span>
                    <span className="text-2xs text-slate-400 font-normal">Bắt buộc</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Vui lòng nhập lý do cụ thể (VD: Nhân viên nghỉ thai sản, luân chuyển sang phòng ban khác, vi phạm quy định bàn giao ca...)"
                    value={customReason}
                    onChange={(e) => {
                      setCustomReason(e.target.value);
                      if (e.target.value.trim()) setErrorMsg(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-xs text-slate-800 placeholder-slate-400 font-normal"
                    autoFocus
                  />
                  <span className="text-[11px] text-slate-400 block">
                    Lý do này sẽ được ghi vào nhật ký kiểm toán an ninh để tra cứu đối soát sau này
                  </span>
                </div>
              )}

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={forceLogout}
                  onChange={(e) => setForceLogout(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-800">
                  Đăng xuất và thu hồi phiên làm việc trên tất cả thiết bị
                </span>
              </label>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Tài khoản sau khi bị khóa sẽ không thể đăng nhập vào ứng dụng và thiết bị PDA cho đến khi được mở khóa.
                </span>
              </div>
            </>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                Tài khoản sẽ được mở khóa và có thể đăng nhập bình thường vào hệ thống.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || (isRootAdmin && isLocking)}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                isLocking
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLocking ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span>{isLocking ? 'Khóa Tài Khoản Ngay' : 'Kích Hoạt Tài Khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
