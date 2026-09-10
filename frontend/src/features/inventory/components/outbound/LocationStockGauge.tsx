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
    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Tồn kho tại ô:
          </span>
          <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 text-xs">
            {locationBarcode}
          </span>
        </div>

        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          REAL-TIME
        </span>
      </div>

      {/* 3 Thẻ Chỉ Số Cân Đối & Dễ Đọc */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {/* On-Hand */}
        <div className="bg-slate-950/70 py-3 px-2 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[11px] text-slate-400 block font-medium">Tồn Vật Lý</span>
          <span className="text-xl font-extrabold font-mono text-white block tracking-tight">
            {stats.onHand}
          </span>
          <span className="text-[10px] text-slate-500 font-sans block">Trên kệ hàng</span>
        </div>

        {/* Reserved */}
        <div
          className={`py-3 px-2 rounded-xl border space-y-1 transition-all ${
            stats.reserved > 0
              ? 'bg-amber-950/30 border-amber-500/50 shadow-sm'
              : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          <span className="text-[11px] text-amber-300/90 block font-medium">Đang Giữ</span>
          <span
            className={`text-xl font-extrabold font-mono block tracking-tight ${
              stats.reserved > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'
            }`}
          >
            {stats.reserved > 0 ? `+${stats.reserved}` : '0'}
          </span>
          <span className="text-[10px] text-slate-500 font-sans block">Khóa cho đơn</span>
        </div>

        {/* Available */}
        <div className="bg-emerald-950/20 py-3 px-2 rounded-xl border border-emerald-500/40 space-y-1">
          <span className="text-[11px] text-emerald-300/90 block font-medium">Khả Dụng</span>
          <span className="text-xl font-extrabold font-mono text-emerald-400 block tracking-tight">
            {stats.available}
          </span>
          <span className="text-[10px] text-slate-500 font-sans block">Sẵn sàng xuất</span>
        </div>
      </div>

      {/* Chú thích công thức kỹ thuật tinh tế */}
      <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Công thức: <strong className="text-white font-mono">On-Hand = Reserved + Available</strong></span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
          Bảo vệ chống âm kho bằng khóa bi quan (SELECT FOR UPDATE) trên PostgreSQL.
        </p>
      </div>
    </div>
  );
};
