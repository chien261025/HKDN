import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  Mail, 
  AtSign, 
  Shield, 
  Smartphone, 
  Briefcase, 
  AlertTriangle, 
  CheckCircle2 
} from 'lucide-react';

interface LoginPageProps {
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'LOGIN' }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>(initialMode);

  // Form Đăng nhập
  const [username, setUsername] = useState('manager01');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);

  // Form Đăng ký
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'ROLE_OPERATOR' | 'ROLE_WAREHOUSE_MANAGER' | 'ROLE_ADMIN'>('ROLE_OPERATOR');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Trạng thái chung
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Điều hướng theo vai trò sau khi xác thực
   */
  const handleRedirectByRole = (role: string, overrideRoute?: string) => {
    if (overrideRoute) {
      navigate(overrideRoute);
    } else if (role === 'ROLE_OPERATOR') {
      navigate('/operator');
    } else {
      navigate('/');
    }
  };

  /**
   * Xử lý Đăng Nhập
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await authService.login({
        username: username.trim(),
        password: password,
      });

      setSuccessMessage(`Đăng nhập thành công! Chào mừng ${data.fullName}`);

      setTimeout(() => {
        setIsLoading(false);
        handleRedirectByRole(data.role);
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

  /**
   * Xử lý Đăng Ký Tài Khoản Mới
   */
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validations
    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp, vui lòng kiểm tra lại!');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.register({
        fullName: regFullName.trim(),
        username: regUsername.trim(),
        email: regEmail.trim(),
        role: regRole,
        password: regPassword,
      });

      setSuccessMessage(`Đăng ký thành công! Đang tự động đăng nhập với vai trò ${getRoleDisplayName(data.role)}...`);

      setTimeout(() => {
        setIsLoading(false);
        handleRedirectByRole(data.role);
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      const apiMsg =
        err.response?.data?.message ||
        err.message ||
        'Đăng ký không thành công. Vui lòng thử lại!';
      setErrorMessage(apiMsg);
    }
  };

  /**
   * Đăng nhập demo nhanh 1 chạm cho Hội đồng phản biện
   */
  const handleQuickDemo = async (user: string, route: string) => {
    setUsername(user);
    setPassword('123456');
    setActiveTab('LOGIN');
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await authService.login({ username: user, password: '123456' });
      setSuccessMessage(`Đăng nhập thành công! Chào mừng ${data.fullName}`);
      setTimeout(() => {
        setIsLoading(false);
        navigate(route);
      }, 350);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Lỗi đăng nhập tài khoản demo');
    }
  };

  const getRoleDisplayName = (role: string) => {
    if (role === 'ROLE_ADMIN') return 'Quản Trị Viên';
    if (role === 'ROLE_WAREHOUSE_MANAGER') return 'Trưởng Kho';
    return 'Thủ Kho PDA';
  };

  return (
    <div className="min-h-screen w-full bg-[#070b14] text-slate-100 flex flex-col justify-center items-center p-4 relative font-sans select-none">
      {/* Ambient background soft light */}
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[150px] pointer-events-none -z-10"></div>

      {/* Main Auth Card */}
      <div className="w-full max-w-[440px] bg-[#0c1222]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-black text-xl shadow-lg shadow-indigo-600/30 ring-1 ring-white/20 mx-auto">
            W
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">SMART WMS</h1>
            <p className="text-xs text-slate-400">Hệ thống Quản lý Kho Hàng Thông Minh</p>
          </div>
        </div>

        {/* Tab chuyển đổi Đăng Nhập / Đăng Ký */}
        <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGIN');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
              activeTab === 'LOGIN'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTER');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
              activeTab === 'REGISTER'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Đăng Ký Tài Khoản
          </button>
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

        {/* ================= FORM ĐĂNG NHẬP ================= */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
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
        )}

        {/* ================= FORM ĐĂNG KÝ ================= */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Họ và tên đầy đủ
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="vd: tuankho01"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="email@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Lựa chọn vai trò */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Vai trò công tác (RBAC)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRegRole('ROLE_OPERATOR')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    regRole === 'ROLE_OPERATOR'
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Thủ Kho PDA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('ROLE_WAREHOUSE_MANAGER')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    regRole === 'ROLE_WAREHOUSE_MANAGER'
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Trưởng Kho</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRegRole('ROLE_ADMIN')}
                  className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    regRole === 'ROLE_ADMIN'
                      ? 'bg-purple-950/40 border-purple-500 text-purple-300 ring-1 ring-purple-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Admin</span>
                </button>
              </div>
            </div>

            {/* Mật khẩu & Nhập lại mật khẩu */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mật khẩu (≥ 6 ký tự)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-7 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-medium placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer pt-2.5 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Tạo Tài Khoản & Bắt Đầu</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Đăng nhập nhanh 1 chạm cho Hội đồng chấm thi (hiển thị khi ở tab Login) */}
        {activeTab === 'LOGIN' && (
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
        )}

      </div>

      {/* Footer Gọn Nhẹ */}
      <footer className="text-center text-[11px] text-slate-500 mt-6 font-mono">
        Smart WMS Enterprise v2.5 • Đồ Án Tốt Nghiệp
      </footer>
    </div>
  );
};
