import React, { useState, useEffect } from 'react';
import { BrowserRouter, useLocation, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/components/PublicOnlyRoute';
import { authService } from '../features/auth/services/authService';
import { OperatorPortalPage } from '../features/operator/pages/OperatorPortalPage';
import { CameraBarcodeScanner } from '../components/scanner/CameraBarcodeScanner';
import { UserProfileModal } from '../features/users/components/UserProfileModal';
import { AppSidebar } from './components/AppSidebar';
import { AppHeader } from './components/AppHeader';
import { AppRoutes } from './components/AppRoutes';
import { NotificationProvider } from '../features/notifications/context/NotificationContext';
import { ToastNotificationContainer } from '../features/notifications/components/ToastNotificationContainer';
import { IdleTimeoutGuard } from '../features/auth/components/IdleTimeoutGuard';
import { STORAGE_KEYS } from '../constants';

const AppContent: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const location = useLocation();

  // Trạng thái thu gọn/mở rộng thanh menu bên trái (lưu vào localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED);
    return saved === 'true';
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Close mobile drawer on route navigation and check session active status in real-time
  useEffect(() => {
    setIsMobileSidebarOpen(false);

    const verifySession = () => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token && location.pathname !== '/login') {
        authService.checkSessionStatus().then((status) => {
          if (!status.active) {
            localStorage.removeItem(STORAGE_KEYS.TOKEN);
            localStorage.removeItem(STORAGE_KEYS.SESSION);
            window.location.href = '/login?expired=true';
          }
        }).catch(() => {});
      }
    };

    // Kiểm tra ngay lập tức khi người dùng click/focus vào tab
    window.addEventListener('focus', verifySession);

    // Đồng bộ đa tab: tự động văng ngay nếu tab khác hủy token
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.TOKEN && !e.newValue) {
        window.location.href = '/login?expired=true';
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // Nhịp tim Heartbeat kiểm tra phiên thời gian thực mỗi 3 giây
    const interval = setInterval(verifySession, 3000);

    return () => {
      window.removeEventListener('focus', verifySession);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [location.pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(next));
      return next;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Màn hình công khai (/login): Bọc PublicOnlyRoute
  if (location.pathname === '/register') {
    return <Navigate to="/login" replace />;
  }
  if (location.pathname === '/login') {
    return (
      <PublicOnlyRoute>
        <LoginPage />
      </PublicOnlyRoute>
    );
  }

  // 2. Kiểm tra Auth Guard cho TẤT CẢ các route nội bộ
  const session = authService.getCurrentSession();
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  const isExpired = session?.expiresAt ? new Date(session.expiresAt).getTime() <= Date.now() : true;

  if (!session || !token || isExpired) {
    if (token || session) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
    return <Navigate to="/login" replace state={{ from: location, expired: isExpired && !!session }} />;
  }

  // 3. Nếu là Thủ kho PDA và đang ở /operator: hiển thị trực tiếp giao diện Mobile PDA
  if (location.pathname === '/operator') {
    return (
      <ProtectedRoute allowedRoles={['ROLE_OPERATOR', 'ROLE_ADMIN', 'ROLE_WAREHOUSE_MANAGER']}>
        <OperatorPortalPage />
      </ProtectedRoute>
    );
  }

  // 4. Nếu người dùng là ROLE_OPERATOR nhưng truy cập các trang Dashboard Web: tự động chuyển về /operator
  if (session.role === 'ROLE_OPERATOR') {
    return <Navigate to="/operator" replace />;
  }

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden relative">
      {/* Sidebar Navigation */}
      <AppSidebar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenScanner={() => setShowScanner(true)}
        session={session}
        currentTime={currentTime}
      />

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-slate-100 min-w-0">
        {/* Top Header Bar */}
        <AppHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          session={session}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-slate-100/70 relative">
          <AppRoutes onOpenScanner={() => setShowScanner(true)} />
        </main>
      </div>

      {/* Profile & Change Password Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        session={session}
      />

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <CameraBarcodeScanner
          onScanSuccess={(code) => {
            alert(`Đã nhận diện mã vạch Barcode: ${code}`);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <NotificationProvider>
        <AppContent />
        <IdleTimeoutGuard />
        <ToastNotificationContainer />
      </NotificationProvider>
    </BrowserRouter>
  );
};

export default App;
