import React from 'react';
import { ShieldCheck, Lock, Cpu, Bot } from 'lucide-react';

export const SecurityBadges: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5 shadow-2xs">
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex-shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-slate-900 font-mono text-xs">JWT + BCrypt</div>
          <div className="text-slate-500 text-xs font-medium">Phiên token 8h</div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5 shadow-2xs">
        <div className="p-2 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 flex-shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-slate-900 font-mono text-xs">Pessimistic Lock</div>
          <div className="text-slate-500 text-xs font-medium">Chống âm kho race condition</div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5 shadow-2xs">
        <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-slate-900 font-mono text-xs">RabbitMQ Async</div>
          <div className="text-slate-500 text-xs font-medium">SXSSF RAM &lt; 50MB</div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center gap-2.5 shadow-2xs">
        <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex-shrink-0">
          <Bot className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-slate-900 font-mono text-xs">JSqlParser AST</div>
          <div className="text-slate-500 text-xs font-medium">Chặn SQL Injection</div>
        </div>
      </div>
    </div>
  );
};
