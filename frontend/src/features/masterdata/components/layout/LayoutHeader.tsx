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
    <div className="group relative bg-white rounded-2xl p-5 border border-slate-200/90 space-y-4 shadow-xs overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500" />
      {/* Top row: Title + Zone Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50 flex-shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Sơ Đồ Không Gian Ô Kệ (Warehouse Topology)
              </h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold uppercase">
                DIGITAL TWIN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Mô hình trực quan: <span className="text-slate-800 font-bold">Khu (Zone)</span> •{' '}
              <span className="text-slate-800 font-bold">Dãy (Aisle)</span> •{' '}
              <span className="text-slate-800 font-bold">Kệ (Rack)</span> •{' '}
              <span className="text-slate-800 font-bold">Tầng (Shelf)</span> •{' '}
              <span className="text-indigo-600 font-bold">Ô Chứa (Bin)</span>
            </p>
          </div>
        </div>

        {/* Zone Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 gap-1 flex-wrap">
          <button
            onClick={() => onSelectZone('ZONE_A')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedZone === 'ZONE_A'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            Khu A: Hàng Khô & Điện Tử
          </button>
          <button
            onClick={() => onSelectZone('ZONE_B')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedZone === 'ZONE_B'
                ? 'bg-white text-cyan-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
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
            placeholder="Tìm theo Barcode (ZA-A01...), SKU, tên hàng..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
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
