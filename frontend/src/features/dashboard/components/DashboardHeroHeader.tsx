import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight, FileSpreadsheet } from 'lucide-react';

export const DashboardHeroHeader: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#111827] to-slate-900 p-5 sm:p-6 border border-slate-800 shadow-xl">
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase">
              Hệ Thống Trực Tuyến • Event-Driven Modular Monolith
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Trung Tâm Điều Hành Kho Thông Minh
          </h1>

          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Giám sát thời gian thực ô kệ kho vận, điều phối xuất hàng theo hạn dùng <span className="text-amber-400 font-semibold">FEFO</span>, và bảo vệ chống âm kho bằng cơ chế <span className="text-cyan-400 font-semibold">Khóa Bi Quan (Pessimistic Locking)</span>.
          </p>
        </div>

        {/* Nút hành động nhanh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/smartquery"
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
            <span>Hỏi Trợ Lý AI (Text-to-SQL)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-indigo-300" />
          </Link>

          <Link
            to="/reports"
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-750 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-700/80"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Báo Cáo Lớn (RabbitMQ)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
