import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Package,
  ScanLine,
  Bot,
  FileSpreadsheet,
  ShieldCheck,
  Cpu,
  Clock,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Truck,
  PackageCheck,
  ClipboardCheck
} from 'lucide-react';
import { AuthSession } from '../../features/auth/types';

interface AppSidebarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onOpenScanner: () => void;
  session: AuthSession;
  currentTime: string;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onOpenScanner,
  session,
  currentTime,
}) => {
  const location = useLocation();

  // Phím tắt Ctrl+B hoặc Cmd+B để thu gọn/mở rộng menu nhanh
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        onToggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleSidebar]);

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

  // Lọc menu theo vai trò người dùng
  const navItems = allNavItems.filter((item) => !item.requiredRole || item.requiredRole === session.role);

  return (
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
            <img src="/favicon.svg" alt="Smart WMS" className="w-10 h-10 rounded-xl shadow-xs" />
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
          onClick={onToggleSidebar}
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
          onClick={onOpenScanner}
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

      {/* Copyright mark */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-2 border-t border-slate-100 text-center text-[10px] text-slate-400 font-medium">
          © 2026 Smart WMS • Bản quyền đã bảo hộ
        </div>
      )}
    </aside>
  );
};
