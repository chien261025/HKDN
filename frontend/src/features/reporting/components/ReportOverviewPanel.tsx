import React from 'react';
import {
  TrendingUp,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
} from 'lucide-react';
import { ReportJob } from '../types';

interface ReportOverviewPanelProps {
  jobs?: ReportJob[];
  selectedMonth?: string;
}

export const ReportOverviewPanel: React.FC<ReportOverviewPanelProps> = ({
  jobs = [],
  selectedMonth,
}) => {
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const totalCount = jobs.length;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Tổng Quan Kết Xuất
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Sẵn sàng
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Tổng lượt xuất</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">{totalCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tệp báo cáo đã tạo</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Đã hoàn tất</div>
            <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">{completedCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Sẵn sàng tải xuống</div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Kỳ dữ liệu đang chọn:
            </span>
            <span className="font-mono font-bold text-slate-900">{selectedMonth || 'Tháng hiện tại'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Định dạng tải về:
            </span>
            <span className="font-semibold text-emerald-700">Microsoft Excel (.xlsx)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
