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
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Title & Architecture Badges */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-emerald-500 flex items-center justify-center text-slate-950 font-extrabold shadow-lg shadow-amber-500/20 flex-shrink-0 ring-1 ring-white/20">
          <FileSpreadsheet className="w-6 h-6 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
              Xuất Báo Cáo Dữ Liệu Lớn (Async Queue Offloading)
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
              <Radio className="w-3 h-3" /> RabbitMQ AMQP 5672
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-bold">
              <HardDrive className="w-3 h-3" /> MinIO S3 Storage
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đẩy tác vụ nặng sang RabbitMQ Worker • Apache POI SXSSF Stream giữ RAM &lt; 50MB • Chống nghẽn luồng người dùng (Non-blocking)
          </p>
        </div>
      </div>

      {/* Quick Status Stats */}
      <div className="flex items-center gap-2.5 self-end md:self-auto font-mono text-xs">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Đã hoàn thành: <strong className="text-emerald-400 font-bold">{completedJobsCount}</strong> tệp</span>
        </div>

        {activeJobsCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            <span>Đang xử lý: <strong className="font-bold">{activeJobsCount}</strong> job</span>
          </div>
        )}
      </div>
    </div>
  );
};
