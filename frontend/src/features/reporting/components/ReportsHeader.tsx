import React from 'react';
import { FileSpreadsheet, Radio, HardDrive, Cpu, CheckCircle2 } from 'lucide-react';

interface ReportsHeaderProps {
  completedJobsCount: number;
  activeJobsCount: number;
}

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  completedJobsCount,
  activeJobsCount,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Title */}
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Xuất Báo Cáo Dữ Liệu Lớn
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hàng đợi ngầm RabbitMQ • Stream Excel SXSSF (RAM &lt; 50MB) • Lưu trữ MinIO S3
          </p>
        </div>
      </div>

      {/* Mini status chips */}
      <div className="flex items-center gap-2.5 font-mono text-xs">
        <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-slate-700 font-semibold shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Đã hoàn thành: <strong className="text-emerald-700 font-bold">{completedJobsCount}</strong> tệp</span>
        </span>

        {activeJobsCount > 0 && (
          <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold animate-pulse shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Đang xử lý: <strong className="font-bold">{activeJobsCount}</strong></span>
          </span>
        )}
      </div>
    </div>
  );
};
