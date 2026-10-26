import React from 'react';
import { MapPin } from 'lucide-react';
import { AuditItemDiscrepancy } from '../types';

interface AuditLocationListProps {
  items: AuditItemDiscrepancy[];
  selectedItemIndex: number;
  countedBins: number;
  totalBins: number;
  onSelectItem: (index: number) => void;
}

export const AuditLocationList: React.FC<AuditLocationListProps> = ({
  items,
  selectedItemIndex,
  countedBins,
  totalBins,
  onSelectItem,
}) => {
  return (
    <div className="md:col-span-5 p-4 overflow-y-auto space-y-2 bg-slate-50/50">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
        <span>Danh Sách Ô Kệ ({countedBins}/{totalBins})</span>
        <span className="text-emerald-600 font-mono">
          {Math.round((countedBins / (totalBins || 1)) * 100)}%
        </span>
      </div>

      <div className="space-y-1.5">
        {items.map((it, idx) => {
          const isSelected = idx === selectedItemIndex;
          const isCounted = it.countedQty !== null;
          const itemDiff = isCounted ? (it.countedQty! - it.systemQty) : 0;

          return (
            <button
              key={it.id || idx}
              onClick={() => onSelectItem(idx)}
              className={`w-full text-left p-3 rounded-xl border transition-all text-xs font-mono flex items-center justify-between ${
                isSelected
                  ? 'bg-emerald-50/70 border-emerald-500 ring-1 ring-emerald-500 text-emerald-950 font-bold shadow-xs'
                  : isCounted
                  ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  : 'bg-white/60 border-dashed border-slate-300 text-slate-500 hover:bg-white'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{it.locationBarcode}</span>
                </div>
                <div className="text-[11px] font-sans text-slate-500 line-clamp-1">{it.productName}</div>
              </div>

              <div className="text-right">
                {isCounted ? (
                  itemDiff === 0 ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold text-[10px]">Khớp</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                      {itemDiff > 0 ? `+${itemDiff}` : itemDiff}
                    </span>
                  )
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px]">Chưa đếm</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
