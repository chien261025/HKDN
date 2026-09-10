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
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Left Title & Status */}
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 flex-shrink-0 ring-1 ring-white/20">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
              Trợ Lý AI Smart Query (Text-to-SQL AST)
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-cyan-500/10 text-cyan-300 px-2.5 py-0.5 rounded-full border border-cyan-500/30 font-bold">
              <Cpu className="w-3 h-3" /> JSqlParser Engine
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
              <ShieldCheck className="w-3 h-3" /> Anti-SQL Injection
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hỏi đáp kho bằng tiếng Việt tự nhiên • Kiểm duyệt an toàn cú pháp AST • Tự động tiêm LIMIT 50 chống quá tải RAM
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 self-end md:self-auto">
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>AST Sandbox: <strong className="text-emerald-400 font-bold">READ ONLY</strong></span>
        </div>

        {messageCount > 1 && (
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-400 text-xs font-semibold transition-all"
            title="Xóa lịch sử hội thoại"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xóa Lịch Sử</span>
          </button>
        )}
      </div>
    </div>
  );
};
