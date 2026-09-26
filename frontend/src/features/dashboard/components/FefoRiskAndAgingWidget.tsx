import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  DollarSign,
  ArrowUpRight,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface CriticalBatch {
  id: string;
  sku: string;
  productName: string;
  batchCode: string;
  binLocation: string;
  qty: number;
  unit: string;
  daysRemaining: number;
  valueVnd: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'AGING';
  status: 'PENDING' | 'PRIORITIZED';
}

const initialBatches: CriticalBatch[] = [
  {
    id: '1',
    sku: 'SKU-GLD-900',
    productName: 'Sữa bột dinh dưỡng Gold 900g',
    batchCode: 'BATCH-GLD-09',
    binLocation: 'ZA-A01-R03',
    qty: 45,
    unit: 'lon',
    daysRemaining: 18,
    valueVnd: 21600000,
    riskLevel: 'CRITICAL',
    status: 'PENDING',
  },
  {
    id: '2',
    sku: 'SKU-MILK-100',
    productName: 'Sữa tươi Vinamilk 100% 1L',
    batchCode: 'BATCH-MILK-26A',
    binLocation: 'ZB-B01-R01',
    qty: 80,
    unit: 'hộp',
    daysRemaining: 25,
    valueVnd: 2800000,
    riskLevel: 'CRITICAL',
    status: 'PENDING',
  },
  {
    id: '3',
    sku: 'SKU-NAB-12',
    productName: 'Bánh xốp dinh dưỡng Nabati',
    batchCode: 'BATCH-NAB-12',
    binLocation: 'ZA-A02-R02',
    qty: 120,
    unit: 'gói',
    daysRemaining: 29,
    valueVnd: 11000000,
    riskLevel: 'WARNING',
    status: 'PENDING',
  },
  {
    id: '4',
    sku: 'SKU-OMO-MATIC',
    productName: 'Nước giặt OMO Matic 3.6kg',
    batchCode: 'BATCH-OMO-01',
    binLocation: 'ZA-A01-R02',
    qty: 60,
    unit: 'can',
    daysRemaining: 0,
    valueVnd: 13200000,
    riskLevel: 'AGING',
    status: 'PENDING',
  },
];

export const FefoRiskAndAgingWidget: React.FC = () => {
  const [batches, setBatches] = useState<CriticalBatch[]>(initialBatches);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const totalRiskValue = batches.reduce((acc, curr) => acc + curr.valueVnd, 0);

  const handlePrioritize = (id: string, batchCode: string) => {
    setBatches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'PRIORITIZED' } : b))
    );
    setToastMessage(`Đã đưa lô hàng [${batchCode}] lên ưu tiên xuất kho hàng đầu!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Flame className="w-4 h-4 text-amber-600" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Kiểm Soát Rủi Ro FEFO & Giá Trị Hàng Tồn
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cảnh báo các lô hàng cận hạn dùng và tồn đọng vốn cần xử lý ưu tiên
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 font-mono">
            RỦI RO: {totalRiskValue.toLocaleString('vi-VN')} đ
          </span>
        </div>
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Summary KPI Micro-cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100">
          <div className="flex items-center justify-between text-rose-700 text-[11px] font-semibold">
            <span>Cận Date (&lt;30 ngày)</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <p className="text-lg font-black text-rose-700 font-mono mt-0.5">35.400.000 đ</p>
          <p className="text-[10px] text-rose-600 font-medium">03 lô hàng ưu tiên xuất</p>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100">
          <div className="flex items-center justify-between text-amber-700 text-[11px] font-semibold">
            <span>Đọng vốn (&gt;60 ngày)</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-lg font-black text-amber-800 font-mono mt-0.5">13.200.000 đ</p>
          <p className="text-[10px] text-amber-700 font-medium">01 lô hàng chậm luân chuyển</p>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <div className="flex items-center justify-between text-emerald-700 text-[11px] font-semibold">
            <span>Bảo toàn tồn kho</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-lg font-black text-emerald-800 font-mono mt-0.5">96.8%</p>
          <p className="text-[10px] text-emerald-700 font-medium">0 hư hao, 0 hết hạn kho</p>
        </div>
      </div>

      {/* Batches Table List */}
      <div className="space-y-2">
        <div className="text-xs font-bold text-slate-600 px-1 flex items-center justify-between">
          <span>Lô hàng cảnh báo nguy cơ</span>
          <span className="text-[11px] text-slate-400 font-normal">Điều phối FEFO tự động</span>
        </div>

        <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1 text-xs">
          {batches.map((b) => (
            <div
              key={b.id}
              className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                b.status === 'PRIORITIZED'
                  ? 'bg-emerald-50/30 border-emerald-200'
                  : b.riskLevel === 'CRITICAL'
                  ? 'bg-rose-50/20 border-rose-200 hover:border-rose-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 truncate">{b.productName}</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                    {b.batchCode}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500 font-medium">
                    Ô: {b.binLocation}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                  <span>
                    Số lượng: <b className="text-slate-800 font-mono">{b.qty}</b> {b.unit}
                  </span>
                  <span>•</span>
                  <span>
                    Trị giá:{' '}
                    <b className="text-rose-600 font-mono font-bold">
                      {b.valueVnd.toLocaleString('vi-VN')} đ
                    </b>
                  </span>
                  <span>•</span>
                  {b.riskLevel === 'AGING' ? (
                    <span className="text-amber-700 font-semibold">Tồn đọng &gt;60 ngày</span>
                  ) : (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Còn {b.daysRemaining} ngày
                    </span>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 flex items-center gap-2">
                {b.status === 'PRIORITIZED' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ĐÃ ƯU TIÊN
                  </span>
                ) : (
                  <button
                    onClick={() => handlePrioritize(b.id, b.batchCode)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                  >
                    <span>Ưu tiên xuất</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
