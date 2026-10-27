import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { LoginForm } from '../components/LoginForm';
import { AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

const getStoredLockoutSeconds = (u: string): number => {
  if (!u?.trim()) return 0;
  const stored = localStorage.getItem(`wms_lockout_${u.trim().toLowerCase()}`);
  if (!stored) return 0;
  const remaining = Math.max(0, Math.ceil((parseInt(stored, 10) - Date.now()) / 1000));
  if (remaining <= 0) {
    localStorage.removeItem(`wms_lockout_${u.trim().toLowerCase()}`);
    return 0;
  }
  return remaining;
};

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromPath = (location.state as any)?.from?.pathname;
  const isExpired = (location.state as any)?.expired;
  const isLoggedOut = searchParams.get('logged_out') === 'true';
  const isIdle = searchParams.get('idle') === 'true';

  // Form Đăng nhập states
  const [username, setUsername] = useState(() => authService.getRememberedUsername());
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => authService.isRemembered());

  // Lockout countdown timer state (giây) và cấp độ phạt (1: 1p, 2: 3p, 3: 15p...)
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState(() =>
    getStoredLockoutSeconds(authService.getRememberedUsername())
  );
  const [lockLevel, setLockLevel] = useState<number>(1);

  // Modal quên mật khẩu
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Trạng thái chung
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Bộ đếm thời gian thực lùi từng giây
  useEffect(() => {
    if (lockoutRemainingSec <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemainingSec((prev) => {
        if (prev <= 1) {
          if (username.trim()) {
            localStorage.removeItem(`wms_lockout_${username.trim().toLowerCase()}`);
          }
          setSuccessMessage('Thời gian tạm khóa đã kết thúc. Bạn có thể đăng nhập lại.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemainingSec, username]);

  // Tự động kiểm tra khóa theo cả Tài khoản, IP mạng & Dấu vân tay thiết bị (Chống Tab Ẩn Danh)
  useEffect(() => {
    let isMounted = true;
    const checkCurrentLockout = async () => {
      const dfp = getDeviceFingerprint();
      try {
        const res = await authService.checkLockout(username, dfp);
        if (!isMounted) return;
        if (res.blocked && res.remainingSeconds > 0) {
          setLockoutRemainingSec(res.remainingSeconds);
          setLockLevel(res.lockLevel || 1);
          if (username.trim()) {
            localStorage.setItem(
              `wms_lockout_${username.trim().toLowerCase()}`,
              (Date.now() + res.remainingSeconds * 1000).toString()
            );
          }
        } else {
          setLockoutRemainingSec(0);
          if (username.trim()) {
            localStorage.removeItem(`wms_lockout_${username.trim().toLowerCase()}`);
          }
        }
      } catch {
        if (!isMounted) return;
        const localSec = getStoredLockoutSeconds(username);
        setLockoutRemainingSec(localSec);
      }
    };
    checkCurrentLockout();
    return () => { isMounted = false; };
  }, [username]);

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

      authService.setRememberedUsername(username.trim(), rememberMe);
      setSuccessMessage(`Đăng nhập thành công! Xin chào ${data.fullName || data.username}`);

      setTimeout(() => {
        setIsLoading(false);
        handleRedirectByRole(data.role);
      }, 300);
    } catch (err: any) {
      setIsLoading(false);
      const apiMsg =
        err.response?.data?.message ||
        err.message ||
        'Tên đăng nhập hoặc mật khẩu không chính xác!';

      // Bắt thời gian phạt từ API (chỉ khi thực sự bị khóa: mã 400 và có thông báo khóa)
      const secMatch = apiMsg.match(/sau\s+(\d+)\s+giây/);
      const minMatch = apiMsg.match(/bị tạm khóa\s+(\d+)\s+phút/);
      const isLockedResponse = err.response?.status === 400 && (secMatch || minMatch);

      if (isLockedResponse) {
        let sec = 60;
        if (secMatch) {
          sec = parseInt(secMatch[1], 10);
        } else if (minMatch) {
          sec = parseInt(minMatch[1], 10) * 60;
        }
        setLockoutRemainingSec(sec);
        if (sec > 180) setLockLevel(3);
        else if (sec > 60) setLockLevel(2);
        else setLockLevel(1);

        if (username.trim()) {
          localStorage.setItem(
            `wms_lockout_${username.trim().toLowerCase()}`,
            (Date.now() + sec * 1000).toString()
          );
        }
      } else {
        // Chỉ là nhập sai thông thường (chưa chạm 5 lần) -> KHÔNG kích hoạt bộ đếm khóa
        setLockoutRemainingSec(0);
        if (username.trim()) {
          localStorage.removeItem(`wms_lockout_${username.trim().toLowerCase()}`);
        }
      }
      setErrorMessage(apiMsg);
    }
  };

  const formatMinsSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans select-none overflow-hidden">
      {/* Clean Enterprise Card */}
      <div className="w-full max-w-[420px] bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 relative z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <img src="/favicon.svg" alt="Smart WMS" className="w-14 h-14 rounded-2xl shadow-md mx-auto" />
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">SMART WMS</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">Hệ Thống Quản Lý Kho Thông Minh</p>
          </div>
        </div>

        {/* Lockout Live Countdown Banner (Hỗ trợ khóa theo IP & Thiết bị) */}
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
                Do nhập sai nhiều lần. Tự động mở sau:{' '}
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
          rememberMe={rememberMe}
          onRememberMeChange={setRememberMe}
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

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 mt-6 font-normal">
        © 2026 Smart WMS. All rights reserved.
      </footer>
    </div>
  );
};
