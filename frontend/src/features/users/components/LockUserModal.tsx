import React, { useState } from 'react';
import { X, Lock, Unlock, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { UserAccount } from '../types';

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
  const [reason, setReason] = useState('Nghi ngờ vi phạm quy chế an toàn dữ liệu kho');
  const [forceLogout, setForceLogout] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isLocking = user.status === 'ACTIVE';
  const isRootAdmin = user.username.toLowerCase() === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRootAdmin && isLocking) {
      setErrorMsg('Không thể khóa tài khoản Quản trị viên tối cao (root admin)!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmToggle(user.id, reason, forceLogout);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật trạng thái tài khoản!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isLocking ? 'bg-rose-50/70 border-rose-100' : 'bg-emerald-50/70 border-emerald-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
              isLocking ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isLocking ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isLocking ? 'Xác Nhận Khóa Tài Khoản' : 'Xác Nhận Mở Khóa Tài Khoản'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">Tài khoản: @{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="font-bold text-slate-900">{user.fullName}</div>
            <div className="text-xs text-slate-500 font-mono mt-0.5">Email: {user.email} • Vai trò: {user.role}</div>
            <div className="text-xs text-slate-600 mt-1 font-medium">{user.assignedWarehouse}</div>
          </div>

          {isLocking ? (
            <>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Lý Do Khóa Tài Khoản:</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 font-medium cursor-pointer"
                >
                  <option value="Nghi ngờ vi phạm quy chế an toàn dữ liệu kho">Nghi ngờ vi phạm quy chế an toàn dữ liệu kho</option>
                  <option value="Nhân viên tạm nghỉ phép dài hạn / luân chuyển">Nhân viên tạm nghỉ phép dài hạn / luân chuyển</option>
                  <option value="Chấm dứt hợp đồng lao động">Chấm dứt hợp đồng lao động</option>
                  <option value="Yêu cầu kiểm toán nội bộ khẩn cấp">Yêu cầu kiểm toán nội bộ khẩn cấp</option>
                </select>
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={forceLogout}
                  onChange={(e) => setForceLogout(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Cưỡng chế hủy toàn bộ Token phiên đăng nhập hiện hành (Force Logout)
                </span>
              </label>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <span>
                  Sau khi khóa, người dùng sẽ bị từ chối mọi yêu cầu API với mã <strong>HTTP 403 Forbidden</strong> và không thể đăng nhập lại.
                </span>
              </div>
            </>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Mở khóa tài khoản sẽ cho phép nhân sự đăng nhập và vận hành kho bình thường với đúng quyền hạn của vai trò hiện tại.
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || (isRootAdmin && isLocking)}
              className={`px-5 py-2.5 rounded-xl text-white font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                isLocking
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isLocking ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>{isLocking ? 'Khóa Tài Khoản Ngay' : 'Kích Hoạt Tài Khoản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
