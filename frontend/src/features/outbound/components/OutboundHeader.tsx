import React from 'react';
import { PackageCheck, Clock, ShieldCheck, Plus, CheckCircle2 } from 'lucide-react';
import { OutboundOrder } from '../types';

export type OutboundFilterStatus = 'ALL' | 'PENDING' | 'PICKING' | 'DISPATCHED';

interface OutboundHeaderProps {
  orders: OutboundOrder[];
  activeStatus?: OutboundFilterStatus;
  onStatusChange?: (status: OutboundFilterStatus) => void;
  onOpenCreateModal: () => void;
}

export const OutboundHeader: React.FC<OutboundHeaderProps> = ({
  orders,
  activeStatus = 'ALL',
  onStatusChange,
  onOpenCreateModal,
}) => {
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const pickingCount = orders.filter((o) => o.status === 'ALLOCATED' || o.status === 'PICKING').length;
  const dispatchedCount = orders.filter((o) => o.status === 'DISPATCHED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 ring-4 ring-blue-50">
            <PackageCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản Lý Đơn Xuất Kho
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Phân bổ tự động lô cận hạn (FEFO), khóa giữ tồn an toàn và tối ưu hóa đường đi lấy hàng
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-200 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tạo Đơn Xuất Kho</span>
        </button>
      </div>

      {/* 4 Pipeline Stage KPI Cards - Interactive Filter */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total SO */}
        <div
          onClick={() => onStatusChange?.('ALL')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer select-none ${
            activeStatus === 'ALL' ? 'ring-2 ring-slate-400' : ''
          }`}
          title="Toàn bộ danh sách đơn xuất kho"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Đơn Xuất Kho</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5 tabular-nums">{totalCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600 font-medium">Toàn bộ nhu cầu xuất hàng</div>
        </div>

        {/* Stage 1: Pending */}
        <div
          onClick={() => onStatusChange?.('PENDING')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all cursor-pointer select-none ${
            activeStatus === 'PENDING' ? 'ring-2 ring-amber-400' : ''
          }`}
          title="Nhấn để lọc các đơn chờ phân bổ lô FEFO"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Chờ Phân Bổ</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1.5 tabular-nums">{pendingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Chờ chọn lô & giữ chỗ</span>
          </div>
        </div>

        {/* Stage 2: Picking */}
        <div
          onClick={() => onStatusChange?.('PICKING')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all cursor-pointer select-none ${
            activeStatus === 'PICKING' ? 'ring-2 ring-blue-400' : ''
          }`}
          title="Nhấn để lọc các đơn đang lấy hàng / đã giữ hàng"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Đang Lấy Hàng</span>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono mt-1.5 tabular-nums">{pickingCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pickingCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Đã giữ hàng, chờ nhặt đủ</span>
          </div>
        </div>

        {/* Stage 3: Dispatched */}
        <div
          onClick={() => onStatusChange?.('DISPATCHED')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-emerald-600 shadow-sm hover:shadow-md transition-all cursor-pointer select-none ${
            activeStatus === 'DISPATCHED' ? 'ring-2 ring-emerald-400' : ''
          }`}
          title="Nhấn để lọc các đơn đã hoàn tất xuất kho"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Đã Xuất Kho</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1.5 tabular-nums">{dispatchedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((dispatchedCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Đã giao xe tải & trừ tồn</span>
          </div>
        </div>
      </div>
    </div>
  );
};
