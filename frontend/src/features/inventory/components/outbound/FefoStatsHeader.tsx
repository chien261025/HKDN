import React from 'react';
import {
  Package,
  Clock,
  Lock,
  CheckCircle2,
  LayoutList,
  Columns,
  Search,
  RotateCcw
} from 'lucide-react';

interface FefoStatsHeaderProps {
  totalOrders: number;
  pendingOrders: number;
  reservedOrders: number;
  shippedOrders: number;
  viewMode: 'table' | 'kanban';
  onViewModeChange: (mode: 'table' | 'kanban') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'ALL' | 'PENDING' | 'RESERVED' | 'SHIPPED';
  onStatusFilterChange: (status: 'ALL' | 'PENDING' | 'RESERVED' | 'SHIPPED') => void;
  onReset: () => void;
}

export const FefoStatsHeader: React.FC<FefoStatsHeaderProps> = ({
  totalOrders,
  pendingOrders,
  reservedOrders,
  shippedOrders,
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onReset,
}) => {
  return (
    <div className="space-y-4">
      {/* 4 THẺ CHỈ SỐ KPI ĐẬM NÉT, RỰC RỠ & GIÀU NĂNG LƯỢNG */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng đơn xuất */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Tổng Đơn Xuất</span>
              <span className="text-3xl font-extrabold text-slate-900 mt-2 block tracking-tight font-mono">{totalOrders}</span>
              <span className="inline-block mt-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Toàn Kho
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Chờ xử lý */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Chờ Xử Lý</span>
              <span className="text-3xl font-extrabold text-amber-700 mt-2 block tracking-tight font-mono">{pendingOrders}</span>
              <span className="inline-block mt-2 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Cần Xử Lý Ngay
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Đã giữ hàng */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Đã Giữ Hàng</span>
              <span className="text-3xl font-extrabold text-blue-700 mt-2 block tracking-tight font-mono">{reservedOrders}</span>
              <span className="inline-block mt-2 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Sẵn Sàng Nhặt
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Đã xuất kho */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Đã Xuất Kho</span>
              <span className="text-3xl font-extrabold text-emerald-700 mt-2 block tracking-tight font-mono">{shippedOrders}</span>
              <span className="inline-block mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Đã Ghi Sổ Kho
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar với màu sắc nổi bật */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-slate-50/80 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
            <span>Điều Phối Xuất Hàng (FEFO)</span>
          </h2>

          {/* Nút gạt chuyển đổi View Mode: Bảng vs Kanban */}
          <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-200 text-xs shadow-inner">
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Dạng Bảng</span>
            </button>

            <button
              onClick={() => onViewModeChange('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Luồng Kanban</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm mã đơn, khách hàng, SKU..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium shadow-xs"
            />
          </div>

          {/* Tab lọc trạng thái */}
          {viewMode === 'table' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => onStatusFilterChange('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất Cả
              </button>
              <button
                onClick={() => onStatusFilterChange('PENDING')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'PENDING'
                    ? 'bg-white text-amber-700 font-bold shadow-xs'
                    : 'text-amber-700/80 hover:text-amber-800'
                }`}
              >
                Chờ Xuất
              </button>
              <button
                onClick={() => onStatusFilterChange('RESERVED')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'RESERVED'
                    ? 'bg-white text-blue-700 font-bold shadow-xs'
                    : 'text-blue-700/80 hover:text-blue-800'
                }`}
              >
                Đã Giữ
              </button>
              <button
                onClick={() => onStatusFilterChange('SHIPPED')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'SHIPPED'
                    ? 'bg-white text-emerald-700 font-bold shadow-xs'
                    : 'text-emerald-700/80 hover:text-emerald-800'
                }`}
              >
                Đã Xuất
              </button>
            </div>
          )}

          {/* Nút reset */}
          <button
            onClick={onReset}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors cursor-pointer shadow-xs"
            title="Làm mới lại dữ liệu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
