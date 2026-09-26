import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowUpRight,
  FileSpreadsheet,
  Building2,
  Clock,
  Sliders,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface DashboardHeroHeaderProps {
  onToggleSimulation?: () => void;
  showSimulation?: boolean;
}

export const DashboardHeroHeader: React.FC<DashboardHeroHeaderProps> = ({
  onToggleSimulation,
  showSimulation = false,
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-slate-50/70 to-indigo-50/40 p-5 sm:p-6 border border-slate-200/90 shadow-xs">
      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold tracking-wide uppercase">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Hệ Thống Trực Tuyến
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Kho Tổng Tân Bình (ZONE A & B)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Ca 1: 06:00 - 14:00
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200">
              <RefreshCw className="w-3 h-3 text-slate-500" />
              Tự động cập nhật: 30s
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trung Tâm Điều Hành Kho Vận Thông Minh
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Giám sát thời gian thực toàn bộ chuỗi xuất nhập kho, quản lý ô kệ Digital Twin, điều phối xuất hàng theo hạn dùng và đảm bảo an toàn tồn kho tuyệt đối.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onToggleSimulation && (
            <button
              onClick={onToggleSimulation}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
                showSimulation
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs hover:border-slate-300'
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>{showSimulation ? 'Đóng Công Cụ Giả Lập' : 'Công Cụ Giả Lập & Khóa'}</span>
            </button>
          )}

          <Link
            to="/smartquery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Trợ Lý AI (Text-to-SQL)</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </Link>

          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-slate-200 shadow-2xs hover:border-slate-300 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Báo Cáo</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
