import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
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
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialMode = 'LOGIN' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as any)?.from?.pathname;
  const isExpired = (location.state as any)?.expired;

  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER'>(initialMode);

  // Form Đăng nhập
  const [username, setUsername] = useState(() => authService.getRememberedUsername());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => authService.isRemembered());

  // Form Đăng ký
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'ROLE_OPERATOR' | 'ROLE_WAREHOUSE_MANAGER' | 'ROLE_ADMIN'>('ROLE_OPERATOR');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Modal quên mật khẩu
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Trạng thái chung
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cảnh báo nếu phiên đã hết hạn
  useEffect(() => {
    if (isExpired) {
      setErrorMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
    }
  }, [isExpired]);

  /**
   * Điều hướng theo vai trò sau khi xác thực
   */
  const handleRedirectByRole = (role: string, overrideRoute?: string) => {
    if (overrideRoute) {
      navigate(overrideRoute, { replace: true });
    } else if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
      if (role === 'ROLE_OPERATOR' && fromPath !== '/operator') {
        navigate('/operator', { replace: true });
      } else {
        navigate(fromPath, { replace: true });
      }
    } else if (role === 'ROLE_OPERATOR') {
      navigate('/operator', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  /**
   * Xử lý Đăng Nhập
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('Vui lòng nhập tên đăng nhập và mật khẩu!');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await authService.login({
        username: username.trim(),
        password: password,
      });

      authService.setRememberedUsername(username.trim(), rememberMe);
      setSuccessMessage(`Đăng nhập thành công! Xin chào ${data.fullName || data.username}`);

      setTimeout(() => {
        setIsLoading(false);
        handleRedirectByRole(data.role);
      }, 350);
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

    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.register({
        fullName: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        email: regEmail.trim(),
        role: regRole,
        password: regPassword,
      });

      setSuccessMessage(`Khởi tạo tài khoản thành công! Đang đăng nhập...`);

      setTimeout(() => {
        setIsLoading(false);
        handleRedirectByRole(data.role);
      }, 400);
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
   * Điền nhanh tài khoản mẫu
   */
  const handlePrefillDemo = (user: string, roleTitle: string) => {
    setUsername(user);
    setPassword('123456');
    setActiveTab('LOGIN');
    setErrorMessage(null);
    setSuccessMessage(`Đã điền tài khoản mẫu ${roleTitle} (@${user}). Bấm Đăng nhập để tiếp tục.`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans select-none overflow-hidden">
      {/* Clean Single Card Container */}
      <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/50 relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header: Logo + Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-md shadow-indigo-200 mx-auto">
            W
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SMART WMS</h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">Hệ Thống Quản Lý Kho Hàng Thông Minh</p>
          </div>
        </div>

        {/* Tab Switcher: Đăng Nhập / Đăng Ký */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-sm font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGIN');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 rounded-lg transition-all text-center cursor-pointer ${
              activeTab === 'LOGIN'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
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
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Alert Notifications */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ================= FORM ĐĂNG NHẬP ================= */}
        {activeTab === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-sm">
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
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all font-medium text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-800 font-semibold">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
                  onChange={(e) => setRememberMe(e.target.checked)}
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
        )}

        {/* ================= FORM ĐĂNG KÝ ================= */}
        {activeTab === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 text-sm">
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
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
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
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
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
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-9 pr-2 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Vai trò RBAC Dropdown Gọn Gàng */}
            <div>
              <label className="block text-slate-800 font-semibold mb-1">
                Vai trò công tác (RBAC)
              </label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as any)}
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
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="≥ 6 ký tự"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Nhập lại"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
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
        )}

        {/* Tài Khoản Mẫu (Dành cho Hội đồng / Demo) - Tinh tế & Sạch sẽ */}
        {activeTab === 'LOGIN' && (
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <p className="text-xs text-slate-500 text-center font-medium">
              Tài khoản mẫu (Bấm để điền nhanh):
            </p>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handlePrefillDemo('admin', 'Admin')}
                className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                title="Điền tài khoản Admin (admin / 123456)"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrefillDemo('manager01', 'Trưởng Kho')}
                className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                title="Điền tài khoản Trưởng Kho (manager01 / 123456)"
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Trưởng Kho</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrefillDemo('operator01', 'Thủ Kho')}
                className="py-2 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-semibold"
                title="Điền tài khoản Thủ Kho (operator01 / 123456)"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Thủ Kho</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onPrefillUsername={(u) => {
          setUsername(u);
          setPassword('123456');
          setSuccessMessage(`Đã điền tài khoản @${u}. Mật khẩu mặc định là 123456.`);
        }}
      />

      {/* Clean Footer */}
      <footer className="text-center text-xs text-slate-500 mt-6 font-medium">
        Smart WMS • Phiên bản 2.5
      </footer>
    </div>
  );
};
