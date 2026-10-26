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
  ClipboardCheck,
  Printer
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
    { name: 'Trung Tâm Điều Hành', path: '/', icon: LayoutDashboard },
    { name: 'Tài Khoản & Phân Quyền', path: '/users', icon: ShieldCheck, badge: 'ADMIN', requiredRole: 'ROLE_ADMIN' },
    { name: 'Sản Phẩm & Nhà Cung Cấp', path: '/products', icon: Package },
    { name: 'Đơn Nhập Kho', path: '/inbound', icon: Truck },
    { name: 'Đơn Xuất Kho', path: '/outbound', icon: PackageCheck },
    { name: 'Sơ Đồ Vị Trí Ô Kệ', path: '/layout', icon: Layers },
    { name: 'Quản Lý Tồn Kho', path: '/inventory', icon: Package },
    { name: 'Kiểm Kê Kho Hàng', path: '/audit', icon: ClipboardCheck },
    { name: 'In Tem Mã Vạch & QR', path: '/labels', icon: Printer, badge: 'NEW' },
    { name: 'Trợ Lý AI Tra Cứu', path: '/smartquery', icon: Bot, badge: 'AI' },
    { name: 'Báo Cáo & Thống Kê', path: '/reports', icon: FileSpreadsheet },
    { name: 'Giao Diện Quét Mã PDA', path: '/operator', icon: Smartphone, badge: 'PDA' },
  ];

  // Lọc menu theo vai trò người dùng
  const navItems = allNavItems.filter((item) => !item.requiredRole || item.requiredRole === session.role);

  return (
    <aside
      className={`${
        isSidebarCollapsed ? 'w-20' : 'w-72'
      } bg-[#0c1222] text-slate-300 flex flex-col border-r border-slate-800/80 shadow-2xl relative z-20 transition-all duration-300 ease-in-out`}
    >
      {/* Brand Header */}
      <div
        className={`border-b border-slate-800/80 flex items-center transition-all bg-[#080d19] ${
          isSidebarCollapsed ? 'p-3 flex-col gap-2 justify-center' : 'p-4 justify-between'
        }`}
      >
        <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="relative flex-shrink-0">
            <img src="/favicon.svg" alt="Smart WMS" className="w-10 h-10 rounded-xl shadow-md ring-1 ring-white/10" />
          </div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-lg tracking-tight whitespace-nowrap">SMART WMS</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO</span>
              </div>
              <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Hệ Thống Quản Lý Kho</p>
            </div>
          )}
        </div>

        {/* Nút thu nhỏ / mở rộng sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          title={isSidebarCollapsed ? "Mở rộng menu (Ctrl+B)" : "Thu gọn menu (Ctrl+B)"}
        >
          {isSidebarCollapsed ? (
            <ChevronRight className="w-5 h-5 text-indigo-400" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Quick System Status */}
      <div
        className={`bg-[#0a0f1d] border-b border-slate-800/60 flex items-center text-xs ${
          isSidebarCollapsed ? 'py-2 justify-center' : 'px-4 py-2.5 justify-between'
        }`}
        title={`Hệ thống Online • ${currentTime}`}
      >
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {!isSidebarCollapsed && <span className="text-slate-300">Hệ Thống Online</span>}
        </div>
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-1.5 font-mono text-slate-400 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime}</span>
          </div>
        )}
      </div>

      {/* Menu Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
        {!isSidebarCollapsed && (
          <p className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40 ring-1 ring-indigo-400/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-5 h-5" />

                {/* Tooltip nổi khi rê chuột vào chế độ thu nhỏ */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 border border-slate-750 text-white text-xs font-bold rounded-lg shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 flex items-center gap-2">
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {item.badge}
                    </span>
                  )}
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
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-indigo-900/50 border border-indigo-400/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <div className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-800/80 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-800'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate text-sm">{item.name}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                  isActive 
                    ? 'bg-white/20 text-white' 
                    : 'bg-slate-800 text-slate-400 border border-slate-700/80 group-hover:text-slate-300'
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Streamlined System Status */}
      {!isSidebarCollapsed ? (
        <div className="px-3.5 py-2.5 mx-3 mb-2 rounded-xl bg-[#090e1a] border border-slate-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="text-slate-400 font-medium text-xs">Hệ Thống Trực Tuyến</span>
          </div>
          <span className="font-mono text-[11px] text-indigo-400 font-bold">v2.4 Pro</span>
        </div>
      ) : (
        <div className="py-2 mx-auto mb-2 text-center" title="Hệ Thống Trực Tuyến">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
        </div>
      )}

      {/* Quét Barcode Action Button */}
      <div className={`border-t border-slate-800/80 ${isSidebarCollapsed ? 'p-3 flex justify-center' : 'p-3'}`}>
        <button
          onClick={onOpenScanner}
          title="Mở Camera Quét Mã Barcode"
          className={`${
            isSidebarCollapsed
              ? 'w-10 h-10 justify-center'
              : 'w-full justify-center gap-2 py-2 px-3'
          } flex items-center bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-sm group cursor-pointer`}
        >
          <ScanLine className="w-4 h-4 text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0" />
          {!isSidebarCollapsed && <span>Mở Camera Quét Barcode</span>}
        </button>
      </div>

      {/* Copyright mark */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-2 border-t border-slate-800/50 text-center text-[10px] text-slate-400 font-medium">
          © 2026 Smart WMS • Enterprise Edition
        </div>
      )}
    </aside>
  );
};
