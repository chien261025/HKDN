import React from 'react';
import { LedgerEntryData } from '../../types';
import { FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RecentLedgerCardProps {
  history: LedgerEntryData[];
  onSelectEntry: (entry: LedgerEntryData) => void;
}

export const RecentLedgerCard: React.FC<RecentLedgerCardProps> = ({
  history,
  onSelectEntry,
}) => {
  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Sổ Cái Thẻ Kho Bất Biến (Immutable Stock Ledger)
          </span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 font-bold">
          AUDIT TRAIL
        </span>
      </div>

      {/* Danh sách bút toán thẻ kho */}
      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
        {history.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectEntry(item)}
            className="p-3 rounded-xl bg-slate-950/60 hover:bg-slate-850/70 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all text-xs space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-indigo-300 group-hover:text-cyan-300 transition-colors">
                {item.id}
              </span>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  item.qtyChange < 0
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                }`}
              >
                {item.qtyChange < 0 ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : (
                  <ArrowUpRight className="w-3 h-3" />
                )}
                <span>{item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange}</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="truncate max-w-[180px] font-medium">{item.productName}</span>
              <span className="font-mono text-white font-semibold">Tồn sau: {item.balanceAfter}</span>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-850/80">
              <span>Đơn: {item.referenceCode}</span>
              <span>{item.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
