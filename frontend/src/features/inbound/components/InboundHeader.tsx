import React, { useEffect, useState } from 'react';
import { PackagePlus, Clock, Truck, CheckCircle2, Plus, Building2 } from 'lucide-react';
import { InboundOrder } from '../types';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';

export type InboundFilterStatus = 'ALL' | 'PENDING' | 'RECEIVED' | 'STOCKED' | 'QC_ISSUE';

interface InboundHeaderProps {
  orders: InboundOrder[];
  selectedWarehouse?: string;
  activeStatus?: InboundFilterStatus;
  onStatusChange?: (status: InboundFilterStatus) => void;
  onWarehouseChange?: (whId: string) => void;
  onOpenCreateModal: () => void;
}

export const InboundHeader: React.FC<InboundHeaderProps> = ({
  orders,
  selectedWarehouse = 'ALL',
  activeStatus = 'ALL',
  onStatusChange,
  onWarehouseChange,
  onOpenCreateModal,
}) => {
  const [warehouses, setWarehouses] = useState(DEFAULT_WAREHOUSES);

  useEffect(() => {
    warehouseService
      .getWarehouses()
      .then((list) => {
        if (list && list.length > 0) setWarehouses(list);
      })
      .catch(() => {});
  }, []);
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;
  const stockedCount = orders.filter((o) => o.status === 'STOCKED').length;

  // Chuẩn hóa ID kho cho <select>
  const normalizedWh = (() => {
    if (!selectedWarehouse || selectedWarehouse === 'ALL') return 'ALL';
    const match = selectedWarehouse.match(/\d+/);
    if (!match) return 'ALL';
    const num = match[0];
    return num.length === 1 ? `WH0${num}` : `WH${num}`;
  })();

  const handleCardClick = (status: InboundFilterStatus) => {
    if (onStatusChange) {
      if (activeStatus === status && status !== 'ALL') {
        onStatusChange('ALL');
      } else {
        onStatusChange(status);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 ring-4 ring-blue-50">
            <PackagePlus className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản Lý Đơn Nhập Kho
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Theo dõi tiến độ giao hàng từ nhà cung cấp, tiếp nhận dỡ hàng và xếp vào ô kệ an toàn
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap">
          {onWarehouseChange && (
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phạm vi kho:</span>
                <select
                  value={normalizedWh}
                  onChange={(e) => onWarehouseChange(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer pr-3"
                >
                  <option value="ALL">Toàn bộ chi nhánh kho</option>
                  {warehouses.map((opt) => (
                    <option key={opt.id} value={opt.code}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs shadow-blue-200 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Đơn Nhập Kho</span>
          </button>
        </div>
      </div>

      {/* 4 Pipeline Stage KPI Cards - Clean & Interactive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total POs */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('ALL')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('ALL')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-slate-700 shadow-xs hover:shadow-sm transition-all cursor-pointer select-none text-left ${
            activeStatus === 'ALL' ? 'ring-2 ring-slate-400 ring-offset-1 shadow-sm' : ''
          }`}
          title="Bấm để xem tất cả đơn nhập kho"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tổng Đơn Nhập Kho
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5 tabular-nums">
                {totalCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <PackagePlus className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-600 font-medium">
            Toàn bộ đơn nhập hàng
          </div>
        </div>

        {/* Card 2: Stage 1 - Pending */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('PENDING')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('PENDING')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-amber-500 shadow-xs hover:shadow-sm transition-all cursor-pointer select-none text-left ${
            activeStatus === 'PENDING' ? 'ring-2 ring-amber-400 ring-offset-1 shadow-sm' : ''
          }`}
          title="Đơn chờ tiếp nhận"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
                Chờ Tiếp Nhận
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-sans mt-1.5 tabular-nums">
                {pendingCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Hàng đang trên đường tới kho</span>
          </div>
        </div>

        {/* Card 3: Stage 2 - Staging */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('RECEIVED')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('RECEIVED')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-blue-600 shadow-xs hover:shadow-sm transition-all cursor-pointer select-none text-left ${
            activeStatus === 'RECEIVED' ? 'ring-2 ring-blue-400 ring-offset-1 shadow-sm' : ''
          }`}
          title="Đơn tại khu đệm & kiểm hàng"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                Khu Đệm & Kiểm Hàng
              </span>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 font-sans mt-1.5 tabular-nums">
                {receivedCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((receivedCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Tại khu đệm, chờ xếp kệ</span>
          </div>
        </div>

        {/* Card 4: Stage 3 - Stocked */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('STOCKED')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('STOCKED')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 border-l-4 border-l-emerald-600 shadow-xs hover:shadow-sm transition-all cursor-pointer select-none text-left ${
            activeStatus === 'STOCKED' ? 'ring-2 ring-emerald-400 ring-offset-1 shadow-sm' : ''
          }`}
          title="Đơn đã hoàn tất nhập kho"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Đã Hoàn Tất Nhập Kho
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-sans mt-1.5 tabular-nums">
                {stockedCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <span>{totalCount > 0 ? Math.round((stockedCount / totalCount) * 100) : 0}%</span>
            <span className="font-medium text-slate-500">• Đã cất kệ và ghi thẻ kho</span>
          </div>
        </div>
      </div>
    </div>
  );
};
