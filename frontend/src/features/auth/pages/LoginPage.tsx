import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { LoginForm } from '../components/LoginForm';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as any)?.from?.pathname;
  const isExpired = (location.state as any)?.expired;

  // Form Đăng nhập states
  const [username, setUsername] = useState(() => authService.getRememberedUsername());
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => authService.isRemembered());

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

  const handlePrefillDemo = (user: string, roleTitle: string) => {
    setUsername(user);
    setPassword('123456');
    setErrorMessage(null);
    setSuccessMessage(`Đã điền tài khoản mẫu ${roleTitle} (@${user}). Bấm Đăng nhập để tiếp tục.`);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans select-none overflow-hidden">
      {/* Clean Single Card Container */}
      <div className="w-full max-w-[460px] bg-white border border-slate-200 rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/50 relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-md shadow-indigo-200 mx-auto">
            W
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SMART WMS</h1>
            <p className="text-sm text-slate-500 mt-0.5 font-medium">Hệ Thống Quản Lý Kho Hàng Thông Minh</p>
          </div>
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

        {/* Form Đăng Nhập */}
        <LoginForm
          username={username}
          onUsernameChange={setUsername}
          password={password}
          onPasswordChange={setPassword}
          rememberMe={rememberMe}
          onRememberMeChange={setRememberMe}
          isLoading={isLoading}
          onSubmit={handleLoginSubmit}
          onOpenForgotModal={() => setIsForgotModalOpen(true)}
          onPrefillDemo={handlePrefillDemo}
        />
      </div>

      {/* Modal Quên Mật Khẩu */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onPrefillUsername={(u) => {
          setUsername(u);
          setPassword('123456');
          setSuccessMessage(`Đã điền tài khoản @${u}. Mật khẩu mặc định là 123456.`);
        }}
      />

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 mt-6 font-medium">
        Smart WMS • Hệ Thống Nội Bộ Doanh Nghiệp
      </footer>
    </div>
  );
};
