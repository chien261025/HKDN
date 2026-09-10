import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, MapPin, LogIn, ArrowRight } from 'lucide-react';

interface LoginFormProps {
  username: string;
  setUsername: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  warehouse: string;
  setWarehouse: (val: string) => void;
  rememberMe: boolean;
  setRememberMe: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  username,
  setUsername,
  password,
  setPassword,
  warehouse,
  setWarehouse,
  rememberMe,
  setRememberMe,
  onSubmit,
  isLoading,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      {/* Username */}
      <div>
        <label className="block text-slate-300 font-semibold mb-1">
          Tên Đăng Nhập (Username / Mã Nhân Viên)
        </label>
        <div className="relative">
          <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            placeholder="admin, manager_kien, operator_nam..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-slate-300 font-semibold">Mật Khẩu Truy Cập</label>
          <button
            type="button"
            onClick={() => alert('Vui lòng liên hệ Quản trị viên (Admin) tại mục /users để reset mật khẩu.')}
            className="text-[10px] text-indigo-400 hover:underline"
          >
            Quên mật khẩu?
          </button>
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Warehouse Scope */}
      <div>
        <label className="block text-slate-300 font-semibold mb-1">
          Khu Vực Kho Đăng Nhập Làm Việc
        </label>
        <div className="relative">
          <MapPin className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <select
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer transition-colors"
          >
            <option value="Kho Tổng Tân Bình (ZONE A & B)">Kho Tổng Tân Bình (ZONE A & B Toàn Diện)</option>
            <option value="Kho Mát 2-8°C (ZONE B)">Kho Mát Thực Phẩm & Dược Phẩm 2-8°C (ZONE B)</option>
            <option value="Kho Khô & Điện Tử (ZONE A)">Kho Khô & Linh Kiện Điện Tử (ZONE A)</option>
          </select>
        </div>
      </div>

      {/* Remember me */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
          />
          <span>Ghi nhớ phiên làm việc (8 tiếng)</span>
        </label>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          SSL / TLS 256-bit
        </span>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập Vào Hệ Thống WMS</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};
