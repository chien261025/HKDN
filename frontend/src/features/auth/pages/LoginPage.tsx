import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { User, Lock, Eye, EyeOff, LogIn, Shield, Smartphone, Briefcase, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('manager01');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Thực hiện gọi API đăng nhập Backend thực tế
   */
  const executeLogin = async (userToLogin: string, passToLogin: string, targetRouteOverride?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await authService.login({
        username: userToLogin.trim(),
        password: passToLogin,
      });

      setSuccessMessage(`Đăng nhập thành công! Chào mừng ${data.fullName}`);

      setTimeout(() => {
        setIsLoading(false);
        if (targetRouteOverride) {
          navigate(targetRouteOverride);
        } else if (data.role === 'ROLE_OPERATOR') {
          navigate('/operator');
        } else {
          navigate('/');
        }
      }, 400);
    } catch (err: any) {
      setIsLoading(false);
      const apiMsg =
        err.response?.data?.message ||
        err.message ||
        'Tài khoản hoặc mật khẩu không chính xác!';
      setErrorMessage(apiMsg);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(username, password);
  };

  const handleQuickDemo = (user: string, route: string) => {
    setUsername(user);
    setPassword('123456');
    executeLogin(user, '123456', route);
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans select-none">
      {/* Ambient background soft light */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none -z-10"></div>

      {/* Main Login Card Tinh Gọn */}
      <div className="w-full max-w-[420px] bg-[#0c1222]/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-7 sm:p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-black text-xl shadow-lg shadow-indigo-600/30 ring-1 ring-white/20 mx-auto">
            W
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">SMART WMS</h1>
            <p className="text-xs text-slate-400 mt-0.5">Hệ thống Quản lý Kho Thông minh</p>
          </div>
        </div>

        {/* Thông báo lỗi / thành công */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/60 text-rose-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/60 text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Đăng Nhập Chuẩn Gọn Gàng */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tên đăng nhập */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Tên đăng nhập
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="admin, manager01, operator01..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
            </div>
          </div>

          {/* Mật khẩu */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold">Mật khẩu</label>
              <span className="text-[11px] text-slate-400 font-mono">Demo: 123456</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Nút Đăng nhập */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer pt-2.5"
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

        {/* Đăng nhập nhanh 1 chạm cho Hội đồng chấm thi */}
        <div className="pt-4 border-t border-slate-800 space-y-2.5">
          <p className="text-[11px] text-slate-400 text-center font-medium">
            Hoặc chọn vai trò để đăng nhập nhanh:
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('admin', '/')}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-750 hover:border-indigo-500/50 text-slate-200 hover:text-white transition-all text-center flex flex-col items-center gap-1 group cursor-pointer disabled:opacity-50"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Admin</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('manager01', '/')}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-750 hover:border-cyan-500/50 text-slate-200 hover:text-white transition-all text-center flex flex-col items-center gap-1 group cursor-pointer disabled:opacity-50"
            >
              <Briefcase className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Trưởng Kho</span>
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleQuickDemo('operator01', '/operator')}
              className="py-2 px-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-750 hover:border-emerald-500/50 text-slate-200 hover:text-white transition-all text-center flex flex-col items-center gap-1 group cursor-pointer disabled:opacity-50"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold">Thủ Kho PDA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Gọn Nhẹ */}
      <footer className="text-center text-[11px] text-slate-500 mt-6 font-mono">
        Smart WMS Enterprise v2.5 • Đồ Án Tốt Nghiệp
      </footer>
    </div>
  );
};
