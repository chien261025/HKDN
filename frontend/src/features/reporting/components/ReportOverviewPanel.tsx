import React, { useState } from 'react';
import {
  CalendarClock,
  ShieldCheck,
  TrendingUp,
  HardDrive,
  CheckCircle2,
  Bell,
  Clock,
  Settings2,
  FileSpreadsheet
} from 'lucide-react';
import { ScheduledReport, ReportOverviewStats } from '../types';

interface ReportOverviewPanelProps {
  stats?: ReportOverviewStats;
}

const DEFAULT_SCHEDULES: ScheduledReport[] = [
  {
    id: 'SCH-01',
    title: 'Chốt Sổ Kho Cuối Ngày (EOD)',
    scheduleDescription: '23:59 Hàng ngày',
    targetRole: 'Kế Toán Kho & Trưởng Ca',
    format: 'Excel (.xlsx)',
    isEnabled: true,
    lastRunAt: 'Hôm qua 23:59',
  },
  {
    id: 'SCH-02',
    title: 'Cảnh Báo Lô Hàng Cận Date (FEFO)',
    scheduleDescription: '07:00 Thứ Hai hàng tuần',
    targetRole: 'Giám Sát Chất Lượng (QA/QC)',
    format: 'Excel (.xlsx)',
    isEnabled: true,
    lastRunAt: 'Thứ Hai 07:00',
  },
  {
    id: 'SCH-03',
    title: 'Tổng Hợp Lấp Đầy & Hiệu Suất Tháng',
    scheduleDescription: '17:00 Ngày cuối mỗi tháng',
    targetRole: 'Ban Giám Đốc Vận Hành',
    format: 'Excel (.xlsx)',
    isEnabled: true,
    lastRunAt: '30/09/2026',
  },
];

export const ReportOverviewPanel: React.FC<ReportOverviewPanelProps> = ({
  stats = {
    monthlyReportsCount: 48,
    reconciliationAccuracy: '100%',
    storageUsed: '184 MB',
    storageLimit: '10 GB',
    avgGenerationTime: '1.8s',
  },
}) => {
  const [schedules, setSchedules] = useState<ScheduledReport[]>(DEFAULT_SCHEDULES);

  const toggleSchedule = (id: string) => {
    setSchedules((prev) =>
      prev.map((sch) =>
        sch.id === id ? { ...sch, isEnabled: !sch.isEnabled } : sch
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. Monthly Metrics Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Chỉ Số Báo Cáo Tháng Này
            </h3>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Hoạt Động Tốt
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Đã kết xuất</div>
            <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
              {stats.monthlyReportsCount}{' '}
              <span className="text-xs font-sans font-normal text-emerald-600">+12%</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Báo cáo hoàn tất</div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500">Khớp đối soát</div>
            <div className="text-xl font-bold text-emerald-700 mt-1 font-mono">
              {stats.reconciliationAccuracy}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Không lệch tồn</div>
          </div>
        </div>

        {/* Dung lượng lưu trữ */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-600 font-medium flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" /> Dung lượng lưu trữ:
            </span>
            <span className="font-mono font-bold text-slate-900">
              {stats.storageUsed} / {stats.storageLimit}
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '18%' }}></div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Tự động tối ưu hóa</span>
            <span>Tốc độ: {stats.avgGenerationTime}</span>
          </div>
        </div>
      </div>

      {/* 2. Scheduled Reports (Tự Động Hóa Định Kỳ) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200">
              <CalendarClock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Lịch Xuất Báo Cáo Tự Động
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            3 Lịch chạy
          </span>
        </div>

        <div className="space-y-2.5">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className={`p-3 rounded-xl border transition-all ${
                sch.isEnabled
                  ? 'bg-white border-slate-200 hover:border-sky-300'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900 leading-snug">
                    {sch.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium text-sky-700">
                      <Clock className="w-3 h-3" /> {sch.scheduleDescription}
                    </span>
                    <span>•</span>
                    <span>{sch.format}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Gửi tới: <span className="text-slate-600 font-medium">{sch.targetRole}</span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => toggleSchedule(sch.id)}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                    sch.isEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                  title={sch.isEnabled ? 'Đang bật tự động' : 'Đã tạm dừng'}
                >
                  <span className="w-4 h-4 bg-white rounded-full shadow-md"></span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Security & Enterprise Compliance */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 text-white shadow-sm space-y-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Bảo Mật & Tiêu Chuẩn Doanh Nghiệp</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Tất cả báo cáo xuất ra được mã hóa chuẩn <strong>AES-256</strong>. Đường dẫn tải về bảo mật theo phiên đăng nhập và tuân thủ chuẩn kiểm toán nội bộ kho vận.
        </p>
        <div className="pt-2 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>Thời hạn lưu trữ: 30 ngày</span>
          <span className="text-emerald-400 font-semibold">ISO 9001:2015</span>
        </div>
      </div>
    </div>
  );
};
