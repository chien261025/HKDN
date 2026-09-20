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
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;
  const stockedCount = orders.filter((o) => o.status === 'STOCKED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 flex-shrink-0">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Đơn Nhập Kho (Inbound Orders / PO)
              </h1>
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-bold">
                SUPPLY CHAIN
              </span>
            </div>
            <p className="text-sm text-slate-600 font-medium mt-1">
              Quy trình chuẩn: Tạo PO ➔ Tiếp nhận tại Khu Đệm (Gate 01) ➔ Thuật toán Put-away cất kệ an toàn
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Tạo Đơn Nhập Kho Mới (PO)</span>
        </button>
      </div>

      {/* 4 KPI Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total POs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase">Tổng Đơn PO</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{orders.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <PackagePlus className="w-5 h-5" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase">Chờ Xe Tải Đến</div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">{pendingCount} đơn</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Received in Staging */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-700 uppercase">Đang Tại Khu Đệm</div>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-1">{receivedCount} đơn</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Stocked */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase">Đã Cất Kệ (Xong)</div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{stockedCount} đơn</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

