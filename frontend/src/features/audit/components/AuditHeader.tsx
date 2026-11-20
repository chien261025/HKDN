import React from 'react';
import { ClipboardCheck, Clock, AlertTriangle, CheckCircle2, Plus, EyeOff } from 'lucide-react';
import { AuditSession } from '../types';

interface AuditHeaderProps {
  sessions: AuditSession[];
  onOpenCreateModal: () => void;
}

export const AuditHeader: React.FC<AuditHeaderProps> = ({
  sessions,
  onOpenCreateModal,
}) => {
  const countingCount = sessions.filter((s) => s.status === 'COUNTING').length;
  const pendingReviewCount = sessions.filter((s) => s.status === 'PENDING_REVIEW').length;
  const reconciledCount = sessions.filter((s) => s.status === 'RECONCILED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shadow-xs flex-shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Quản Lý Kiểm Kê & Cân Đối Kho
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Đối soát số lượng thực tế từ máy quét PDA • Tự động phát hiện lệch thừa thiếu • Duyệt cân đối Sổ cái
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-200 transition-all active:scale-[0.99] flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đợt Kiểm Kê Mới</span>
        </button>
      </div>

      {/* 4 KPI Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Sessions */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đợt Kiểm Kê</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5">{sessions.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Toàn bộ các chiến dịch đếm</div>
        </div>

        {/* Counting in progress */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Đang Đếm Thực Địa</div>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 font-mono mt-1.5">{countingCount} đợt</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-700 font-medium">Nhân viên đang quét ô kệ</div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Chờ Đối Soát Duyệt</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1.5">{pendingReviewCount} đợt</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">Đã đếm xong, chờ quản lý duyệt</div>
        </div>

        {/* Reconciled */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Đã Cân Đối Sổ Cái</div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono mt-1.5">{reconciledCount} đợt</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium">Đã điều chỉnh tồn khớp 100%</div>
        </div>
      </div>
    </div>
  );
};
