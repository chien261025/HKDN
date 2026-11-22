import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShieldCheck,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  Menu,
  BookOpen,
  ExternalLink,
  MapPin,
  ChevronDown,
  Check,
  Building2,
  Plus,
  Clock,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthSession } from '../../features/auth/types';
import { NotificationCenterDropdown } from '../../features/notifications/components/NotificationCenterDropdown';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../features/masterdata/services/warehouseService';
import { warehouseShiftService } from '../../features/masterdata/services/warehouseShiftService';
import { WarehouseShiftModal } from '../../features/masterdata/components/WarehouseShiftModal';

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
  const navigate = useNavigate();
  const [warehouseList, setWarehouseList] = useState<any[]>([
    { id: 'ALL', code: 'ALL', name: 'Toàn bộ chi nhánh kho', shortName: 'Toàn bộ kho' },
    ...DEFAULT_WAREHOUSES.map((w) => ({ id: w.code, code: w.code, name: w.name, shortName: w.shortName || w.name })),
  ]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    return localStorage.getItem('smart_wms_active_warehouse') || 'ALL';
  });
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const currentShift = warehouseShiftService.getCurrentShift();
  const warehouseRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Hỗ trợ phím tắt Ctrl+K để focus nhanh vào thanh tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGlobalSearchChange = (val: string) => {
    setGlobalSearch(val);
    window.dispatchEvent(new CustomEvent('smart_wms_global_search', { detail: val }));
  };

  const handleGlobalSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      window.dispatchEvent(new CustomEvent('smart_wms_global_search', { detail: globalSearch }));
      const pagesWithOwnSearch = ['/inbound', '/outbound', '/inventory', '/products', '/users', '/audit', '/staging'];
      const hasOwnSearch = pagesWithOwnSearch.some((p) => location.pathname.startsWith(p));
      if (!hasOwnSearch) {
        navigate('/inventory');
      }
    }
  };

  useEffect(() => {
    const handleSync = (e: any) => {
      if (typeof e.detail === 'string' && e.detail !== globalSearch) {
        setGlobalSearch(e.detail);
      }
    };
    window.addEventListener('smart_wms_sync_search_input', handleSync);
    return () => window.removeEventListener('smart_wms_sync_search_input', handleSync);
  }, [globalSearch]);

  useEffect(() => {
    const loadWarehouses = async () => {
      const list = await warehouseService.getWarehouses();
      setWarehouseList([
        { id: 'ALL', code: 'ALL', name: 'Toàn bộ chi nhánh kho', shortName: 'Toàn bộ kho' },
        ...list.map((w) => ({ id: w.code, code: w.code, name: w.name, shortName: w.shortName || w.name })),
      ]);
    };
    loadWarehouses();

    const handleWhUpdate = () => loadWarehouses();
    const handleWhChange = (e: any) => {
      setSelectedWarehouseId(e.detail || localStorage.getItem('smart_wms_active_warehouse') || 'ALL');
    };

    window.addEventListener('smart_wms_warehouses_updated', handleWhUpdate);
    window.addEventListener('smart_wms_warehouse_changed', handleWhChange);

    const handleClickOutside = (e: MouseEvent) => {
      if (warehouseRef.current && !warehouseRef.current.contains(e.target as Node)) {
        setIsWarehouseOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('smart_wms_warehouses_updated', handleWhUpdate);
      window.removeEventListener('smart_wms_warehouse_changed', handleWhChange);
    };
  }, []);

  const handleSelectWarehouse = (id: string) => {
    setSelectedWarehouseId(id);
    warehouseService.setActiveWarehouseId(id);
    setIsWarehouseOpen(false);
  };

  const activeWarehouse = warehouseList.find((w) => w.id === selectedWarehouseId || w.code === selectedWarehouseId) || warehouseList[0];

  const isSuperAdmin = session.role === 'ROLE_ADMIN';

  const routeTitles: Record<string, string> = {
    '/': isSuperAdmin ? 'Tổng Quan Quản Trị' : 'Trung Tâm Điều Hành',
    '/users': isSuperAdmin ? 'Tài Khoản & Phân Quyền' : 'Đội Ngũ Nhân Sự Kho',
    '/products': 'Sản Phẩm & Nhà Cung Cấp',
    '/warehouses': 'Chi Nhánh Kho Hàng',
    '/inbound': 'Quản Lý Nhập Kho (PO)',
    '/outbound': 'Quản Lý Xuất Kho (SO)',
    '/layout': 'Sơ Đồ Mặt Bằng Ô Kệ',
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

        {/* Breadcrumb Title */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 truncate">
          <span className="hidden sm:inline text-slate-400">Smart WMS</span>
          <ChevronRight className="hidden sm:inline w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-800 font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 truncate text-xs sm:text-sm">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Search Bar - Global Synchronized with Ctrl+K */}
      <div className="hidden lg:flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={globalSearch}
            onChange={(e) => handleGlobalSearchChange(e.target.value)}
            onKeyDown={handleGlobalSearchKeyDown}
            placeholder="Tìm nhanh SKU, mã vạch, ô kệ..."
            className="w-full pl-9 pr-14 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-50 transition-all font-normal"
          />
          {globalSearch ? (
            <button
              onClick={() => handleGlobalSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs cursor-pointer"
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
          ) : (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
              <span>Ctrl</span>
              <span>K</span>
            </div>
          )}
        </div>
      </div>

      {/* Right User Profile, Warehouse Selector & Notifications */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Nút Xem Ca Trực & Sổ Giao Ban Ca */}
        <button
          type="button"
          onClick={() => setIsShiftModalOpen(true)}
          className="hidden md:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          title="Xem thông tin ca trực và sổ giao ban ca kho"
        >
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="font-bold text-slate-900">{currentShift.name}</span>
          <span className="text-slate-400 font-mono text-[11px]">({currentShift.startTime}-{currentShift.endTime})</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5"></span>
        </button>

        {/* Warehouse Branch Selector (Bộ Chọn Chi Nhánh Kho Hàng) */}
        <div ref={warehouseRef} className="relative">
          <button
            type="button"
            onClick={() => setIsWarehouseOpen(!isWarehouseOpen)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Chọn chi nhánh kho hàng đang vận hành"
          >
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[170px]">{activeWarehouse.name}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          </button>

          {isWarehouseOpen && (
            <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50 animate-in fade-in duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                <span>Hệ Thống Chi Nhánh Kho</span>
                <span className="text-blue-600 font-mono">{warehouseList.length - 1} Kho</span>
              </div>
              <div className="py-1 max-h-64 overflow-y-auto">
                {warehouseList.map((wh) => (
                  <button
                    key={wh.id}
                    onClick={() => handleSelectWarehouse(wh.id)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-blue-50/50 transition-colors cursor-pointer text-xs ${
                      selectedWarehouseId === wh.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          selectedWarehouseId === wh.id ? 'text-blue-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{wh.name}</span>
                    </div>
                    {selectedWarehouseId === wh.id && (
                      <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-slate-100 p-1.5 mt-1 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => {
                    setIsWarehouseOpen(false);
                    navigate('/warehouses');
                  }}
                  className="w-full py-1.5 px-2.5 rounded-lg text-xs font-bold text-blue-600 hover:bg-blue-100/70 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Quản lý & Thêm chi nhánh kho</span>
                </button>
              </div>
            </div>
          )}
        </div>

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

      {/* Sổ Ca Làm Việc & Bàn Giao Ca Kho Bãi Modal */}
      <WarehouseShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        activeWarehouseName={activeWarehouse.name}
        activeWarehouseId={activeWarehouse.code || activeWarehouse.id}
      />
    </header>
  );
};
