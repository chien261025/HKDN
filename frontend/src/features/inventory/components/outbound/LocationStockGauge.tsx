import React from 'react';
import { InventoryStats } from '../../types';
import { ShieldCheck } from 'lucide-react';

interface LocationStockGaugeProps {
  locationBarcode: string;
  stats: InventoryStats;
}

export const LocationStockGauge: React.FC<LocationStockGaugeProps> = ({
  locationBarcode,
  stats,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Số Dư Tại Ô Kệ (Location Stock Balance):
          </span>
          <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 text-xs">
            {locationBarcode}
          </span>
        </div>

        <span className="text-xs font-mono text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          LIVE SYNC
        </span>
      </div>

      {/* 3 Thẻ Chỉ Số Cân Đối & Dễ Đọc */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {/* On-Hand */}
        <div className="bg-slate-50 py-3.5 px-3 rounded-xl border border-slate-200 space-y-1">
          <span className="text-xs text-slate-600 block font-bold">Tồn Vật Lý (On-Hand)</span>
          <span className="text-2xl font-black font-mono text-slate-900 block tracking-tight">
            {stats.onHand}
          </span>
          <span className="text-xs text-slate-500 font-sans block font-medium">Hiện diện trên kệ</span>
        </div>

        {/* Reserved */}
        <div
          className={`py-3.5 px-3 rounded-xl border space-y-1 transition-all ${
            stats.reserved > 0
              ? 'bg-amber-50 border-amber-200 shadow-2xs'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-xs text-amber-800 block font-bold">Đã Cấp Phát (Allocated)</span>
          <span
            className={`text-2xl font-black font-mono block tracking-tight ${
              stats.reserved > 0 ? 'text-amber-700' : 'text-slate-400'
            }`}
          >
            {stats.reserved > 0 ? `+${stats.reserved}` : '0'}
          </span>
          <span className="text-xs text-slate-500 font-sans block font-medium">Khóa giữ đơn SO</span>
        </div>

        {/* Available */}
        <div className="bg-emerald-50 py-3.5 px-3 rounded-xl border border-emerald-200 space-y-1">
          <span className="text-xs text-emerald-800 block font-bold">Khả Dụng (Available - ATP)</span>
          <span className="text-2xl font-black font-mono text-emerald-700 block tracking-tight">
            {stats.available}
          </span>
          <span className="text-xs text-slate-500 font-sans block font-medium">Sẵn sàng xuất mới</span>
        </div>
      </div>

      {/* Chú thích công thức kỹ thuật tinh tế */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-800 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Quy tắc cân đối: <strong className="text-slate-900 font-mono">On-Hand = Allocated + Available</strong></span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
          Bảo vệ chống âm kho bằng khóa dòng bi quan (<span className="text-indigo-700 font-mono font-bold">SELECT ... FOR UPDATE</span>) trên PostgreSQL.
        </p>
      </div>
    </div>
  );
};
