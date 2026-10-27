import React from 'react';
import {
  Search,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { AuthSession } from '../../features/auth/types';
import { NotificationCenterDropdown } from '../../features/notifications/components/NotificationCenterDropdown';

interface AppHeaderProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  session: AuthSession;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  onToggleMobileSidebar,
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
    '/smartquery': 'Truy Vấn Dữ Liệu',
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
    <header className="h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 md:px-6 flex items-center justify-between shadow-xs gap-2 md:gap-3 sticky top-0 z-30">
      {/* Mobile Hamburger & Desktop Toggle & Breadcrumbs */}
      <div className="flex items-center gap-2 md:gap-3 truncate">
        {/* Mobile Menu Button */}
        <button
          onClick={onToggleMobileSidebar}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors md:hidden cursor-pointer shrink-0"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>

        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleSidebar}
          className="hidden md:flex p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer shrink-0"
          title={isSidebarCollapsed ? "Mở rộng thanh menu (Ctrl+B)" : "Thu nhỏ thanh menu (Ctrl+B)"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 text-indigo-600" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>

        <div className="flex items-center gap-1.5 md:gap-2 text-xs font-semibold text-slate-500 truncate">
          <span className="hidden sm:inline text-slate-400">Kho Vận</span>
          <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 truncate text-xs sm:text-sm">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Search Bar - hidden on mobile to avoid overflow */}
      <div className="hidden lg:flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm nhanh SKU, mã vạch, ô kệ..."
            className="w-full pl-9 pr-14 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-3 focus:ring-indigo-50 transition-all font-normal"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right User Profile & Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <NotificationCenterDropdown />

        {/* Profile badge with safe UTF-8 fallback */}
        <div className="flex items-center gap-1.5 sm:gap-3 pl-1.5 sm:pl-3 border-l border-slate-200">
          <button
            type="button"
            onClick={onOpenProfile}
            title="Xem hồ sơ cá nhân và đổi mật khẩu"
            className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
          >
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs tracking-wider shadow-xs group-hover:scale-105 transition-transform ring-2 ring-indigo-50">
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
            className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
