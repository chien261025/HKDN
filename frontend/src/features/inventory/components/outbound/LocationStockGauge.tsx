import React from 'react';
import { InventoryStats } from '../../types';

interface LocationStockGaugeProps {
  locationBarcode: string;
  stats: InventoryStats;
}

export const LocationStockGauge: React.FC<LocationStockGaugeProps> = ({
  locationBarcode,
  stats,
}) => {
  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Tồn kho ô kệ {locationBarcode}
        </span>
        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          LIVE
        </span>
      </div>

      {/* 3 Chỉ số lớn, rõ ràng */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* On-Hand */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 block font-medium">Vật lý (On-Hand)</span>
          <span className="text-lg font-extrabold font-mono text-white mt-1 block">
            {stats.onHand}
          </span>
          <span className="text-[9px] text-slate-500">Trên kệ</span>
        </div>

        {/* Reserved */}
        <div
          className={`p-3 rounded-xl border transition-all ${
            stats.reserved > 0
              ? 'bg-amber-950/20 border-amber-500/40'
              : 'bg-slate-950/60 border-slate-800'
          }`}
        >
          <span className="text-[10px] text-amber-300 block font-medium">Đang giữ (Reserved)</span>
          <span
            className={`text-lg font-extrabold font-mono mt-1 block ${
              stats.reserved > 0 ? 'text-amber-400' : 'text-slate-400'
            }`}
          >
            {stats.reserved > 0 ? `+${stats.reserved}` : '0'}
          </span>
          <span className="text-[9px] text-slate-500">Đơn chờ</span>
        </div>

        {/* Available */}
        <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/30">
          <span className="text-[10px] text-emerald-300 block font-medium">Khả dụng (Available)</span>
          <span className="text-lg font-extrabold font-mono text-emerald-400 mt-1 block">
            {stats.available}
          </span>
          <span className="text-[9px] text-slate-500">Được bán</span>
        </div>
      </div>

      {/* Chú thích ngắn gọn */}
      <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 font-mono">
        💡 Cơ chế: <span className="text-indigo-300 font-semibold">On-Hand = Reserved + Available</span>. Khóa dữ liệu bằng câu lệnh SELECT FOR UPDATE bảo đảm không bao giờ âm kho.
      </p>
    </div>
  );
};
