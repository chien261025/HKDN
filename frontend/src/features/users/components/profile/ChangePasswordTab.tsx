import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { userService } from '../../services/userService';

interface ChangePasswordTabProps {
  username: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const ChangePasswordTab: React.FC<ChangePasswordTabProps> = ({
  username,
  onSuccess,
  onError,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');

    if (!currentPassword.trim()) {
      onError('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (newPassword.length < 6) {
      onError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (newPassword === currentPassword) {
      onError('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }

    if (newPassword !== confirmPassword) {
      onError('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = await userService.changePassword({
        username,
        currentPassword,
        newPassword,
      });

      onSuccess(msg || 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      onError(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
      {/* Mật khẩu hiện tại */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">
          Mật Khẩu Hiện Tại <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            required
            placeholder="Nhập mật khẩu hiện tại"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            tabIndex={-1}
          >
            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mật khẩu mới */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">
          Mật Khẩu Mới (≥ 6 ký tự) <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type={showNewPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="Nhập mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            tabIndex={-1}
          >
            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Xác nhận mật khẩu mới */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1">
          Xác Nhận Mật Khẩu Mới <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="Nhập lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50 cursor-pointer text-sm flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang lưu mật khẩu...</span>
            </>
          ) : (
            <span>Xác Nhận Đổi Mật Khẩu</span>
          )}
        </button>
      </div>
    </form>
  );
};
