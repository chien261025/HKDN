import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface StepNewPasswordProps {
  newPassword: string;
  onNewPasswordChange: (val: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const StepNewPassword: React.FC<StepNewPasswordProps> = ({
  newPassword,
  onNewPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  isSubmitting,
  onSubmit,
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
        <span className="font-semibold">Xác thực OTP thành công! Vui lòng nhập mật khẩu mới:</span>
      </div>

      {/* Mật khẩu mới */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1 text-xs sm:text-sm">
          Mật Khẩu Mới (≥ 6 ký tự) <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showNewPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="Nhập mật khẩu mới an toàn"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
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
        <label className="block text-slate-700 font-semibold mb-1 text-xs sm:text-sm">
          Xác Nhận Mật Khẩu Mới <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            required
            minLength={6}
            placeholder="Gõ lại mật khẩu mới"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
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

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
          ) : (
            <span>Cập Nhật Mật Khẩu Mới</span>
          )}
        </button>
      </div>
    </form>
  );
};
