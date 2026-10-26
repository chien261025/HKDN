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
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 flex-shrink-0 ring-4 ring-indigo-50">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Đơn Nhập Kho (Inbound PO)
              </h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold uppercase">
                SUPPLY CHAIN
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Quy trình 3 chặng: Tạo đơn PO ➔ Tiếp nhận Gate 01 ➔ Thuật toán Put-away cất kệ an toàn
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Nhập Kho (PO)</span>
        </button>
      </div>

      {/* 4 Pipeline Stage KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total POs */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600 opacity-80" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tổng Đơn PO</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5">{totalCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 group-hover:scale-105 transition-transform">
              <PackagePlus className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">Toàn bộ kế hoạch nhập hàng</div>
        </div>

        {/* Stage 1: Pending */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">1. Chờ Xe Tải Đến</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1.5">{pendingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 group-hover:scale-105 transition-transform">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-bold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Đang vận chuyển trên đường</span>
          </div>
        </div>

        {/* Stage 2: Staging */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">2. Đang Tại Khu Đệm</span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono mt-1.5">{receivedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:scale-105 transition-transform">
              <Truck className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-indigo-700 font-bold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((receivedCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Chờ quét lệnh Put-away</span>
          </div>
        </div>

        {/* Stage 3: Stocked */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">3. Đã Cất Kệ (Hoàn Tất)</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1.5">{stockedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((stockedCount / totalCount) * 100) : 0}%</span>
            <span className="font-normal text-slate-500">• Ghi sổ cái thành công</span>
          </div>
        </div>
      </div>
    </div>
  );
};

