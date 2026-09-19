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
    <div className="flex h-screen bg-[#070b14] text-slate-100 font-sans overflow-hidden relative">
      {/* Ambient background light glows - Rực rỡ & có chiều sâu */}
      <div className="fixed top-0 left-1/4 w-[550px] h-[550px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-[550px] h-[550px] bg-cyan-500/15 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      <div className="fixed top-1/2 right-1/3 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {/* Cyber Sidebar Navigation - Có thể thu gọn/mở rộng linh hoạt */}
      <aside
        className={`${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        } bg-[#0c1220]/95 backdrop-blur-2xl text-slate-200 flex flex-col border-r border-slate-700/80 shadow-2xl relative z-20 transition-all duration-300 ease-in-out`}
      >
        {/* Brand Header */}
        <div
          className={`border-b border-slate-700/80 flex items-center transition-all bg-slate-900/40 ${
            isSidebarCollapsed ? 'p-3 flex-col gap-2 justify-center' : 'p-4 justify-between'
          }`}
        >
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                W
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0d121f] rounded-full animate-ping"></span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0d121f] rounded-full"></span>
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-white text-base tracking-wide whitespace-nowrap">SMART WMS</h1>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium tracking-tight whitespace-nowrap">Hệ Thống Quản Lý Kho</p>
              </div>
            )}
          </div>

          {/* Nút thu nhỏ / mở rộng sidebar */}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? "Mở rộng menu (Ctrl+B)" : "Thu gọn menu (Ctrl+B)"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-cyan-400" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Quick System Telemetry Pulse */}
        <div
          className={`bg-slate-900/60 border-b border-slate-800/50 flex items-center text-[11px] ${
            isSidebarCollapsed ? 'py-2 justify-center' : 'px-4 py-2.5 justify-between'
          }`}
          title={`Hệ thống Online • ${currentTime}`}
        >
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse flex-shrink-0" />
            {!isSidebarCollapsed && <span>Hệ Thống Online</span>}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-1 font-mono text-slate-400 text-[10px]">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>{currentTime}</span>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto overflow-x-hidden">
          {!isSidebarCollapsed && (
            <p className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
                      ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-600/40 border border-indigo-400/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />

                  {/* Tooltip nổi khi rê chuột vào chế độ thu nhỏ */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs font-bold rounded-lg shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 flex items-center gap-2">
                    <span>{item.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/50">
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
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-600/40 border border-indigo-400/50'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800/90 text-slate-300 group-hover:text-cyan-300 group-hover:bg-slate-700'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{item.name}</span>
                </div>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 border border-slate-700 group-hover:text-slate-200 group-hover:border-slate-600'}`}>
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Infrastructure Nodes Status Widget */}
        {!isSidebarCollapsed ? (
          <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-indigo-400" /> Cụm Hạ Tầng Live</span>
              <span className="text-emerald-400">100% HEALTHY</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
              <div className="p-1.5 rounded bg-slate-800/60 flex items-center justify-between border border-slate-700/40">
                <span className="text-slate-400">PostgreSQL</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="p-1.5 rounded bg-slate-800/60 flex items-center justify-between border border-slate-700/40">
                <span className="text-slate-400">RabbitMQ</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="p-1.5 rounded bg-slate-800/60 flex items-center justify-between border border-slate-700/40">
                <span className="text-slate-400">MinIO S3</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="p-1.5 rounded bg-slate-800/60 flex items-center justify-between border border-slate-700/40">
                <span className="text-slate-400">Pessimistic</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-2.5 mx-auto mb-2 text-center" title="Cụm Hạ Tầng: 100% HEALTHY">
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* Quét Barcode Action Button */}
        <div className={`border-t border-slate-800/80 ${isSidebarCollapsed ? 'p-3 flex justify-center' : 'p-3.5'}`}>
          <button
            onClick={() => setShowScanner(true)}
            title="Mở Camera Quét Mã Barcode"
            className={`${
              isSidebarCollapsed
                ? 'w-11 h-11 justify-center'
                : 'w-full justify-center gap-2.5 py-2.5 px-3'
            } flex items-center bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/30 hover:to-indigo-600/30 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/20 group cursor-pointer`}
          >
            <ScanLine className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform flex-shrink-0" />
            {!isSidebarCollapsed && <span>Mở Camera Quét Mã Barcode</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Futuristic Top Header Bar - Nổi bật & Sắc sảo */}
        <header className="h-16 bg-[#0c1220]/90 backdrop-blur-xl border-b border-slate-700/80 px-4 md:px-6 flex items-center justify-between shadow-lg gap-3">
          {/* Nút bật/tắt Sidebar trên thanh Header */}
          <button
            onClick={toggleSidebar}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-all cursor-pointer flex-shrink-0"
            title={isSidebarCollapsed ? "Mở rộng thanh menu bên trái (Ctrl+B)" : "Thu nhỏ thanh menu bên trái (Ctrl+B)"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Search bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhanh SKU, mã vạch Barcode, ô kệ (VD: ZA-A01, SKU-MILK)..."
                className="w-full pl-9 pr-12 py-1.5 bg-slate-950/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium shadow-inner"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right quick telemetry & User profile */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/50 text-emerald-300 text-xs font-bold shadow-sm shadow-emerald-950/40">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Chống Âm Kho: Pessimistic Locked</span>
            </div>

            <button className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0c1220]"></span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                title="Xem hồ sơ cá nhân và đổi mật khẩu"
                className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 text-white font-black flex items-center justify-center text-xs shadow-md shadow-indigo-500/30 border border-white/20 group-hover:scale-105 transition-transform">
                    {session.fullName
                      ? session.fullName
                          .split(' ')
                          .map((n: string) => n[0])
                          .slice(-2)
                          .join('')
                      : 'TK'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0c1220] rounded-full"></span>
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {session.fullName || 'Trần Trưởng Kho'}
                  </p>
                  <span className="text-[10px] font-mono text-indigo-300 font-bold">
                    {session.role || 'ROLE_ADMIN'}
                  </span>
                </div>
              </button>

              <button
                onClick={handleLogout}
                title="Đăng xuất khỏi hệ thống"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-xl border border-slate-700 transition-all ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-6 bg-transparent relative">
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
