import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Clock,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const DashboardKpiCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Inbound Throughput */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all shadow-xs group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Lưu Lượng Nhập Kho Hôm Nay
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ArrowDownLeft className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">1,850</span>
            <span className="text-xs font-semibold text-slate-400">kiện / 48 đơn</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
              <TrendingUp className="w-3.5 h-3.5" />
              +14.2%
            </span>
            <span className="text-xs text-slate-400">so với ca hôm qua</span>
          </div>
        </div>
      </div>

      {/* Card 2: Outbound Throughput */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all shadow-xs group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Lưu Lượng Xuất Kho Hôm Nay
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ArrowUpRight className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">4,320</span>
            <span className="text-xs font-semibold text-slate-400">kiện / 126 đơn</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
              <CheckCircle2 className="w-3.5 h-3.5" />
              98.2%
            </span>
            <span className="text-xs text-slate-400">hoàn tất kịp cam kết SLA</span>
          </div>
        </div>
      </div>

      {/* Card 3: Storage Utilization */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all shadow-xs group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tỷ Lệ Lấp Đầy Ô Kệ
          </span>
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center group-hover:scale-105 transition-transform">
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
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: '78.5%' }}
            ></div>
          </div>
          <p className="text-[12px] text-slate-500 mt-1.5 font-medium">
            314 / 400 ô kệ chứa hàng (86 ô trống sẵn sàng)
          </p>
        </div>
      </div>

      {/* Card 4: Inventory Health & FEFO */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all shadow-xs group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Cảnh Báo Hạn Dùng (FEFO)
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Clock className="w-4.5 h-4.5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 tracking-tight font-mono">04</span>
            <span className="text-xs font-bold text-amber-700 uppercase">Lô Cận Date</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              &lt; 30 ngày
            </span>
            <span className="text-xs text-slate-500 font-medium">Tự động ưu tiên xuất trước</span>
          </div>
        </div>
      </div>
    </div>
  );
};
