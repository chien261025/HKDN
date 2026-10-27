import React from 'react';
import { Layers, Search } from 'lucide-react';
import { ZoneType } from '../../types';

interface LayoutHeaderProps {
  selectedZone: ZoneType;
  onSelectZone: (zone: ZoneType) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const LayoutHeader: React.FC<LayoutHeaderProps> = ({
  selectedZone,
  onSelectZone,
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 space-y-4 shadow-xs">
      {/* Top row: Title + Zone Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
                Sơ Đồ Vị Trí Ô Kệ (Digital Twin)
              </h1>
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                Kho Tổng Tân Bình
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Phân cấp lưu trữ: Khu (Zone) • Dãy (Aisle) • Kệ (Rack) • Tầng (Shelf) • Ô Chứa (Bin)
            </p>
          </div>
        </div>

        {/* Zone Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1 flex-wrap text-xs">
          <button
            onClick={() => onSelectZone('ZONE_A')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedZone === 'ZONE_A'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Khu A: Hàng Khô & Điện Tử
          </button>
          <button
            onClick={() => onSelectZone('ZONE_B')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
              selectedZone === 'ZONE_B'
                ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Khu B: Kho Mát (2-8°C)
          </button>
        </div>
      </div>

      {/* Bottom row: Search + Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Barcode, SKU, tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-600"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Ô Trống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
            Đang Chứa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            Khóa Giữ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Cận Date (FEFO)
          </span>
        </div>
      </div>
    </div>
  );
};
