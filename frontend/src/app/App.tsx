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

const AppContent: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const location = useLocation();

  // Trạng thái thu gọn/mở rộng thanh menu bên trái (lưu vào localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('smart_wms_sidebar_collapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('smart_wms_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Màn hình công khai (/login, /register): Bọc PublicOnlyRoute
  if (location.pathname === '/login' || location.pathname === '/register') {
    return (
      <PublicOnlyRoute>
        <LoginPage initialMode={location.pathname === '/register' ? 'REGISTER' : 'LOGIN'} />
      </PublicOnlyRoute>
    );
  }

  // 2. Kiểm tra Auth Guard cho TẤT CẢ các route nội bộ
  const session = authService.getCurrentSession();
  const token = localStorage.getItem('smart_wms_token');
  const isExpired = session?.expiresAt ? new Date(session.expiresAt).getTime() <= Date.now() : true;

  if (!session || !token || isExpired) {
    if (token || session) {
      localStorage.removeItem('smart_wms_token');
      localStorage.removeItem('smart_wms_session');
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
        onOpenScanner={() => setShowScanner(true)}
        session={session}
        currentTime={currentTime}
      />

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-slate-100">
        {/* Top Header Bar */}
        <AppHeader
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          session={session}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100/70 relative">
          <AppRoutes />
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
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
