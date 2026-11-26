import React from 'react';
import { MapPin, ScanLine, CheckCircle2, Split, RefreshCw, AlertCircle } from 'lucide-react';
import { LocationDto } from '../../services/operatorService';

export interface ActivePutawayTask {
  id: string;
  orderId?: number;
  orderCode?: string;
  warehouseId: number;
  stockedQty: number;
  orderItemId?: number;
  productId?: number;
  sku: string;
  productName: string;
  unit?: string;
  batchNumber?: string;
  expiryDate?: string;
  weightKg: number;
  qty: number;
  preferredZone: string;
  suggestedLocation?: LocationDto;
  status: 'PENDING' | 'SUGGESTED' | 'COMPLETED';
}

interface PutawayActiveTaskCardProps {
  activeTask: ActivePutawayTask;
  scannedBin: string;
  onChangeScannedBin: (val: string) => void;
  placedQty: number;
  onChangePlacedQty: (val: number) => void;
  onOpenScanner: () => void;
  onRequestAlternate: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PutawayActiveTaskCard: React.FC<PutawayActiveTaskCardProps> = ({
  activeTask,
  scannedBin,
  onChangeScannedBin,
  placedQty,
  onChangePlacedQty,
  onOpenScanner,
  onRequestAlternate,
  onCancel,
  onConfirm,
}) => {
  if (!activeTask.suggestedLocation) return null;

  const isSplit = placedQty < activeTask.qty;
  const remainingQty = activeTask.qty - placedQty;
  const unit = activeTask.unit || 'thùng';

  return (
    <div id="putaway-active-card-anchor" className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-indigo-500 shadow-md space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-900 uppercase">
            {activeTask.orderCode ? `Cất Hàng: ${activeTask.orderCode}` : 'Nhiệm Vụ Cất Hàng'}
          </span>
          {isSplit && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
              <Split className="w-3 h-3 text-amber-600" /> Chia Đợt Cất
            </span>
          )}
        </div>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 font-mono">
          VỊ TRÍ GỢI Ý
        </span>
      </div>

      <div>
        <span className="text-2xs text-slate-500 font-bold uppercase">Mặt hàng & Lô:</span>
        <div className="font-bold text-slate-900 text-sm mt-0.5">{activeTask.productName}</div>
        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
          <span>SKU: <strong className="text-slate-700">{activeTask.sku}</strong></span>
          <span>• Chờ cất: <strong className="text-indigo-700">{activeTask.qty} {unit}</strong></span>
          <span>• Tải trọng ước tính: <strong>{activeTask.weightKg}kg</strong></span>
          {activeTask.batchNumber && <span>• Lô: <strong className="text-slate-800">{activeTask.batchNumber}</strong></span>}
          {activeTask.expiryDate && <span>• HSD: <strong>{activeTask.expiryDate}</strong></span>}
        </div>
      </div>

      {/* Suggested Location Box */}
      <div className="p-3.5 rounded-xl bg-indigo-50/90 border border-indigo-200 flex items-center justify-between">
        <div>
          <div className="text-2xs font-extrabold uppercase text-indigo-800">Vị Trí Ô Kệ Chỉ Định:</div>
          <div className="font-mono font-black text-indigo-700 text-base sm:text-lg mt-0.5">
            {activeTask.suggestedLocation.binBarcode}
          </div>
          <div className="text-xs text-indigo-600 mt-0.5 font-medium">
            Phân khu {activeTask.suggestedLocation.zoneCode} • Tầng {activeTask.suggestedLocation.shelf} • Dãy {activeTask.suggestedLocation.aisle}
          </div>
        </div>
        <button
          type="button"
          onClick={onRequestAlternate}
          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-300 rounded-lg text-2xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
          title="Đổi ô kệ khác nếu ô này đang bị kẹt hoặc đầy thực tế"
        >
          <RefreshCw className="w-3 h-3" /> Đổi Ô Kệ
        </button>
      </div>

      {/* Số lượng cất vào ô này (Hỗ trợ chia nhỏ theo Pallet/Sức chứa ô) */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <label className="font-extrabold text-slate-700 uppercase text-2xs">
            Số lượng cất vào ô này ({unit}):
          </label>
          <span className="text-2xs font-mono text-slate-500">
            {isSplit ? (
              <span className="text-amber-700 font-bold">Còn lại {remainingQty} {unit} sẽ cất ô tiếp</span>
            ) : (
              <span className="text-emerald-700 font-bold">Cất trọn gói toàn bộ</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={activeTask.qty}
            value={placedQty || ''}
            onChange={(e) => onChangePlacedQty(Math.max(1, Math.min(activeTask.qty, Number(e.target.value))))}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-base text-center text-slate-900 focus:outline-none focus:border-indigo-600"
          />
          <button
            type="button"
            onClick={() => onChangePlacedQty(activeTask.qty)}
            className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer whitespace-nowrap"
          >
            Tất Cả ({activeTask.qty})
          </button>
        </div>
      </div>

      {/* Xác nhận quét mã ô kệ */}
      <div className="space-y-1.5">
        <label className="text-2xs font-extrabold uppercase text-slate-700">
          Xác Nhận Quét Mã Vạch Ô Kệ:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={`VD: ${activeTask.suggestedLocation.binBarcode}`}
            value={scannedBin}
            onChange={(e) => onChangeScannedBin(e.target.value)}
            className="flex-1 px-3 py-2.5 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 font-bold text-slate-900"
          />
          <button
            type="button"
            onClick={onOpenScanner}
            className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Quét</span>
          </button>
        </div>
      </div>

      {/* Nút hành động */}
      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Hủy Bỏ
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-2 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {isSplit
              ? `Cất ${placedQty} ${unit} & Gợi Ý Ô Tiếp`
              : `Xác Nhận Đã Đặt Vào Kệ (${placedQty} ${unit})`}
          </span>
        </button>
      </div>
    </div>
  );
};
