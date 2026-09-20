import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Package,
  ScanLine,
  Bot,
  FileSpreadsheet,
  Bell,
  Search,
  Activity,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Smartphone,
  Truck,
  PackageCheck,
  ClipboardCheck,
  LogOut
} from 'lucide-react';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { LocationLayoutPage } from '../features/masterdata/pages/LocationLayoutPage';
import { InventoryBalancePage } from '../features/inventory/pages/InventoryBalancePage';
import { SmartAssistantPage } from '../features/smartquery/pages/SmartAssistantPage';
import { ReportsPage } from '../features/reporting/pages/ReportsPage';
import { OperatorPortalPage } from '../features/operator/pages/OperatorPortalPage';
import { InboundOrdersPage } from '../features/inbound/pages/InboundOrdersPage';
import { OutboundOrdersPage } from '../features/outbound/pages/OutboundOrdersPage';
import { AuditManagementPage } from '../features/audit/pages/AuditManagementPage';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { UsersManagementPage } from '../features/users/pages/UsersManagementPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/components/PublicOnlyRoute';
import { authService } from '../features/auth/services/authService';
import { CameraBarcodeScanner } from '../components/scanner/CameraBarcodeScanner';
import { UserProfileModal } from '../features/users/components/UserProfileModal';

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

  // Phím tắt Ctrl+B hoặc Cmd+B để thu gọn/mở rộng menu nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Màn hình công khai (/login, /register): Bọc PublicOnlyRoute
  // Nếu đã đăng nhập, tự động chuyển vào / hoặc /operator
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

  const allNavItems = [
    { name: 'Trung Tâm Điều Hành', path: '/', icon: LayoutDashboard, badge: 'LIVE', shortcut: '⌘1' },
    { name: 'Tài Khoản & Phân Quyền', path: '/users', icon: ShieldCheck, badge: 'ADMIN', shortcut: '⌘2', requiredRole: 'ROLE_ADMIN' },
    { name: 'Sản Phẩm & Nhà Cung Cấp', path: '/products', icon: Package, badge: 'MASTER', shortcut: '⌘3' },
    { name: 'Đơn Nhập Kho', path: '/inbound', icon: Truck, badge: 'INBOUND', shortcut: '⌘4' },
    { name: 'Đơn Xuất Kho', path: '/outbound', icon: PackageCheck, badge: 'OUTBOUND', shortcut: '⌘5' },
    { name: 'Sơ Đồ Vị Trí Ô Kệ', path: '/layout', icon: Layers, badge: 'MAP', shortcut: '⌘6' },
    { name: 'Quản Lý Tồn Kho', path: '/inventory', icon: Package, badge: 'STOCK', shortcut: '⌘7' },
    { name: 'Kiểm Kê Kho Hàng', path: '/audit', icon: ClipboardCheck, badge: 'AUDIT', shortcut: '⌘8' },
    { name: 'Trợ Lý AI Tra Cứu', path: '/smartquery', icon: Bot, badge: 'AI', shortcut: '⌘9' },
    { name: 'Báo Cáo & Thống Kê', path: '/reports', icon: FileSpreadsheet, badge: 'REPORT', shortcut: '⌘R' },
    { name: 'Giao Diện Quét Mã PDA', path: '/operator', icon: Smartphone, badge: 'PDA', shortcut: '⌘0' },
  ];

  // Lọc menu theo vai trò người dùng (Ví dụ: Chỉ ADMIN mới thấy menu Quản lý tài khoản)
  const navItems = allNavItems.filter((item) => !item.requiredRole || item.requiredRole === session.role);

  return (
    <div className="flex h-screen bg-slate-100 text-slate-900 font-sans overflow-hidden relative">
      {/* Sidebar Navigation - Giao diện sáng thanh lịch, độ tương phản cao */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        } bg-white text-slate-800 flex flex-col border-r border-slate-200 shadow-sm relative z-20 transition-all duration-300 ease-in-out`}
      >
        {/* Brand Header */}
        <div
          className={`border-b border-slate-200 flex items-center transition-all bg-white ${
            isSidebarCollapsed ? 'p-3 flex-col gap-2 justify-center' : 'p-4 justify-between'
          }`}
        >
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-100">
                W
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-slate-900 text-lg tracking-tight whitespace-nowrap">SMART WMS</h1>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">PRO</span>
                </div>
                <p className="text-xs text-slate-600 font-semibold whitespace-nowrap">Hệ Thống Quản Lý Kho</p>
              </div>
            )}
          </div>

          {/* Nút thu nhỏ / mở rộng sidebar */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Mở rộng menu (Ctrl+B)" : "Thu gọn menu (Ctrl+B)"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 text-indigo-600" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Quick System Status */}
        <div
          className={`bg-slate-50 border-b border-slate-200 flex items-center text-xs ${
            isSidebarCollapsed ? 'py-2 justify-center' : 'px-4 py-2.5 justify-between'
          }`}
          title={`Hệ thống Online • ${currentTime}`}
        >
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {!isSidebarCollapsed && <span>Hệ Thống Online</span>}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1.5 font-mono text-slate-600 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {!isSidebarCollapsed && (
            <p className="px-3 py-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              Phân Hệ Điều Hành
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (isSidebarCollapsed) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={`${item.name} (${item.badge})`}
                  className={`group relative flex items-center justify-center w-11 h-11 mx-auto rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />

                  {/* Tooltip nổi khi rê chuột vào chế độ thu nhỏ */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 flex items-center gap-2">
                    <span>{item.name}</span>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                      {item.badge}
                    </span>
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all relative ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-300 shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 group-hover:text-indigo-600 group-hover:bg-indigo-50'
                  }`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <span className="truncate text-sm">{item.name}</span>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 text-slate-700 border border-slate-200 group-hover:text-slate-900'
                }`}>
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Infrastructure Nodes Status Widget */}
        {!isSidebarCollapsed ? (
          <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-700 font-bold text-xs">
              <span className="flex items-center gap-1.5 text-slate-900"><Cpu className="w-3.5 h-3.5 text-indigo-600" /> Cụm Hạ Tầng Live</span>
              <span className="text-emerald-800 font-bold text-xs bg-emerald-100 px-2 py-0.5 rounded">ONLINE</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5 text-xs font-mono">
              <div className="p-1.5 rounded bg-white flex items-center justify-between border border-slate-200 shadow-xs">
                <span className="text-slate-800 font-semibold">Postgres</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="p-1.5 rounded bg-white flex items-center justify-between border border-slate-200 shadow-xs">
                <span className="text-slate-800 font-semibold">RabbitMQ</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="p-1.5 rounded bg-white flex items-center justify-between border border-slate-200 shadow-xs">
                <span className="text-slate-800 font-semibold">MinIO S3</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="p-1.5 rounded bg-white flex items-center justify-between border border-slate-200 shadow-xs">
                <span className="text-slate-800 font-semibold">Locking</span>
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2.5 mx-auto mb-2 text-center" title="Cụm Hạ Tầng: ONLINE">
            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-emerald-600">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Quét Barcode Action Button */}
        <div className={`border-t border-slate-200 ${isSidebarCollapsed ? 'p-3 flex justify-center' : 'p-3.5'}`}>
          <button
            onClick={() => setShowScanner(true)}
            title="Mở Camera Quét Mã Barcode"
            className={`${
              isSidebarCollapsed
                ? 'w-11 h-11 justify-center'
                : 'w-full justify-center gap-2.5 py-2.5 px-3'
            } flex items-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-xl text-sm font-bold transition-all shadow-xs group cursor-pointer`}
          >
            <ScanLine className="w-4.5 h-4.5 text-indigo-600 group-hover:scale-110 transition-transform flex-shrink-0" />
            {!isSidebarCollapsed && <span>Mở Camera Quét Barcode</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-slate-100">
        {/* Top Header Bar - Sạch sẽ, chữ đậm sắc nét */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-xs gap-3">
          {/* Nút bật/tắt Sidebar trên thanh Header */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer flex-shrink-0"
            title={isSidebarCollapsed ? "Mở rộng thanh menu bên trái (Ctrl+B)" : "Thu nhỏ thanh menu bên trái (Ctrl+B)"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5 text-indigo-600" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          {/* Search bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhanh SKU, mã vạch Barcode, ô kệ..."
                className="w-full pl-9 pr-14 py-2 bg-slate-50/80 hover:bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-3 focus:ring-indigo-50 transition-all font-normal"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </div>
          </div>

          {/* Right quick telemetry & User profile */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Chống Âm Kho: Pessimistic Lock</span>
            </div>

            <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile badge with safe UTF-8 fallback */}
            {(() => {
              const rawName = session.fullName;
              const roleStr = String(session.role || '');
              const safeName = (!rawName || rawName.includes('?'))
                ? (roleStr === 'ROLE_ADMIN' ? 'Nguyễn Quản Trị' : roleStr === 'ROLE_OPERATOR' ? 'Lê Thủ Kho' : 'Trần Trưởng Kho')
                : rawName;
              const nameParts = safeName.trim().split(/\s+/).filter(Boolean);
              const initials = nameParts.length >= 2 
                ? (nameParts[nameParts.length - 2][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
                : (nameParts[0]?.slice(0, 2).toUpperCase() || 'TK');
              const roleTitle = roleStr === 'ROLE_ADMIN' 
                ? 'Quản Trị Viên' 
                : roleStr === 'ROLE_OPERATOR' 
                  ? 'Vận Hành Kho' 
                  : 'Trưởng Kho Quản Lý';

              return (
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsProfileModalOpen(true)}
                    title="Xem hồ sơ cá nhân và đổi mật khẩu"
                    className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs tracking-wider shadow-xs group-hover:scale-105 transition-transform">
                        {initials}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                        {safeName}
                      </p>
                      <span className="text-[11px] font-semibold text-slate-500 block leading-tight mt-0.5">
                        {roleTitle}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleLogout}
                    title="Đăng xuất khỏi hệ thống"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-all ml-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              );
            })()}
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100/70 relative">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
                  <UsersManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/inbound" element={<InboundOrdersPage />} />
            <Route path="/outbound" element={<OutboundOrdersPage />} />
            <Route path="/layout" element={<LocationLayoutPage />} />
            <Route path="/inventory" element={<InventoryBalancePage />} />
            <Route path="/audit" element={<AuditManagementPage />} />
            <Route path="/smartquery" element={<SmartAssistantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/operator" element={<OperatorPortalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
