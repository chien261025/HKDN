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
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Xuất Báo Cáo Dữ Liệu Lớn
          </h1>
          <p className="text-xs text-slate-400">
            Hàng đợi ngầm RabbitMQ • Stream Excel SXSSF (RAM &lt; 50MB) • Lưu trữ MinIO S3
          </p>
        </div>
      </div>

      {/* Mini status chips */}
      <div className="flex items-center gap-2 font-mono text-xs">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Đã hoàn thành: <strong className="text-emerald-400">{completedJobsCount}</strong> tệp</span>
        </span>

        {activeJobsCount > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Đang xử lý: <strong className="font-bold">{activeJobsCount}</strong></span>
          </span>
        )}
      </div>
    </div>
  );
};
