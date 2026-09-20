import React from 'react';
import { Package, Layers, Clock, ShieldCheck, TrendingUp, Flame, CheckCircle2 } from 'lucide-react';

export const DashboardKpiCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: SKU */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all shadow-xs group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng Mã SKU Quản Lý</span>
          <div className="w-9 h-9 rounded-xl bg-blue-50/80 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Package className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">1,248</span>
            <span className="text-xs font-medium text-slate-400">SKU</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              +12.4%
            </span>
            <span className="text-xs text-slate-400">so với tháng trước</span>
          </div>
        </div>
      </div>

      {/* Card 2: Công Suất Kho */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all shadow-xs group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tỷ Lệ Lấp Đầy Ô Kệ</span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50/80 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Layers className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">78.5%</span>
            <span className="text-xs font-medium text-slate-400">công suất</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: '78.5%' }}
            ></div>
          </div>
          <p className="text-[12px] text-slate-500 mt-1.5 font-medium">314 / 400 ô kệ đang chứa hàng</p>
        </div>
      </div>

      {/* Card 3: Cảnh báo FEFO */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-rose-200 hover:shadow-md transition-all shadow-xs group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Cảnh Báo Hạn Dùng (FEFO)</span>
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-4.5 h-4.5 text-rose-600" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight font-mono">04</span>
            <span className="text-xs font-semibold text-rose-600/80 uppercase">Lô Cận Date</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">
              <Flame className="w-3.5 h-3.5 text-rose-500" />
              &lt; 30 ngày
            </span>
            <span className="text-xs text-slate-500 font-medium">Ưu tiên xuất trước</span>
          </div>
        </div>
      </div>

      {/* Card 4: Khóa Bi Quan */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-200 hover:shadow-md transition-all shadow-xs group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Động Cơ Khóa Đồng Thời</span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-700 tracking-tight font-mono">18</span>
            <span className="text-xs font-semibold text-emerald-700/80 uppercase">Đơn Đang Chờ</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Pessimistic Lock
            </span>
            <span className="text-xs text-slate-500 font-medium">0 Lỗi Âm Kho</span>
          </div>
        </div>
      </div>
    </div>
  );
};
