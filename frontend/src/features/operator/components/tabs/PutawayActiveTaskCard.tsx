import React from 'react';
import { MapPin, ScanLine, CheckCircle2 } from 'lucide-react';
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
  onOpenScanner: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export const PutawayActiveTaskCard: React.FC<PutawayActiveTaskCardProps> = ({
  activeTask,
  scannedBin,
  onChangeScannedBin,
  onOpenScanner,
  onCancel,
  onConfirm,
}) => {
  if (!activeTask.suggestedLocation) return null;

  return (
    <div className="bg-white rounded-2xl p-5 border-2 border-indigo-500 shadow-md space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-xs font-black text-indigo-900 uppercase">
          {activeTask.orderCode ? `Cất Hàng Đơn ${activeTask.orderCode}` : 'Đang Thực Hiện Cất Hàng'}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 font-mono">
          THUẬT TOÁN CHỈ ĐỊNH
        </span>
      </div>

      <div>
        <span className="text-xs text-slate-500 font-medium">Mặt hàng:</span>
        <div className="font-bold text-slate-900 text-sm">{activeTask.productName}</div>
        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
          <span>SKU: <strong className="text-slate-700">{activeTask.sku}</strong></span>
          <span>• Số lượng: <strong className="text-indigo-700">{activeTask.qty} {activeTask.unit || 'cái'}</strong></span>
          <span>• Trọng lượng: <strong>{activeTask.weightKg}kg</strong></span>
          {activeTask.batchNumber && <span>• Lô: <strong>{activeTask.batchNumber}</strong></span>}
          {activeTask.expiryDate && <span>• HSD: <strong>{activeTask.expiryDate}</strong></span>}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-indigo-900">Vị Trí Ô Kệ Chỉ Định:</div>
          <div className="font-mono font-black text-indigo-700 text-base mt-0.5">
            {activeTask.suggestedLocation.binBarcode}
          </div>
          <div className="text-xs text-indigo-600 mt-0.5">
            Phân khu {activeTask.suggestedLocation.zoneCode} • Tầng đáy {activeTask.suggestedLocation.shelf}
          </div>
        </div>
        <MapPin className="w-6 h-6 text-indigo-600" />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-700">Xác Nhận Quét Mã Ô Kệ:</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="VD: WH01-ZA-A01-R01-S01-B01"
            value={scannedBin}
            onChange={(e) => onChangeScannedBin(e.target.value)}
            className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 font-semibold"
          />
          <button
            type="button"
            onClick={onOpenScanner}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Quét</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
        >
          Hủy Bỏ
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Xác Nhận Đã Đặt Vào Kệ</span>
        </button>
      </div>
    </div>
  );
};
