import React from 'react';
import { Package, Layers, Clock, ShieldCheck, TrendingUp, Flame, CheckCircle2 } from 'lucide-react';

export const DashboardKpiCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* Card 1: SKU */}
      <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Tổng Mã SKU Quản Lý</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold text-white tracking-tight font-mono">1,248</div>
          <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+12.4% danh mục tháng này</span>
          </div>
        </div>
      </div>

      {/* Card 2: Công Suất Kho */}
      <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Tỷ Lệ Lấp Đầy Ô Kệ</span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold text-white tracking-tight font-mono">78.5%</div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
              style={{ width: '78.5%' }}
            ></div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 font-mono">314 / 400 ô kệ đang chứa hàng</p>
        </div>
      </div>

      {/* Card 3: Cảnh báo FEFO */}
      <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Cảnh Báo Hạn Dùng (FEFO)</span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold text-rose-400 tracking-tight font-mono">4 Lô Hàng</div>
          <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-rose-400">
            <Flame className="w-3.5 h-3.5" />
            <span>Cận date &lt; 30 ngày (Ưu tiên xuất)</span>
          </div>
        </div>
      </div>

      {/* Card 4: Khóa Bi Quan */}
      <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 hover:border-slate-700 transition-all shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Động Cơ Khóa Đồng Thời</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-extrabold text-emerald-400 tracking-tight font-mono">18 Đơn Chờ</div>
          <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pessimistic Lock: 0 Âm Kho</span>
          </div>
        </div>
      </div>
    </div>
  );
};
