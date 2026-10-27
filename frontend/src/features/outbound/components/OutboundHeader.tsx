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
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0 ring-4 ring-indigo-50">
            <PackageCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Quản Lý Đơn Xuất Kho (Outbound SO)
              </h1>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold uppercase">
                Xuất Kho SO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Phân bổ lô hàng cận date (FEFO) • Khóa chống tranh chấp (Pessimistic Lock) • Lộ trình nhặt hàng tối ưu
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Xuất Hàng (SO)</span>
        </button>
      </div>

      {/* 4 Pipeline Stage KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total SO */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tổng Đơn Xuất</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">{totalCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <PackageCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Toàn bộ nhu cầu xuất kho</div>
        </div>

        {/* Stage 1: Pending */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Chờ Duyệt & Khóa</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1.5 tabular-nums">{pendingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Chờ phân bổ lô FEFO</span>
          </div>
        </div>

        {/* Stage 2: Picking */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Đang Nhặt Hàng</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 font-mono mt-1.5 tabular-nums">{pickingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-indigo-700 font-medium flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pickingCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Đã khóa tồn, nhân viên đang pick</span>
          </div>
        </div>

        {/* Stage 3: Dispatched */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Đã Xuất Kho Xong</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-1.5 tabular-nums">{dispatchedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((dispatchedCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Trừ tồn kho & xuất hàng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

