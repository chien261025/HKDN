import React from 'react';
import { PackageCheck, Clock, ShieldCheck, Truck, Plus, CheckCircle2, Flame } from 'lucide-react';
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
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-rose-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 flex-shrink-0 ring-1 ring-white/20">
            <PackageCheck className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
                Quản Lý Đơn Xuất Kho (Outbound Orders / SO)
              </h1>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                FEFO & CONCURRENCY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Phân bổ lô hàng cận date (FEFO) • Khóa giữ tồn kho chống tranh chấp (Pessimistic Lock) • Sinh Pick List tự động
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-500/30 transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Xuất Hàng Mới (SO)</span>
        </button>
      </div>

      {/* 4 KPI Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total SO */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tổng Đơn Xuất</div>
            <div className="text-lg font-extrabold text-white font-mono mt-0.5">{orders.length}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-amber-400 uppercase">Chờ Duyệt & Khóa</div>
            <div className="text-lg font-extrabold text-amber-300 font-mono mt-0.5">{pendingCount} đơn</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Picking in Progress */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase">Đang Nhặt Hàng</div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono mt-0.5">{pickingCount} đơn</div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Dispatched */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase">Đã Xuất Kho</div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono mt-0.5">{dispatchedCount} đơn</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
