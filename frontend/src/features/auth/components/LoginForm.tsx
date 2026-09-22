import React, { useState } from 'react';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Shield,
  Briefcase,
  Smartphone
} from 'lucide-react';

interface LoginFormProps {
  username: string;
  onUsernameChange: (username: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  rememberMe: boolean;
  onRememberMeChange: (remember: boolean) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onOpenForgotModal: () => void;
  onPrefillDemo: (username: string, roleTitle: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  username,
  onUsernameChange,
  password,
  onPasswordChange,
  rememberMe,
  onRememberMeChange,
  isLoading,
  onSubmit,
  onOpenForgotModal,
  onPrefillDemo,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4 text-sm">
        <div>
          <label className="block text-slate-800 font-semibold mb-1.5">
            Tên đăng nhập
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              autoFocus
              placeholder="admin, manager01, operator01..."
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-sm"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-slate-800 font-semibold">Mật khẩu</label>
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors text-sm font-medium">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => onRememberMeChange(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <span className="text-xs text-slate-500 font-mono">Demo: 123456</span>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer text-sm"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </>
          )}
        </button>
      </form>

      {/* Tài Khoản Mẫu (Dành cho Hội đồng / Demo) */}
      <div className="pt-4 border-t border-slate-200 space-y-2">
        <p className="text-xs text-slate-500 text-center font-medium">
          Tài khoản mẫu (Bấm để điền nhanh):
        </p>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            type="button"
            onClick={() => onPrefillDemo('admin', 'Admin')}
            className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
            title="Điền tài khoản Admin (admin / 123456)"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => onPrefillDemo('manager01', 'Trưởng Kho')}
            className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
            title="Điền tài khoản Trưởng Kho (manager01 / 123456)"
          >
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            <span>Trưởng Kho</span>
          </button>

          <button
            type="button"
            onClick={() => onPrefillDemo('operator01', 'Thủ Kho')}
            className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
            title="Điền tài khoản Thủ Kho (operator01 / 123456)"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>Thủ Kho</span>
          </button>
        </div>
      </div>
    </div>
  );
};
