import React from 'react';
import { Layers, Search, LayoutGrid, Eye, Building2, MapPin, CheckCircle2, Box } from 'lucide-react';
import { WarehouseItem } from '../../types';

interface LayoutHeaderProps {
  currentWarehouse: WarehouseItem | null;
  warehouses: WarehouseItem[];
  onSelectWarehouse: (code: string) => void;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
  zones: string[];
  statusFilter: 'ALL' | 'EMPTY' | 'OCCUPIED' | 'EXPIRING';
  onStatusFilterChange: (status: 'ALL' | 'EMPTY' | 'OCCUPIED' | 'EXPIRING') => void;
  viewMode: 'FLOOR_PLAN' | 'RACK_ELEVATION';
  onViewModeChange: (mode: 'FLOOR_PLAN' | 'RACK_ELEVATION') => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  counts: {
    total: number;
    empty: number;
    occupied: number;
    expiring: number;
  };
}

export const LayoutHeader: React.FC<LayoutHeaderProps> = ({
  currentWarehouse,
  warehouses,
  onSelectWarehouse,
  selectedZone,
  onSelectZone,
  zones,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchChange,
  counts,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* 1. Top row: Title + Current Warehouse Select + View Mode */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 ring-4 ring-blue-50 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Sơ Đồ Mặt Bằng & Vị Trí Ô Kệ
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {currentWarehouse?.code || 'WH01'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Phân cấp lưu trữ: Khu (Zone) • Dãy (Aisle) • Kệ (Rack) • Tầng (Shelf) • Ô Chứa (Bin)
            </p>
          </div>
        </div>

        {/* Right side controls: Warehouse switcher & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5 self-stretch lg:self-auto justify-between lg:justify-end">
          {/* Warehouse Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100/80 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={currentWarehouse?.code || 'WH01'}
              onChange={(e) => onSelectWarehouse(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer pr-1"
            >
              {warehouses.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1 text-xs">
            <button
              type="button"
              onClick={() => onViewModeChange('FLOOR_PLAN')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'FLOOR_PLAN'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Mặt Bằng 2D Kho</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('RACK_ELEVATION')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'RACK_ELEVATION'
                  ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Mặt Cắt Kệ Trực Diện</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: Quick Status Filter Pills (Lọc nhanh 1 chạm) */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
        <span className="text-slate-400 font-semibold mr-1">Lọc nhanh:</span>

        <button
          type="button"
          onClick={() => onStatusFilterChange('ALL')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <span>Tất Cả Ô Kệ</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
            {counts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('EMPTY')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'EMPTY'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Ô Còn Trống (Nhận hàng)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 font-mono">
            {counts.empty}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('OCCUPIED')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'OCCUPIED'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>Đang Chứa Hàng</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 font-mono">
            {counts.occupied}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onStatusFilterChange('EXPIRING')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            statusFilter === 'EXPIRING'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          <span>Cận Hạn Dùng FEFO</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 font-mono">
            {counts.expiring}
          </span>
        </button>
      </div>

      {/* 3. Bottom row: Search + Zone Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2 border-t border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Barcode ô kệ, mã SKU, tên hàng..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>

        {/* Zone Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium shrink-0">Phân khu:</span>
          <select
            value={selectedZone}
            onChange={(e) => onSelectZone(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="ALL">Toàn Bộ Phân Khu (Zone A, B, C)</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z === 'ZONE_B'
                  ? 'Khu B: Kho Mát (2-8°C)'
                  : z === 'ZONE_C'
                  ? 'Khu C: Hàng Giá Trị Cao & Điện Tử'
                  : 'Khu A: Hàng Khô & Tiêu Dùng'}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
