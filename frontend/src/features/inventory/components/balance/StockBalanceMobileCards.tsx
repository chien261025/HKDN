import React from 'react';
import { Lock, FileText, AlertTriangle, ArrowRightLeft, MapPin, Ban, Clock } from 'lucide-react';
import { StockItem } from '../../types';

interface StockBalanceMobileCardsProps {
  stocks: StockItem[];
  onReserveClick: (item: StockItem) => void;
  onViewLedger?: (item: StockItem) => void;
  onTransfer?: (item: StockItem) => void;
}

export const StockBalanceMobileCards: React.FC<StockBalanceMobileCardsProps> = ({
  stocks,
  onReserveClick,
  onViewLedger,
  onTransfer,
}) => {
  if (stocks.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 italic text-sm bg-white rounded-xl">
        Không tìm thấy mặt hàng nào trong kho.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {stocks.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
        >
          {/* Header: Name, SKU, Location */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-slate-900 text-sm leading-snug">
                {item.name}
              </div>
              <div className="text-slate-500 font-mono text-xs mt-0.5">
                SKU: <span className="font-medium text-slate-700">{item.sku}</span>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono text-xs font-bold border border-indigo-200/80 shrink-0">
              <MapPin className="w-3 h-3 text-indigo-600" />
              <span>{item.locationBarcode}</span>
            </span>
          </div>

          {/* Batch, Expiry Date & Tuổi Tồn Kho */}
          <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-slate-500">Mã lô: </span>
                <span className="font-mono font-semibold text-slate-800">{item.batchNumber}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">HSD: <strong className="text-slate-700 font-mono">{item.expiryDate}</strong></span>
                {item.isExpired ? (
                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                    <Ban className="w-2.5 h-2.5 text-rose-600" /> Đã Hết Hạn
                  </span>
                ) : item.isExpiringSoon ? (
                  <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded inline-flex items-center gap-0.5">
                    <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Cận Hạn {item.daysRemaining != null && item.daysRemaining >= 0 ? `(${item.daysRemaining}d)` : ''}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-2xs">
              <span className="text-slate-500">Tuổi tồn kho:</span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold border ${
                (item.daysInStock ?? 0) > 180
                  ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                  : (item.daysInStock ?? 0) >= 90
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : (item.daysInStock ?? 0) >= 30
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <Clock className="w-2.5 h-2.5" />
                <span>
                  {item.daysInStock ?? 0} ngày {(item.daysInStock ?? 0) > 180 ? '[Đọng vốn]' : (item.daysInStock ?? 0) >= 90 ? '[Tồn chậm]' : (item.daysInStock ?? 0) >= 30 ? '[Chuẩn]' : '[Mới]'}
                </span>
              </span>
            </div>
          </div>

          {/* Quantities 3-Column Grid */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70">
              <div className="text-[11px] text-slate-500">Tồn Cuối</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                {item.onHandQty.toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50/60 border border-amber-200/70">
              <div className="text-[11px] text-amber-700 font-medium">Đang Giữ</div>
              <div className="text-sm font-bold font-mono text-amber-800 mt-0.5">
                {item.reservedQty.toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-200/70">
              <div className="text-[11px] text-emerald-700 font-medium">Khả Dụng</div>
              <div className="text-sm font-bold font-mono text-emerald-800 mt-0.5">
                {item.availableQty.toLocaleString('vi-VN')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            {onViewLedger && (
              <button
                onClick={() => onViewLedger(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Phiếu</span>
              </button>
            )}
            {onTransfer && (
              <button
                onClick={() => onTransfer(item)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-medium cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Chuyển Kệ</span>
              </button>
            )}
            <button
              onClick={() => onReserveClick(item)}
              disabled={item.isExpired || item.availableQty <= 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
              title={item.isExpired ? 'Lô hàng đã hết hạn sử dụng' : 'Giữ hàng'}
            >
              <Lock className="w-3 h-3" />
              <span>Giữ Hàng</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
