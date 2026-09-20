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
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-sm flex-shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Kiểm Kê & Cân Đối Kho (Inventory Audit)
              </h1>
              <span className="text-xs font-mono bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold flex items-center gap-1">
                <EyeOff className="w-3.5 h-3.5" /> BLIND COUNT
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              So khớp số liệu thực tế từ máy quét PDA Thủ kho • Phát hiện sai lệch thừa thiếu • Duyệt ghi sổ cái cân đối
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đợt Kiểm Kê Mới</span>
        </button>
      </div>

      {/* 4 KPI Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sessions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Đợt Kiểm Kê</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{sessions.length}</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <ClipboardCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Counting in progress */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Đang Đếm Thực Địa</div>
            <div className="text-2xl font-black text-blue-900 font-mono mt-1">{countingCount} đợt</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">Chờ Đối Soát Duyệt</div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">{pendingReviewCount} đợt</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Reconciled */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Đã Cân Đối Sổ Cái</div>
            <div className="text-2xl font-black text-emerald-700 font-mono mt-1">{reconciledCount} đợt</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
