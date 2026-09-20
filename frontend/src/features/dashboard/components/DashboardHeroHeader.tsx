import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowUpRight, FileSpreadsheet, Activity } from 'lucide-react';

export const DashboardHeroHeader: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-white via-slate-50/70 to-indigo-50/30 p-6 sm:p-7 border border-slate-200/90 shadow-xs">
      {/* Decorative ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none -z-0"></div>
      <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-100/30 rounded-full blur-2xl pointer-events-none -z-0"></div>

      <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-bold tracking-wide uppercase shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Hệ Thống Trực Tuyến • Event-Driven Modular Monolith
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Trung Tâm Điều Hành Kho Thông Minh
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed font-normal">
            Giám sát thời gian thực ô kệ kho vận, điều phối xuất hàng theo hạn dùng{' '}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
              FEFO
            </span>
            , và bảo vệ chống âm kho bằng cơ chế{' '}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold">
              Khóa Bi Quan (Pessimistic Locking)
            </span>
            .
          </p>
        </div>

        {/* Action buttons with high-end SaaS styling */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/smartquery"
            className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Hỏi Trợ Lý AI (Text-to-SQL)</span>
            <ArrowUpRight className="w-4 h-4 opacity-80" />
          </Link>

          <Link
            to="/reports"
            className="inline-flex items-center gap-2 px-4.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-xl text-sm font-semibold transition-all border border-slate-200 shadow-2xs hover:border-slate-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Báo Cáo Lớn (RabbitMQ)</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
