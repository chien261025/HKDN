import React from 'react';
import { PackagePlus, Clock, Truck, CheckCircle2, Plus } from 'lucide-react';
import { InboundOrder } from '../types';

interface InboundHeaderProps {
  orders: InboundOrder[];
  onOpenCreateModal: () => void;
}

export const InboundHeader: React.FC<InboundHeaderProps> = ({
  orders,
  onOpenCreateModal,
}) => {
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;
  const stockedCount = orders.filter((o) => o.status === 'STOCKED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 ring-4 ring-blue-50">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản Lý Đơn Nhập Kho (PO)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Theo dõi kế hoạch nhà cung cấp, tiếp nhận xe tải dỡ hàng và xếp vào ô kệ an toàn
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-200 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Nhập Kho</span>
        </button>
      </div>

      {/* 4 Pipeline Stage KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total POs */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-slate-700 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Kế Hoạch PO</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5 tabular-nums">{totalCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <PackagePlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600 font-medium">Toàn bộ nhu cầu nhập hàng</div>
        </div>

        {/* Stage 1: Pending */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">1. Chờ Xe Tải Đến</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1.5 tabular-nums">{pendingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Đang trên đường vận chuyển</span>
          </div>
        </div>

        {/* Stage 2: Staging */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">2. Đang Tại Khu Đệm</span>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono mt-1.5 tabular-nums">{receivedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((receivedCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Đã hạ tải, chờ xếp kệ</span>
          </div>
        </div>

        {/* Stage 3: Stocked */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">3. Đã Cất Kệ Xong</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1.5 tabular-nums">{stockedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((stockedCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Đã lưu kho an toàn</span>
          </div>
        </div>
      </div>
    </div>
  );
};

