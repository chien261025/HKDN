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
      <div className="p-3.5 rounded-2xl bg-[#0d1322] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              3. Nhặt Hàng Xuất Kho (FEFO Picking)
            </h2>
            <p className="text-[11px] text-slate-400">Đơn hàng: <strong className="text-cyan-300 font-mono">SO-2026-888</strong></p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
          {pendingCount === 0 ? 'HOÀN TẤT' : `${pendingCount} MẶT HÀNG`}
        </span>
      </div>

      {/* Notice */}
      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
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
              className={`rounded-2xl p-4 border transition-all shadow-lg ${
                isDone
                  ? 'bg-[#090d18] border-slate-800/60 opacity-60'
                  : isCurrent
                  ? 'bg-[#0b101d] border-amber-500/50 shadow-amber-950/30'
                  : 'bg-[#0b101d] border-slate-800'
              }`}
            >
              {/* Step indicator */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
                <span className="font-mono font-bold text-amber-400">
                  Bước {task.stepNumber}: Di chuyển đến ô kệ
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Cần nhặt: <strong className="text-emerald-400 text-xs">{task.qtyToPick}</strong> cái
                </span>
              </div>

              {/* Vị trí ô kệ lớn */}
              <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-slate-500">MÃ VẠCH Ô KỆ:</div>
                  <div className="font-mono text-sm font-extrabold text-cyan-300 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-cyan-400" />
                    {task.locationBarcode}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500">CHUẨN FEFO:</div>
                  <div className="text-[11px] font-mono font-bold text-rose-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    HSD: {task.expiryDate}
                  </div>
                </div>
              </div>

              {/* Tên sản phẩm & Lô */}
              <div className="mt-3 text-xs space-y-1">
                <div className="font-bold text-white">{task.productName}</div>
                <div className="text-[11px] font-mono text-slate-400">
                  Mã SKU: <strong className="text-slate-200">{task.sku}</strong> • Lô: <strong className="text-amber-300">{task.batchNumber}</strong>
                </div>
              </div>

              {/* Action */}
              <div className="mt-3 pt-2 border-t border-slate-800/60">
                {isDone ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ĐÃ NHẶT ĐỦ {task.pickedQty} CÁI</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConfirmPick(task)}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 active:scale-95 transition-all"
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
