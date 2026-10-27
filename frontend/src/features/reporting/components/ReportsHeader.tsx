import React from 'react';
import { FileSpreadsheet, Calendar, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

interface ReportsHeaderProps {
  completedJobsCount: number;
  activeJobsCount: number;
  onRefresh?: () => void;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  completedJobsCount,
  activeJobsCount,
  onRefresh,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      {/* Title & Business description */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Trung Tâm Báo Cáo & Thống Kê Kho Vận
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Chuẩn Kiểm Toán
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-2xl">
            Tổng hợp dữ liệu vận hành, xuất file đối soát xuất nhập tồn, phân tích hạn dùng FEFO và đánh giá hiệu suất kho theo tiêu chuẩn kế toán doanh nghiệp.
          </p>
        </div>
      </div>

      {/* Enterprise Status & Filters */}
      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>Kỳ báo cáo: <strong className="text-slate-900">Tháng 10/2026</strong></span>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-700 text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Sẵn sàng tải: <strong className="text-emerald-700 font-bold">{completedJobsCount}</strong> tệp</span>
        </div>

        {activeJobsCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold animate-pulse shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Đang tổng hợp: <strong className="font-bold">{activeJobsCount}</strong></span>
          </div>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            type="button"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-2xs transition-all"
            title="Làm mới trạng thái"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
