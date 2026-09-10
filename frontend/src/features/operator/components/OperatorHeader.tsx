import React from 'react';
import { Smartphone, Wifi, BatteryCharging, User, ScanLine, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OperatorHeaderProps {
  onOpenScanner: () => void;
}

export const OperatorHeader: React.FC<OperatorHeaderProps> = ({ onOpenScanner }) => {
  return (
    <header className="bg-[#0b101d] border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 shadow-lg">
      {/* Top Device Status Line */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <Smartphone className="w-3 h-3" /> PDA Zebra TC21
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-cyan-400">
            <Wifi className="w-3 h-3" /> Kho 1 (5GHz)
          </span>
        </div>

        <div className="flex items-center gap-1 text-emerald-400">
          <BatteryCharging className="w-3.5 h-3.5" />
          <span>92%</span>
        </div>
      </div>

      {/* Main Operator Row */}
      <div className="flex items-center justify-between pt-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            TK
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-white">Trần Văn Thao</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                OPERATOR
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Ca sáng • Vận hành hiện trường</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-900/30 transition-all active:scale-95"
          >
            <ScanLine className="w-4 h-4" />
            <span>Quét Mã</span>
          </button>

          <Link
            to="/"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
            title="Quay lại Tháp Chỉ Huy (Desktop)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
