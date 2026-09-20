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
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const pickingCount = orders.filter((o) => o.status === 'ALLOCATED' || o.status === 'PICKING').length;
  const dispatchedCount = orders.filter((o) => o.status === 'DISPATCHED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-100 flex-shrink-0">
            <PackageCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Đơn Xuất Kho (Outbound Orders / SO)
              </h1>
              <span className="text-xs font-mono bg-amber-50 text-amber-800 px-2.5 py-0.5 rounded-full border border-amber-300 font-bold">
                FEFO & CONCURRENCY
              </span>
            </div>
            <p className="text-sm text-slate-600 font-medium mt-1">
              Phân bổ lô hàng cận date (FEFO) • Khóa giữ tồn kho chống tranh chấp (Pessimistic Lock) • Sinh Pick List tự động
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Tạo Đơn Xuất Hàng Mới (SO)</span>
        </button>
      </div>

      {/* 4 KPI Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SO */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase">Tổng Đơn Xuất</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{orders.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase">Chờ Duyệt & Khóa</div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">{pendingCount} đơn</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Picking in Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-700 uppercase">Đang Nhặt Hàng</div>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-1">{pickingCount} đơn</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Dispatched */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase">Đã Xuất Kho</div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{dispatchedCount} đơn</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

