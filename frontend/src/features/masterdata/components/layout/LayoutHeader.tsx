import React from 'react';
import { Layers, Search, MapPin } from 'lucide-react';
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
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3.5 shadow-sm">
      {/* Top row: Title + Zone Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Sơ Đồ Không Gian Ô Kệ (Warehouse Topology)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Mô hình trực quan: <span className="text-slate-300 font-medium">Khu (Zone)</span> •{' '}
              <span className="text-slate-300 font-medium">Dãy (Aisle)</span> •{' '}
              <span className="text-slate-300 font-medium">Kệ (Rack)</span> •{' '}
              <span className="text-slate-300 font-medium">Tầng (Shelf)</span> •{' '}
              <span className="text-cyan-300 font-medium">Ô Chứa (Bin)</span>
            </p>
          </div>
        </div>

        {/* Zone Buttons */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onSelectZone('ZONE_A')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedZone === 'ZONE_A'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Khu A: Hàng Khô & Điện Tử
          </button>
          <button
            onClick={() => onSelectZone('ZONE_B')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedZone === 'ZONE_B'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Khu B: Kho Mát (2-8°C)
          </button>
        </div>
      </div>

      {/* Bottom row: Search + Legend */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo Barcode (ZA-A01...), SKU, tên hàng..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Ô Trống
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Đang Chứa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Khóa Giữ
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Cận Date (FEFO)
          </span>
        </div>
      </div>
    </div>
  );
};
