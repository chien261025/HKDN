import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { FirstTimeChangePasswordModal } from '../components/FirstTimeChangePasswordModal';
import { LoginForm } from '../components/LoginForm';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useLoginLockout } from '../hooks/useLoginLockout';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromPath = (location.state as any)?.from?.pathname;
  const isExpired = (location.state as any)?.expired;
  const isLoggedOut = searchParams.get('logged_out') === 'true';
  const isIdle = searchParams.get('idle') === 'true';

  // Form Đăng nhập states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Modal quên mật khẩu & bắt buộc đổi mật khẩu lần đầu
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [mustChangePasswordState, setMustChangePasswordState] = useState<{
    isOpen: boolean;
    username: string;
    currentPassword: string;
    role: string;
  }>({
    isOpen: false,
    username: '',
    currentPassword: '',
    role: '',
  });

  // Trạng thái thông báo
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const onLockoutExpired = useCallback(() => {
    setSuccessMessage('Thời gian tạm khóa đã kết thúc. Bạn có thể đăng nhập lại.');
  }, []);

  const {
    lockoutRemainingSec,
    lockLevel,
    handleLockoutFromError,
    formatMinsSecs,
  } = useLoginLockout(username, onLockoutExpired);

  // Cảnh báo nếu phiên đã hết hạn hoặc vừa đăng xuất
  useEffect(() => {
    if (isIdle) {
      setErrorMessage('Phiên làm việc đã tự động khóa do không hoạt động để bảo vệ an toàn.');
    } else if (isExpired) {
      setErrorMessage('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại!');
    } else if (isLoggedOut) {
      setSuccessMessage('Đã đăng xuất thành công khỏi hệ thống.');
    }
  }, [isExpired, isLoggedOut, isIdle]);

  // Kiểm tra nếu phiên hiện tại đang ở trạng thái bắt buộc đổi mật khẩu
  useEffect(() => {
    const s = authService.getCurrentSession();
    if (s && s.mustChangePassword) {
      setMustChangePasswordState({
        isOpen: true,
        username: s.username,
        currentPassword: '',
        role: s.role,
      });
    }
  }, []);

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
    if (isLoading || lockoutRemainingSec > 0) return;
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

      if (data.mustChangePassword) {
        setIsLoading(false);
        setMustChangePasswordState({
          isOpen: true,
          username: data.username,
          currentPassword: password,
          role: data.role,
        });
        return;
      }

      setSuccessMessage(`Đăng nhập thành công! Xin chào ${data.fullName || data.username}`);

      setTimeout(() => {
        setIsLoading(false);
        handleRedirectByRole(data.role);
      }, 300);
    } catch (err: any) {
      setIsLoading(false);
      handleLockoutFromError(err, username);
      const apiMsg =
        err.response?.data?.message ||
        err.message ||
        'Tên đăng nhập hoặc mật khẩu không chính xác!';
      setErrorMessage(apiMsg);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans select-none overflow-hidden">
      <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img src="/favicon.svg" alt="Smart WMS" className="w-14 h-14 rounded-2xl shadow-md mx-auto" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SMART WMS</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">Hệ Thống Quản Lý Kho Thông Minh</p>
          </div>
        </div>

        {/* Lockout Live Countdown Banner */}
        {lockoutRemainingSec > 0 && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium flex items-center gap-3 animate-in fade-in">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
            <div className="flex-1">
              <div className="font-bold text-amber-950 flex items-center justify-between">
                <span>Tài khoản & IP đang bị khóa</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold">
                  Mức {lockLevel} ({lockLevel === 1 ? '1 phút' : lockLevel === 2 ? '3 phút' : '15 phút'})
                </span>
              </div>
              <div className="text-amber-800 text-xs mt-1">
                Hệ thống tạm khóa bảo vệ. Tự động mở sau:{' '}
                <span className="font-mono font-bold text-rose-600 text-sm">
                  {formatMinsSecs(lockoutRemainingSec)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Alert Notifications */}
        {errorMessage && lockoutRemainingSec <= 0 && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Đăng Nhập */}
        <LoginForm
          username={username}
          onUsernameChange={setUsername}
          password={password}
          onPasswordChange={setPassword}
          isLoading={isLoading}
          lockoutRemainingSec={lockoutRemainingSec}
          onSubmit={handleLoginSubmit}
          onOpenForgotModal={() => setIsForgotModalOpen(true)}
        />
      </div>

      {/* Modal Quên Mật Khẩu */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onPrefillUsername={(u) => {
          setUsername(u);
          setPassword('');
          setSuccessMessage(`Đã cập nhật mật khẩu mới cho tài khoản @${u}! Vui lòng đăng nhập lại.`);
        }}
      />

      {/* Modal Bắt Buộc Đổi Mật Khẩu Lần Đầu */}
      <FirstTimeChangePasswordModal
        isOpen={mustChangePasswordState.isOpen}
        username={mustChangePasswordState.username}
        currentPassword={mustChangePasswordState.currentPassword}
        onCancel={() => {
          authService.logout();
          setMustChangePasswordState({ isOpen: false, username: '', currentPassword: '', role: '' });
          setPassword('');
        }}
        onSuccess={() => {
          const role = mustChangePasswordState.role;
          setMustChangePasswordState({ isOpen: false, username: '', currentPassword: '', role: '' });
          setSuccessMessage('Đã thiết lập mật khẩu cá nhân thành công! Đang chuyển hướng...');
          setTimeout(() => {
            handleRedirectByRole(role);
          }, 400);
        }}
      />

      <footer className="text-center text-xs text-slate-400 mt-6 font-normal">
        © 2026 Smart WMS. All rights reserved.
      </footer>
    </div>
  );
};
