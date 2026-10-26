import React from 'react';
import { PackageCheck, Clock, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';
import { OutboundOrder } from '../types';

interface OutboundHeaderProps {
  orders: OutboundOrder[];
  onOpenCreateModal: () => void;
}

export const OutboundHeader: React.FC<OutboundHeaderProps> = ({
  orders,
  onOpenCreateModal,
}) => {
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const pickingCount = orders.filter((o) => o.status === 'ALLOCATED' || o.status === 'PICKING').length;
  const dispatchedCount = orders.filter((o) => o.status === 'DISPATCHED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 flex-shrink-0 ring-4 ring-amber-50">
            <PackageCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Đơn Xuất Kho (Outbound SO)
              </h1>
              <span className="text-[11px] font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 font-bold uppercase">
                FEFO & CONCURRENCY
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Phân bổ lô hàng cận date (FEFO) • Khóa chống tranh chấp (Pessimistic Lock) • Lộ trình nhặt hàng tối ưu
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Xuất Hàng (SO)</span>
        </button>
      </div>

      {/* 4 Pipeline Stage KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total SO */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600 opacity-80" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tổng Đơn Xuất</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5">{totalCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 group-hover:scale-105 transition-transform">
              <PackageCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">Toàn bộ nhu cầu xuất kho</div>
        </div>

        {/* Stage 1: Pending */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">1. Chờ Duyệt & Khóa</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1.5">{pendingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 group-hover:scale-105 transition-transform">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-bold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Chờ phân bổ lô FEFO</span>
          </div>
        </div>

        {/* Stage 2: Picking */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">2. Đang Nhặt Hàng</span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono mt-1.5">{pickingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-indigo-700 font-bold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pickingCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Đã khóa tồn, nhân viên đang pick</span>
          </div>
        </div>

        {/* Stage 3: Dispatched */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">3. Đã Xuất Kho (Xong)</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1.5">{dispatchedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((dispatchedCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Trừ tồn kho & xuất hàng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

