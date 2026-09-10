import React from 'react';
import { ShieldCheck, Lock, Cpu, Bot } from 'lucide-react';

export const SecurityBadges: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-white font-mono text-[10px]">JWT + BCrypt</div>
          <div className="text-slate-400 text-[9px]">Phiên phiên token 8h</div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex-shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-white font-mono text-[10px]">Pessimistic Lock</div>
          <div className="text-slate-400 text-[9px]">Chống âm kho race condition</div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex-shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-white font-mono text-[10px]">RabbitMQ Async</div>
          <div className="text-slate-400 text-[9px]">SXSSF RAM &lt; 50MB</div>
        </div>
      </div>

      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 flex-shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-white font-mono text-[10px]">JSqlParser AST</div>
          <div className="text-slate-400 text-[9px]">Chặn SQL Injection</div>
        </div>
      </div>
    </div>
  );
};
