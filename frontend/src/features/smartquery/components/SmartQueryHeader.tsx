import React from 'react';
import { Bot, ShieldCheck, Cpu, Trash2, CheckCircle2 } from 'lucide-react';

interface SmartQueryHeaderProps {
  onClearHistory: () => void;
  messageCount: number;
}

export const SmartQueryHeader: React.FC<SmartQueryHeaderProps> = ({
  onClearHistory,
  messageCount,
}) => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Left Title & Status */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-100 flex-shrink-0">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
              Trợ Lý AI Smart Query (Text-to-SQL AST)
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono bg-cyan-50 text-cyan-800 px-3 py-1 rounded-full border border-cyan-200">
              <Cpu className="w-3.5 h-3.5 text-cyan-600" /> JSqlParser Engine
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Anti-SQL Injection
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            Hỏi đáp kho bằng tiếng Việt tự nhiên • Kiểm duyệt an toàn cú pháp AST • Tự động tiêm LIMIT 50 chống quá tải RAM
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 self-end md:self-auto">
        <div className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>AST Sandbox: <strong className="text-emerald-700 font-bold">READ ONLY</strong></span>
        </div>

        {messageCount > 1 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-600 hover:text-rose-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Xóa lịch sử hội thoại"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Xóa Lịch Sử</span>
          </button>
        )}
      </div>
    </div>
  );
};
