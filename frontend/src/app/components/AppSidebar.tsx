import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Package,
  ScanLine,
  FileSpreadsheet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Truck,
  PackageCheck,
  ClipboardCheck,
  Printer,
  Boxes,
  Building2,
  Sparkles,
  X,
} from 'lucide-react';
import { AuthSession } from '../../features/auth/types';
import { isRouteAllowedForRole } from '../../features/users/data/rbacModulesData';

interface AppSidebarProps {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenScanner: () => void;
  session: AuthSession;
  currentTime?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: string;
  badge?: string;
}

interface NavGroup {
  sectionTitle?: string;
  items: NavItem[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isSidebarCollapsed,
  onToggleSidebar,
  isMobileOpen = false,
  onCloseMobile,
  onOpenScanner,
  session,
  currentTime,
}) => {
  const location = useLocation();
  const [, setRbacVersion] = React.useState(0);
  const [localTime, setLocalTime] = React.useState(() => currentTime || new Date().toLocaleTimeString('vi-VN'));

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleRbacUpdate = () => setRbacVersion((v) => v + 1);
    window.addEventListener('smart_wms_rbac_updated', handleRbacUpdate);
    return () => window.removeEventListener('smart_wms_rbac_updated', handleRbacUpdate);
  }, []);

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

  const isAdmin = session?.role?.toUpperCase().includes('ADMIN');
  const isManager = session?.role?.toUpperCase().includes('MANAGER');

  const navGroups: NavGroup[] = isAdmin
    ? [
        {
          sectionTitle: 'Quản Trị Hệ Thống',
          items: [
            { name: 'Tổng Quan Quản Trị', path: '/', icon: LayoutDashboard },
            { name: 'Tài Khoản & Phân Quyền', path: '/users', icon: ShieldCheck },
            { name: 'Mạng Lưới Chi Nhánh', path: '/warehouses', icon: Building2 },
            { name: 'Kora AI', path: '/smartquery', icon: Sparkles },
          ],
        },
        {
          sectionTitle: 'Giám Sát Vận Hành',
          items: [
            { name: 'Đơn Nhập Kho', path: '/inbound', icon: Truck },
            { name: 'Đơn Xuất Kho', path: '/outbound', icon: PackageCheck },
            { name: 'Tồn Kho & Thẻ Kho', path: '/inventory', icon: Package },
            { name: 'Kiểm Kê Kho Hàng', path: '/audit', icon: ClipboardCheck },
            { name: 'Sơ Đồ Mặt Bằng Ô Kệ', path: '/layout', icon: Layers },
            { name: 'Hàng Hóa & Danh Mục', path: '/products', icon: Boxes },
            { name: 'Báo Cáo & Thống Kê', path: '/reports', icon: FileSpreadsheet },
            { name: 'In Tem Mã Vạch & QR', path: '/labels', icon: Printer },
          ],
        },
      ]
    : isManager
    ? [
        {
          items: [{ name: 'Tổng Quan Vận Hành', path: '/', icon: LayoutDashboard }],
        },
        {
          sectionTitle: 'Vận Hành Nhập - Xuất',
          items: [
            { name: 'Đơn Nhập Kho', path: '/inbound', icon: Truck },
            { name: 'Đơn Xuất Kho', path: '/outbound', icon: PackageCheck },
          ],
        },
        {
          sectionTitle: 'Kho Bãi & Tồn Kho',
          items: [
            { name: 'Tồn Kho & Thẻ Kho', path: '/inventory', icon: Package },
            { name: 'Sơ Đồ Mặt Bằng Ô Kệ', path: '/layout', icon: Layers },
            { name: 'Kiểm Kê Kho Hàng', path: '/audit', icon: ClipboardCheck },
          ],
        },
        {
          sectionTitle: 'Danh Mục & Công Cụ',
          items: [
            { name: 'Hàng Hóa & Danh Mục', path: '/products', icon: Boxes },
            { name: 'Chi Nhánh Kho', path: '/warehouses', icon: Building2 },
            { name: 'In Tem Mã Vạch & QR', path: '/labels', icon: Printer },
          ],
        },
        {
          sectionTitle: 'Báo Cáo & Đội Ngũ',
          items: [
            { name: 'Kora AI', path: '/smartquery', icon: Sparkles },
            { name: 'Báo Cáo & Thống Kê', path: '/reports', icon: FileSpreadsheet },
            { name: 'Đội Ngũ Nhân Sự Kho', path: '/users', icon: ShieldCheck },
          ],
        },
      ]
    : [
        {
          sectionTitle: 'Hiện Trường Thực Địa',
          items: [
            { name: 'Máy Quét Mã Vạch PDA', path: '/operator', icon: Smartphone },
            { name: 'Tra Cứu Tồn Kho', path: '/inventory', icon: Package },
          ],
        },
      ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar (Desktop Static + Mobile Drawer) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 md:z-20 h-screen bg-[#0b1120] text-slate-300 flex flex-col border-r border-slate-800 shadow-2xl md:shadow-xl transition-all duration-200 ease-out select-none ${
          isMobileOpen
            ? 'translate-x-0 w-72 max-w-[85vw]'
            : '-translate-x-full md:translate-x-0'
        } ${isSidebarCollapsed ? 'md:w-16' : 'md:w-[220px]'}`}
      >
        {/* Brand Header */}
        <div
          className={`border-b border-slate-800/80 flex items-center bg-[#070b14] transition-all px-4 py-3.5 justify-between ${
            isSidebarCollapsed ? 'md:p-3 md:flex-col md:gap-2 md:justify-center' : ''
          }`}
        >
          <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'md:justify-center' : ''}`}>
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10 flex-shrink-0">
              <Boxes className="w-5 h-5 text-white" />
            </div>
            {(!isSidebarCollapsed || isMobileOpen) && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-white text-base tracking-tight leading-tight">SMART WMS</h1>
                <p className="text-[11px] text-slate-400 font-normal">Quản Lý Kho Doanh Nghiệp</p>
              </div>
            )}
          </div>

          {/* Close button for Mobile Drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Collapse button for Desktop */}
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Mở rộng menu (Ctrl+B)' : 'Thu gọn menu (Ctrl+B)'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 text-indigo-400" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-none">
          {navGroups.map((group, groupIdx) => {
            const visibleItems = group.items.filter((item) => {
              if (item.requiredRole && item.requiredRole !== session.role) {
                return false;
              }
              return isRouteAllowedForRole(item.path, session.role);
            });
            if (visibleItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1">
                {(!isSidebarCollapsed || isMobileOpen) && group.sectionTitle && (
                  <div className="px-3 pt-1 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {group.sectionTitle}
                  </div>
                )}

                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  if (isSidebarCollapsed && !isMobileOpen) {
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        title={item.name}
                        onClick={onCloseMobile}
                        className={`group relative flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-slate-900 border border-slate-700 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                          {item.name}
                        </div>
                      </Link>
                    );
                  }

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Quick Action Footer */}
        <div className="border-t border-slate-800/80 p-3 space-y-2">
          <button
            onClick={() => {
              if (onCloseMobile) onCloseMobile();
              onOpenScanner();
            }}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isSidebarCollapsed && !isMobileOpen
                ? 'h-10 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-slate-800/70 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
            }`}
            title="Mở Camera Quét Mã Barcode"
          >
            <ScanLine className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            {(!isSidebarCollapsed || isMobileOpen) && <span>Quét Barcode Camera</span>}
          </button>

          {(!isSidebarCollapsed || isMobileOpen) && (
            <div className="px-1 pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Trực tuyến</span>
              </div>
              <span>{localTime}</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
