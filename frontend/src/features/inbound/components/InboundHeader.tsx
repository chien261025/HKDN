import React from 'react';
import { PackagePlus, Clock, Truck, Layers, CheckCircle2, Plus } from 'lucide-react';
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
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-cyan-600/30 flex-shrink-0 ring-1 ring-white/20">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
                Quản Lý Đơn Nhập Kho (Inbound Orders / PO)
              </h1>
              <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold">
                SUPPLY CHAIN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Quy trình chuẩn: Tạo PO ➔ Tiếp nhận tại Khu Đệm (Gate 01) ➔ Thuật toán Put-away cất kệ an toàn
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đơn Nhập Kho Mới (PO)</span>
        </button>
      </div>

      {/* 4 KPI Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total POs */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tổng Đơn PO</div>
            <div className="text-lg font-extrabold text-white font-mono mt-0.5">{orders.length}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <PackagePlus className="w-4 h-4" />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-amber-400 uppercase">Chờ Xe Tải Đến</div>
            <div className="text-lg font-extrabold text-amber-300 font-mono mt-0.5">{pendingCount} đơn</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Received in Staging */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase">Đang Tại Khu Đệm</div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono mt-0.5">{receivedCount} đơn</div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Truck className="w-4 h-4" />
          </div>
        </div>

        {/* Stocked */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase">Đã Cất Kệ (Xong)</div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono mt-0.5">{stockedCount} đơn</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
