import React from 'react';
import { LedgerEntryData } from '../../types';

interface RecentLedgerCardProps {
  history: LedgerEntryData[];
  onSelectEntry: (entry: LedgerEntryData) => void;
}

export const RecentLedgerCard: React.FC<RecentLedgerCardProps> = ({
  history,
  onSelectEntry,
}) => {
  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Sổ cái thẻ kho gần nhất (Ledger)
        </span>
        <span className="text-[10px] font-mono text-slate-400">Bất biến</span>
      </div>

      <div className="space-y-2 max-h-[260px] overflow-y-auto">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectEntry(item)}
            className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-850/60 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-colors text-xs space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-300">{item.id}</span>
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  item.qtyChange < 0
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[160px]">{item.productName}</span>
              <span className="font-mono text-slate-200">Tồn sau: {item.balanceAfter}</span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-850">
              <span>Đơn: {item.referenceCode}</span>
              <span>{item.timestamp.split(' ')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
