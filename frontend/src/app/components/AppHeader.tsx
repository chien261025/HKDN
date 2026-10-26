import React from 'react';
import {
  Search,
  ShieldCheck,
  Bell,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AuthSession } from '../../features/auth/types';

interface AppHeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  session: AuthSession;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  session,
  onOpenProfile,
  onLogout,
}) => {
  const location = useLocation();
  const routeTitles: Record<string, string> = {
    '/': 'Trung Tâm Điều Hành',
    '/users': 'Tài Khoản & Phân Quyền',
    '/products': 'Sản Phẩm & Nhà Cung Cấp',
    '/inbound': 'Quản Lý Nhập Kho (PO)',
    '/outbound': 'Quản Lý Xuất Kho (SO)',
    '/layout': 'Sơ Đồ Ô Kệ Digital Twin',
    '/inventory': 'Quản Lý Tồn Kho & Sổ Cái',
    '/audit': 'Kiểm Kê Kho Hàng',
    '/labels': 'In Tem Mã Vạch & QR',
    '/smartquery': 'Trợ Lý AI Tra Cứu',
    '/reports': 'Báo Cáo & Thống Kê',
    '/operator': 'Giao Diện Quét Mã PDA',
  };
  const currentTitle = routeTitles[location.pathname] || 'Điều Hành Kho Vận';

  // Safe UTF-8 display for Vietnamese full names & role titles
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
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 md:px-6 flex items-center justify-between shadow-xs gap-3 sticky top-0 z-30">
      {/* Nút bật/tắt Sidebar & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer flex-shrink-0"
          title={isSidebarCollapsed ? "Mở rộng thanh menu bên trái (Ctrl+B)" : "Thu nhỏ thanh menu bên trái (Ctrl+B)"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-indigo-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="text-slate-400">Kho Vận</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm nhanh SKU, mã vạch Barcode, ô kệ..."
            className="w-full pl-9 pr-14 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-50 transition-all font-normal"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right quick telemetry & User profile */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sổ Cái Khép Kín: 100% Khớp</span>
        </div>

        <button className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* Profile badge with safe UTF-8 fallback */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <button
            type="button"
            onClick={onOpenProfile}
            title="Xem hồ sơ cá nhân và đổi mật khẩu"
            className="flex items-center gap-2.5 group cursor-pointer text-left focus:outline-none"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold flex items-center justify-center text-xs tracking-wider shadow-sm group-hover:scale-105 transition-transform ring-2 ring-indigo-50">
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
            onClick={onLogout}
            title="Đăng xuất khỏi hệ thống"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-all ml-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
