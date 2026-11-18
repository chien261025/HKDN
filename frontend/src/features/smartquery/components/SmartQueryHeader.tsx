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
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Title & Status */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 ring-4 ring-blue-50 flex-shrink-0">
          <Search className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Truy Vấn Dữ Liệu Tự Động
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Tra cứu thông tin kho vận nhanh qua câu hỏi tự nhiên • Kiểm soát an toàn cú pháp AST
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 self-end md:self-auto">
        {/* <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Giới hạn 50 dòng kết quả</span>
        </div> */}

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
