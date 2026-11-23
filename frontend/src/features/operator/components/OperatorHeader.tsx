import React, { useState } from 'react';
import {
  Smartphone,
  Wifi,
  BatteryCharging,
  ScanLine,
  ArrowLeft,
  LogOut,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Radio,
  Zap,
  Barcode,
  Search,
} from 'lucide-react';
import { authService } from '../../auth/services/authService';
import { warehouseShiftService } from '../../masterdata/services/warehouseShiftService';
import { Link } from 'react-router-dom';

interface OperatorHeaderProps {
  onOpenScanner: () => void;
  viewMode?: 'PDA' | 'EXPANDED';
  onToggleViewMode?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  onToggleToolbox?: () => void;
  isToolboxOpen?: boolean;
  onQuickSearchBarcode?: (code: string) => void;
}

export const OperatorHeader: React.FC<OperatorHeaderProps> = ({
  onOpenScanner,
  viewMode = 'EXPANDED',
  onToggleViewMode,
  soundEnabled = true,
  onToggleSound,
  onToggleToolbox,
  isToolboxOpen = false,
  onQuickSearchBarcode,
}) => {
  const [quickInput, setQuickInput] = useState('');
  const currentShift = warehouseShiftService.getCurrentShift();

  // Đọc thông tin người dùng từ phiên đăng nhập thực tế
  const sessionStr = localStorage.getItem('smart_wms_session');
  const session = sessionStr
    ? JSON.parse(sessionStr)
    : {
        fullName: 'Lê Thủ Kho',
        role: 'ROLE_OPERATOR',
        username: 'operator01',
      };

  const handleLogout = () => {
    authService.logout();
  };

  const initials = session.fullName
    ? session.fullName
        .split(' ')
        .map((n: string) => n[0])
        .slice(-2)
        .join('')
    : 'TK';

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quickInput.trim()) {
      e.preventDefault();
      onQuickSearchBarcode?.(quickInput.trim());
      setQuickInput('');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs select-none">
      {/* Top Telemetry Line (Zebra TC21 & Warehouse Shift Status) */}
      <div className="bg-slate-900 text-slate-300 px-4 py-1.5 text-xs font-mono flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Smartphone className="w-3.5 h-3.5" />
            <span>Zebra TC21 Enterprise (Wedge HID)</span>
          </div>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5 text-blue-400 font-medium hidden sm:flex">
            <Wifi className="w-3.5 h-3.5" />
            <span>Kho Tổng Tân Bình (WH01)</span>
          </div>
          <span className="text-slate-600 hidden md:inline">•</span>
          <div className="text-amber-400 font-medium hidden md:block">
            <span>{currentShift.name} ({currentShift.startTime} - {currentShift.endTime})</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onToggleSound && (
            <button
              type="button"
              onClick={onToggleSound}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title={soundEnabled ? 'Âm báo súng quét: ĐANG BẬT' : 'Âm báo súng quét: ĐÃ TẮT'}
            >
              {soundEnabled ? <Volume2 className="w-3 h-3 text-emerald-400" /> : <VolumeX className="w-3 h-3 text-slate-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'BẬT ÂM' : 'TẮT ÂM'}</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>95%</span>
          </div>
        </div>
      </div>

      {/* Main Navigation & Tool Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Branding & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
            W
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
                CỔNG THỦ KHO HIỆN TRƯỜNG
              </h1>
              <span className="hidden md:inline-flex text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                Zebra Terminal
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              Bến Staging • Lưu Kho • Nhặt FEFO • Chuyển Kệ • Kiểm Kê
            </p>
          </div>
        </div>

        {/* Center: Global Barcode Scanner Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-md mx-2">
          <div className="relative flex-1">
            <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Quét hoặc gõ Barcode PO, SKU, Ô kệ... [Enter]"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 font-semibold text-slate-900 transition-all placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            title="Bật máy quét camera barcode (F1 hoặc Ctrl+K)"
          >
            <ScanLine className="w-4 h-4" />
            <span>Quét Camera</span>
          </button>
        </div>

        {/* Right: Actions, Layout Toggle, User Profile & Exit */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Scanner Button on Mobile */}
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Bật máy quét camera barcode"
          >
            <ScanLine className="w-4 h-4" />
            <span className="hidden sm:inline">Quét Mã</span>
          </button>

          {/* Toggle View Mode: Console / Kiosk vs PDA Handheld */}
          {onToggleViewMode && (
            <button
              type="button"
              onClick={onToggleViewMode}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title={viewMode === 'PDA' ? 'Chuyển sang chế độ Trạm Làm Việc Toàn Màn Hình' : 'Chuyển sang chế độ Giả Lập Cầm Tay Zebra TC21'}
            >
              {viewMode === 'PDA' ? (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Trạm Làm Việc</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Chế Độ PDA</span>
                </>
              )}
            </button>
          )}

          {/* Toggle Barcode Reference & Scan Audit Drawer */}
          {onToggleToolbox && (
            <button
              type="button"
              onClick={onToggleToolbox}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isToolboxOpen
                  ? 'bg-slate-200 text-slate-900 border-slate-400 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title="Mở nhật ký quét và danh mục mã tham chiếu hiện trường"
            >
              <Barcode className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden md:inline">Nhật Ký & Mã Nhanh</span>
            </button>
          )}

          {/* Operator Chip */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 font-extrabold text-xs flex items-center justify-center border border-blue-200">
              {initials}
            </div>
            <div className="text-left hidden xl:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {session.fullName || 'Lê Thủ Kho'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium leading-tight">
                @{session.username || 'operator01'} • Thủ kho
              </div>
            </div>
          </div>

          {/* Exit to Web Admin */}
          <Link
            to="/"
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs transition-colors flex items-center gap-1"
            title="Quay lại Giao diện Quản Lý Kho (Web Admin)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold">Tháp Chỉ Huy</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs transition-colors cursor-pointer"
            title="Đăng xuất khỏi ca làm việc"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
