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
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0 ring-4 ring-indigo-50">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Quản Lý Đơn Nhập Kho (Inbound PO)
              </h1>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold uppercase">
                Nhập Kho PO
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Quy trình tiếp nhận: Tạo đơn PO • Tiếp nhận Gate 01 • Thuật toán Put-away xếp kệ an toàn
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Nhập Kho (PO)</span>
        </button>
      </div>

      {/* 4 Pipeline Stage KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total POs */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tổng Đơn PO</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">{totalCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <PackagePlus className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Toàn bộ kế hoạch nhập hàng</div>
        </div>

        {/* Stage 1: Pending */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Chờ Xe Tải Đến</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1.5 tabular-nums">{pendingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Đang vận chuyển trên đường</span>
          </div>
        </div>

        {/* Stage 2: Staging */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Đang Tại Khu Đệm</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 font-mono mt-1.5 tabular-nums">{receivedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-indigo-700 font-medium flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((receivedCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Chờ quét lệnh Put-away</span>
          </div>
        </div>

        {/* Stage 3: Stocked */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">Đã Cất Kệ Hoàn Tất</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-1.5 tabular-nums">{stockedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((stockedCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Ghi sổ cái thành công</span>
          </div>
        </div>
      </div>
    </div>
  );
};

