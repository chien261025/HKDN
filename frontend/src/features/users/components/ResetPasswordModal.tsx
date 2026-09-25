import React, { useState } from 'react';
import { X, KeyRound, Copy, Check, RefreshCw, ShieldAlert, Loader2 } from 'lucide-react';
import { UserAccount } from '../types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onConfirmReset: (userId: string, newPass: string) => Promise<void>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirmReset,
}) => {
  const [newPassword, setNewPassword] = useState('Wms@2026!Secure');
  const [copied, setCopied] = useState(false);
  const [forceChangeOnLogin, setForceChangeOnLogin] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleGenerateRandom = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 6) {
      setErrorMsg('Mật khẩu phải có độ dài tối thiểu 6 ký tự!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirmReset(user.id, newPassword.trim());
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi đặt lại mật khẩu!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50/70 border-b border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cấp Lại Mật Khẩu Bảo Mật</h3>
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
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <div className="font-bold text-slate-800">{user.fullName}</div>
            <div className="text-xs text-slate-500 font-mono">Email: {user.email}</div>
            <div className="text-xs text-indigo-700 font-semibold">{user.assignedWarehouse}</div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700">Mật Khẩu Mới Chỉ Định:</label>
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Tạo ngẫu nhiên an toàn</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setCopied(false);
                }}
                className="w-full px-3.5 py-2.5 pr-24 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono font-bold text-slate-900"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã copy' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Force Change on next login */}
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
            <input
              type="checkbox"
              checked={forceChangeOnLogin}
              onChange={(e) => setForceChangeOnLogin(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <div>
              <div className="text-xs font-bold text-slate-800">Yêu cầu đổi mật khẩu ở lần đăng nhập tới</div>
              <div className="text-2xs text-slate-500">Người dùng bắt buộc phải thiết lập mật khẩu cá nhân mới khi truy cập.</div>
            </div>
          </label>

          {/* Security Notice */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
            <ShieldAlert className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <span>
              Mật khẩu mới sẽ được băm mã hóa một chiều bằng <strong>BCrypt (độ phức tạp 10 rounds)</strong> trước khi lưu vào CSDL PostgreSQL. Hãy sao chép và gửi cho nhân sự.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-md shadow-amber-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              <span>Xác Nhận Đặt Lại</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
