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
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 flex-shrink-0 ring-1 ring-white/20">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
                Quản Lý Kiểm Kê & Cân Đối Kho (Inventory Audit)
              </h1>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold flex items-center gap-1">
                <EyeOff className="w-3 h-3" /> BLIND COUNT
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              So khớp số liệu thực tế từ máy quét PDA Thủ kho • Phát hiện sai lệch thừa thiếu • Duyệt ghi sổ cái cân đối
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95 flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Đợt Kiểm Kê Mới</span>
        </button>
      </div>

      {/* 4 KPI Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sessions */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tổng Đợt Kiểm Kê</div>
            <div className="text-lg font-extrabold text-white font-mono mt-0.5">{sessions.length}</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <ClipboardCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Counting in progress */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase">Đang Đếm Thực Địa</div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono mt-0.5">{countingCount} đợt</div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-amber-400 uppercase">Chờ Đối Soát Duyệt</div>
            <div className="text-lg font-extrabold text-amber-300 font-mono mt-0.5">{pendingReviewCount} đợt</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Reconciled */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-emerald-400 uppercase">Đã Cân Đối Sổ Cái</div>
            <div className="text-lg font-extrabold text-emerald-300 font-mono mt-0.5">{reconciledCount} đợt</div>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
