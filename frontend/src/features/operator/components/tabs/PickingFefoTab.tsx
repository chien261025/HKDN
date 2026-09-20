import React, { useState } from 'react';
import { PackageCheck, CheckCircle2, ScanLine, MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { PickTask } from '../../types';

interface PickingFefoTabProps {
  onOpenScanner: () => void;
}

export const PickingFefoTab: React.FC<PickingFefoTabProps> = ({ onOpenScanner }) => {
  const [tasks, setTasks] = useState<PickTask[]>([
    {
      id: 'pick-01',
      orderCode: 'SO-2026-888',
      sku: 'SKU-MILK-100',
      productName: 'Sữa tươi Vinamilk 100% 1L',
      batchNumber: 'BATCH-MILK-26A',
      expiryDate: '2026-09-25',
      locationBarcode: 'ZB-B01-R01-S01-B05',
      qtyToPick: 20,
      pickedQty: 0,
      status: 'PENDING',
      stepNumber: 1,
    },
    {
      id: 'pick-02',
      orderCode: 'SO-2026-888',
      sku: 'SKU-OMO-MATIC',
      productName: 'Nước giặt OMO Matic 3.6kg',
      batchNumber: 'BATCH-OMO-01',
      expiryDate: '2026-10-07',
      locationBarcode: 'ZA-A01-R02-S01-B03',
      qtyToPick: 15,
      pickedQty: 0,
      status: 'PENDING',
      stepNumber: 2,
    },
  ]);

  const [activeTaskId, setActiveTaskId] = useState<string | null>('pick-01');
  const [scannedInput, setScannedInput] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleConfirmPick = (task: PickTask) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id ? { ...t, status: 'PICKED', pickedQty: t.qtyToPick } : t
      )
    );
    setSuccessNotice(`Đã nhặt thành công ${task.qtyToPick} cái ${task.productName} (FEFO Lô ${task.batchNumber})!`);
    setActiveTaskId(null);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Nhặt Hàng Xuất Kho (FEFO Picking)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Đơn hàng: <strong className="text-indigo-700 font-mono font-bold">SO-2026-888</strong></p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
          {pendingCount === 0 ? 'HOÀN TẤT' : `${pendingCount} MẶT HÀNG`}
        </span>
      </div>

      {/* Notice */}
      {successNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in shadow-2xs font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}

      {/* Pick Route Stepper */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isDone = task.status === 'PICKED';
          const isCurrent = activeTaskId === task.id;

          return (
            <div
              key={task.id}
              className={`rounded-2xl p-5 border transition-all shadow-sm ${
                isDone
                  ? 'bg-slate-50/80 border-slate-200 opacity-70'
                  : isCurrent
                  ? 'bg-white border-amber-400 ring-2 ring-amber-100'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                <span className="font-mono font-bold text-amber-800">
                  Bước {task.stepNumber}: Di chuyển đến ô kệ
                </span>
                <span className="text-xs font-mono text-slate-500 font-medium">
                  Cần nhặt: <strong className="text-indigo-700 text-sm font-bold">{task.qtyToPick}</strong> cái
                </span>
              </div>

              {/* Vị trí ô kệ lớn */}
              <div className="mt-3.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-mono text-slate-500 font-medium">MÃ VẠCH Ô KỆ:</div>
                  <div className="font-mono text-base font-black text-indigo-700 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    {task.locationBarcode}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-500 font-medium">CHUẨN FEFO:</div>
                  <div className="text-xs font-mono font-bold text-rose-700 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    HSD: {task.expiryDate}
                  </div>
                </div>
              </div>

              {/* Tên sản phẩm & Lô */}
              <div className="mt-3.5 text-xs space-y-1">
                <div className="font-bold text-slate-900 text-sm">{task.productName}</div>
                <div className="text-xs font-mono text-slate-500 font-medium">
                  Mã SKU: <strong className="text-slate-800">{task.sku}</strong> • Lô: <strong className="text-amber-800 font-bold">{task.batchNumber}</strong>
                </div>
              </div>

              {/* Action */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                {isDone ? (
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ĐÃ NHẶT ĐỦ {task.pickedQty} CÁI</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmPick(task)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <ScanLine className="w-4 h-4 text-slate-950" />
                    <span>Quét Xác Nhận & Nhặt Hàng</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
