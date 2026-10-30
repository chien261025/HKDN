import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormProps {
  username: string;
  onUsernameChange: (username: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  isLoading: boolean;
  lockoutRemainingSec?: number;
  onSubmit: (e: React.FormEvent) => void;
  onOpenForgotModal: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  isLoading,
  lockoutRemainingSec = 0,
  onSubmit,
  onOpenForgotModal,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLocked = lockoutRemainingSec > 0;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5 text-xs sm:text-sm">
            Tên đăng nhập hoặc Email
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              autoFocus
              autoComplete="username"
              placeholder="Nhập tên đăng nhập hoặc email"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-700 font-semibold text-xs sm:text-sm">
              Mật khẩu
            </label>
            <button
              type="button"
              onClick={onOpenForgotModal}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              Quên mật khẩu?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all text-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              tabIndex={-1}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading || isLocked}
          className={`w-full py-2.5 px-4 font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all text-sm ${
            isLocked
              ? 'bg-amber-600 text-white cursor-not-allowed opacity-90 shadow-amber-100'
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white cursor-pointer shadow-indigo-100 disabled:opacity-50'
          }`}
        >
          {isLocked ? (
            <>
              <Lock className="w-4 h-4 text-amber-200" />
              <span>Tạm Khóa ({formatCountdown(lockoutRemainingSec)})</span>
            </>
          ) : isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
