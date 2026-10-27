import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Clock, ShieldAlert, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// Cấu hình thời gian bảo mật doanh nghiệp: 15 phút (900 giây), cảnh báo trước 60 giây
export const IDLE_TOTAL_SECONDS = 15 * 60;
export const WARN_BEFORE_SECONDS = 60;

export const IdleTimeoutGuard: React.FC = () => {
  const location = useLocation();
  const [secondsRemaining, setSecondsRemaining] = useState(IDLE_TOTAL_SECONDS);
  const [showWarning, setShowWarning] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const showWarningRef = useRef(false);

  showWarningRef.current = showWarning;

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showWarningRef.current) {
      setShowWarning(false);
      setSecondsRemaining(IDLE_TOTAL_SECONDS);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('smart_wms_token');
    // Nếu đang ở màn hình login hoặc chưa đăng nhập, không kích hoạt guard
    if (!token || location.pathname === '/login') {
      setShowWarning(false);
      return;
    }

    // Reset mốc hoạt động khi chuyển trang hoặc vừa đăng nhập
    lastActivityRef.current = Date.now();
    setSecondsRemaining(IDLE_TOTAL_SECONDS);
    setShowWarning(false);

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'pointerdown'];
    const handleEvent = () => resetActivity();

    events.forEach((ev) => window.addEventListener(ev, handleEvent, { passive: true }));

    const timer = setInterval(() => {
      const currentToken = localStorage.getItem('smart_wms_token');
      if (!currentToken || window.location.pathname === '/login') {
        return;
      }

      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, IDLE_TOTAL_SECONDS - elapsedSeconds);
      setSecondsRemaining(remaining);

      if (remaining <= WARN_BEFORE_SECONDS && remaining > 0) {
        setShowWarning(true);
      } else if (remaining <= 0) {
        clearInterval(timer);
        localStorage.removeItem('smart_wms_token');
        localStorage.removeItem('smart_wms_session');
        window.location.href = '/login?idle=true';
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      events.forEach((ev) => window.removeEventListener(ev, handleEvent));
    };
  }, [location.pathname, resetActivity]);

  if (!showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 p-6 max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-900 text-base">Cảnh Báo Không Hoạt Động</h4>
          <p className="text-xs text-slate-500 mt-1">
            Không ghi nhận thao tác tương tác. Phiên làm việc sẽ tự động khóa sau:
          </p>
        </div>
        <div className="flex items-center justify-center gap-1.5 font-mono text-2xl font-black text-amber-600 bg-amber-50 py-2 rounded-xl border border-amber-200">
          <Clock className="w-5 h-5 animate-spin" />
          <span>{formattedCountdown}</span>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={resetActivity}
            className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Tiếp tục làm việc
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('smart_wms_token');
              localStorage.removeItem('smart_wms_session');
              window.location.href = '/login?idle=true';
            }}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Khóa ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
