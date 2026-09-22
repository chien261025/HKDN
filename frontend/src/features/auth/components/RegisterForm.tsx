import React, { useState } from 'react';
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react';

interface RegisterFormProps {
  fullName: string;
  onFullNameChange: (val: string) => void;
  username: string;
  onUsernameChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  role: 'ROLE_OPERATOR' | 'ROLE_WAREHOUSE_MANAGER' | 'ROLE_ADMIN';
  onRoleChange: (val: 'ROLE_OPERATOR' | 'ROLE_WAREHOUSE_MANAGER' | 'ROLE_ADMIN') => void;
  password: string;
  onPasswordChange: (val: string) => void;
  confirmPassword: string;
  onConfirmPasswordChange: (val: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  fullName,
  onFullNameChange,
  username,
  onUsernameChange,
  email,
  onEmailChange,
  role,
  onRoleChange,
  password,
  onPasswordChange,
  confirmPassword,
  onConfirmPasswordChange,
  isLoading,
  onSubmit,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-sm">
      <div>
        <label className="block text-slate-800 font-semibold mb-1">
          Họ và tên đầy đủ <span className="text-rose-500">*</span>
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            placeholder="VD: Lê Hoàng Nam"
            value={fullName}
            onChange={(e) => onFullNameChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all text-sm font-medium"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            Tên đăng nhập <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="vd: nam.le"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="w-full pl-9 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all font-mono text-sm font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            Email công vụ <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              placeholder="email@wms.vn"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="w-full pl-9 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Vai trò RBAC */}
      <div>
        <label className="block text-slate-800 font-semibold mb-1">
          Vai trò công tác (RBAC)
        </label>
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value as any)}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:border-indigo-600 transition-all text-sm font-medium cursor-pointer"
        >
          <option value="ROLE_OPERATOR">Thủ Kho (PDA Mobile / Barcode)</option>
          <option value="ROLE_WAREHOUSE_MANAGER">Trưởng Kho (Quản lý điều hành)</option>
          <option value="ROLE_ADMIN">Quản Trị Viên (Toàn quyền Admin)</option>
        </select>
      </div>

      {/* Mật khẩu & Xác nhận */}
      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            Mật khẩu <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="≥ 6 ký tự"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-slate-800 font-semibold mb-1">
            Xác nhận <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              placeholder="Nhập lại"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Submit Register Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer pt-2.5 mt-2 text-sm"
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            <span>Tạo Tài Khoản</span>
          </>
        )}
      </button>
    </form>
  );
};
