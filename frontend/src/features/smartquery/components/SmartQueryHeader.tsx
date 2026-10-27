import React from 'react';
import { Search, ShieldCheck, Trash2, CheckCircle2 } from 'lucide-react';

interface SmartQueryHeaderProps {
  onClearHistory: () => void;
  messageCount: number;
}

export const SmartQueryHeader: React.FC<SmartQueryHeaderProps> = ({
  onClearHistory,
  messageCount,
}) => {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Title & Status */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Truy Vấn Dữ Liệu Tự Động (Smart Query)
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Read-Only Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tra cứu thông tin kho vận nhanh qua câu hỏi tự nhiên • Kiểm soát an toàn cú pháp qua bộ phân tích AST
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 self-end md:self-auto">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Giới hạn 50 dòng kết quả</span>
        </div>

        {messageCount > 1 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium transition-colors cursor-pointer"
            title="Làm mới lịch sử hội thoại"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Làm Mới</span>
          </button>
        )}
      </div>
    </div>
  );
};
