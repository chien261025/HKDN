import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  FileSpreadsheet,
  Building2,
  Sliders,
  CheckCircle2,
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
    <div className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div className="space-y-2 max-w-2xl">
          {/* Status Indicators */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Đang Vận Hành Bình Thường
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 text-slate-700 font-medium border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              Kho Tổng Tân Bình • Zone A & Zone B
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Trung Tâm Điều Hành Kho Vận
          </h1>

          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
            Giám sát thời gian thực chuỗi xuất nhập kho, sơ đồ ô kệ Digital Twin, điều phối xuất hàng theo FEFO và bảo toàn số dư sổ cái kép.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onToggleSimulation && (
            <button
              onClick={onToggleSimulation}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                showSimulation
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              <span>{showSimulation ? 'Ẩn Kiểm Thử Tải' : 'Kiểm Thử Concurrency'}</span>
            </button>
          )}

          <Link
            to="/smartquery"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Truy Vấn Dữ Liệu</span>
          </Link>

          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-medium transition-colors border border-slate-300 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất Báo Cáo</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
