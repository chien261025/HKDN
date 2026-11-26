import React from 'react';
import { MapPin, Calendar, CheckCircle2, ScanLine } from 'lucide-react';
import { PickListItemResponseDto } from '../../services/operatorService';

interface PickingStepCardProps {
  step: PickListItemResponseDto;
  index: number;
  onConfirmStep: (index: number) => void;
}

export const PickingStepCard: React.FC<PickingStepCardProps> = ({
  step,
  index,
  onConfirmStep,
}) => {
  return (
    <div
      className={`rounded-2xl p-4 border transition-all shadow-xs ${
        step.picked
          ? 'bg-slate-50 border-slate-200 opacity-70'
          : 'bg-white border-amber-300 ring-2 ring-amber-50'
      }`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-black text-xs">
            CHẶNG #{index + 1}
          </span>
          <span className="font-mono font-bold text-slate-700">
            {step.picked ? '✓ Đã hoàn tất' : '● Điểm nhặt kế tiếp'}
          </span>
        </div>
        <span className="text-xs font-mono text-slate-500 font-medium">
          Lấy: <strong className="text-indigo-700 text-sm font-bold">{step.pickQty}</strong> cái
        </span>
      </div>

      <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
        <div>
          <div className="text-2xs font-mono text-slate-500 uppercase">Mã ô kệ:</div>
          <div className="font-mono text-sm font-black text-indigo-700 flex items-center gap-1.5 mt-0.5">
            <MapPin className="w-4 h-4 text-indigo-600" />
            {step.binBarcode}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xs font-mono text-slate-500 uppercase">Hạn dùng:</div>
          <div className="text-xs font-mono font-bold text-rose-700 flex items-center gap-1 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            {step.expiryDate}
          </div>
        </div>
      </div>

      <div className="mt-2.5 text-xs">
        <div className="font-bold text-slate-900">{step.productName || 'Sản phẩm chỉ định'}</div>
        <div className="text-2xs font-mono text-slate-500 mt-0.5">
          Lô: <strong className="text-amber-800">{step.batchNumber}</strong>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100">
        {step.picked ? (
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ĐÃ LẤY XONG {step.pickQty} CÁI</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onConfirmStep(index)}
            className="w-full py-2.5 min-h-[44px] bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Xác Nhận Lấy Hàng</span>
          </button>
        )}
      </div>
    </div>
  );
};
