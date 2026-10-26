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
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs">
      {/* Top accent indicator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500" />

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div className="space-y-2 max-w-2xl">
          {/* Operational Status Strip */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/80">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Hệ Thống Trực Tuyến
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Kho Tổng Tân Bình • Phân Khu A & B
            </span>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 font-medium border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Ca 1: 06:00 - 14:00
            </span>

            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-1 text-slate-400 font-mono text-[11px]">
              <RefreshCw className="w-3 h-3 text-slate-400 animate-spin" style={{ animationDuration: '8s' }} />
              Live 30s
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Trung Tâm Điều Hành Kho Vận Thông Minh
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Giám sát thời gian thực chuỗi xuất nhập kho, sơ đồ ô kệ Digital Twin, điều phối xuất hàng theo hạn dùng và bảo toàn số dư sổ cái tuyệt đối.
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
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>{showSimulation ? 'Đóng Giả Lập' : 'Công Cụ Giả Lập'}</span>
            </button>
          )}

          <Link
            to="/smartquery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
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
