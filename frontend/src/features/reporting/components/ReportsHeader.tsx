import React from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  MessageCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ReportsHeaderProps {
  completedJobsCount: number;
  activeJobsCount: number;
  reportPeriod?: string;
  onOpenAssistant?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const formatReportPeriod = (period?: string) => {
  if (!period) return 'Kỳ hiện tại';
  const date = new Date(`${period}-01T00:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date);
};

export const ReportsHeader: React.FC<ReportsHeaderProps> = ({
  completedJobsCount,
  activeJobsCount,
  reportPeriod,
  onOpenAssistant,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-emerald-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-44 w-44 rounded-full bg-sky-100/50 blur-3xl" />

      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200 ring-4 ring-blue-50 sm:h-14 sm:w-14">
            <FileSpreadsheet className="h-6 w-6 sm:h-7 sm:w-7 text-white" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700">
                <Sparkles className="h-3 w-3" /> Báo cáo vận hành
              </span>
              {activeJobsCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" /> Đang xử lý
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">Trung tâm báo cáo & thống kê kho vận</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Theo dõi báo cáo đã xuất, tạo file đối soát và phân tích hiệu suất vận hành từ dữ liệu kho thực tế.</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <div className="min-w-[132px] rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Đã hoàn tất</div>
              <div className="mt-1 text-2xl font-bold leading-none text-slate-950">{completedJobsCount}</div>
            </div>
            <div className="min-w-[132px] rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Đang xử lý</div>
              <div className="mt-1 text-2xl font-bold leading-none text-slate-950">{activeJobsCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm">
            <CalendarDays className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0"><div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Kỳ báo cáo</div><div className="mt-0.5 flex items-center gap-1 text-sm font-semibold capitalize text-slate-800">{formatReportPeriod(reportPeriod)}<ArrowUpRight className="h-3.5 w-3.5 text-slate-400" /></div></div>
          </div>

          {onOpenAssistant && <button type="button" onClick={onOpenAssistant} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700" title="Mở trợ lý Kora AI"><MessageCircle className="h-4 w-4" /><span>Hỏi Kora</span></button>}

          {onRefresh && <button type="button" onClick={onRefresh} disabled={isRefreshing} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 disabled:opacity-60 cursor-pointer" title="Làm mới trạng thái báo cáo"><RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} /><span className="sm:hidden">Làm mới</span></button>}
        </div>
      </div>
    </section>
  );
};
