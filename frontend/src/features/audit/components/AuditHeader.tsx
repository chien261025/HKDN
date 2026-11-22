import React, { useEffect, useState } from 'react';
import { ClipboardCheck, Clock, AlertTriangle, CheckCircle2, Plus, Building2, RefreshCw } from 'lucide-react';
import { AuditSession } from '../types';
import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';

export type AuditFilterStatus = 'ALL' | 'COUNTING' | 'PENDING_REVIEW' | 'RECONCILED';

interface AuditHeaderProps {
  sessions: AuditSession[];
  onOpenCreateModal: () => void;
  selectedWarehouse?: string;
  onWarehouseChange?: (whId: string) => void;
  activeStatus?: AuditFilterStatus;
  onStatusChange?: (status: AuditFilterStatus) => void;
  onRefresh?: () => void;
  loading?: boolean;
  lastUpdated?: string;
}

export const AuditHeader: React.FC<AuditHeaderProps> = ({
  sessions,
  onOpenCreateModal,
  selectedWarehouse = 'ALL',
  onWarehouseChange,
  activeStatus = 'ALL',
  onStatusChange,
  onRefresh,
  loading = false,
  lastUpdated,
}) => {
  const [warehouseList, setWarehouseList] = useState<any[]>([
    { id: 'ALL', code: 'ALL', name: 'Toàn bộ chi nhánh kho (Hệ Thống)' },
    ...DEFAULT_WAREHOUSES.map((w) => ({ id: String(w.id), code: w.code, name: w.name })),
  ]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const list = await warehouseService.getWarehouses();
        if (list && list.length > 0) {
          setWarehouseList([
            { id: 'ALL', code: 'ALL', name: 'Toàn bộ chi nhánh kho (Hệ Thống)' },
            ...list.map((w) => ({ id: String(w.id), code: w.code, name: w.name })),
          ]);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách kho động tại AuditHeader:', err);
      }
    };
    fetchWarehouses();
  }, []);

  const countingCount = sessions.filter((s) => s.status === 'COUNTING').length;
  const pendingReviewCount = sessions.filter((s) => s.status === 'PENDING_REVIEW').length;
  const reconciledCount = sessions.filter((s) => s.status === 'RECONCILED').length;

  const handleCardClick = (status: AuditFilterStatus) => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Row với Bộ Chọn Kho Đồng Bộ & Nút Đồng Bộ Động */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 ring-4 ring-blue-50">
            <ClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Quản Lý Kiểm Kê & Cân Đối Kho
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Đối soát số lượng thực tế từ máy quét PDA • Tự động phát hiện lệch thừa thiếu • Duyệt cân đối Sổ cái
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap">
          {/* Bộ Lọc Chi Nhánh Kho Đồng Bộ */}
          {onWarehouseChange && (
            <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-2xs">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phạm vi dữ liệu kho:</span>
                <select
                  value={selectedWarehouse}
                  onChange={(e) => onWarehouseChange(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer pr-4"
                >
                  {warehouseList.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Nút Đồng Bộ Dữ Liệu Thời Gian Thực */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              title="Cập nhật tiến độ kiểm kê mới nhất từ máy quét PDA"
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors text-xs font-bold cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đồng bộ</span>
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}

          {lastUpdated && (
            <div className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{lastUpdated}</span>
            </div>
          )}

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-200 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Đợt Kiểm Kê Mới</span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ Chỉ Số Kiểm Kê - Bấm trực tiếp để lọc dữ liệu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Sessions */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('ALL')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('ALL')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none group relative ${
            activeStatus === 'ALL'
              ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-sm'
          }`}
          title="Bấm để xem tất cả đợt kiểm kê"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Đợt Kiểm Kê</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5 tabular-nums">
                {sessions.length}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl transition-colors ${activeStatus === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'}`}>
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            Toàn bộ các chiến dịch đếm
          </div>
        </div>

        {/* Card 2: Counting in progress */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('COUNTING')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('COUNTING')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none group relative ${
            activeStatus === 'COUNTING'
              ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-sm'
          }`}
          title="Đợt kiểm kê đang đếm thực địa"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Đang Đếm Thực Địa</span>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono mt-1.5 tabular-nums">
                {countingCount} <span className="text-sm font-semibold text-slate-500">đợt</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl transition-colors ${activeStatus === 'COUNTING' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-700 font-medium">
            Nhân viên đang quét ô kệ
          </div>
        </div>

        {/* Card 3: Pending Review */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('PENDING_REVIEW')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('PENDING_REVIEW')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none group relative ${
            activeStatus === 'PENDING_REVIEW'
              ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-600/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-sm'
          }`}
          title="Đợt kiểm kê chờ đối soát duyệt"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Chờ Đối Soát Duyệt</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1.5 tabular-nums">
                {pendingReviewCount} <span className="text-sm font-semibold text-slate-500">đợt</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl transition-colors ${activeStatus === 'PENDING_REVIEW' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            Đã đếm xong, chờ quản lý duyệt
          </div>
        </div>

        {/* Card 4: Reconciled */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => handleCardClick('RECONCILED')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCardClick('RECONCILED')}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none group relative ${
            activeStatus === 'RECONCILED'
              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-sm'
          }`}
          title="Đợt kiểm kê đã cân đối sổ cái"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Đã Cân Đối Sổ Cái</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1.5 tabular-nums">
                {reconciledCount} <span className="text-sm font-semibold text-slate-500">đợt</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl transition-colors ${activeStatus === 'RECONCILED' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium">
            Đã điều chỉnh tồn khớp 100%
          </div>
        </div>
      </div>
    </div>
  );
};
