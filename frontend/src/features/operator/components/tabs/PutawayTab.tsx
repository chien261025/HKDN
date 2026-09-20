import React, { useState } from 'react';
import { Layers, CheckCircle2, ScanLine, ArrowRight, MapPin, Scale, AlertCircle } from 'lucide-react';
import { PutawayTask } from '../../types';

interface PutawayTabProps {
  onOpenScanner: () => void;
}

export const PutawayTab: React.FC<PutawayTabProps> = ({ onOpenScanner }) => {
  const [tasks, setTasks] = useState<PutawayTask[]>([
    {
      id: 'put-01',
      sku: 'SKU-OMO-MATIC',
      productName: 'Nước giặt OMO Matic 3.6kg (12 thùng)',
      batchNumber: 'BATCH-OMO-02',
      qty: 12,
      weightKg: 43.2,
      suggestedLocation: 'ZA-A01-R01-S01-B02',
      suggestedZone: 'Khu A (Hàng Khô) • Tầng Trệt S01',
      status: 'PENDING',
    },
    {
      id: 'put-02',
      sku: 'SKU-SAMS-S24',
      productName: 'Samsung Galaxy S24 Ultra (5 hộp)',
      batchNumber: 'BATCH-S24-01',
      qty: 5,
      weightKg: 2.5,
      suggestedLocation: 'ZA-A01-R01-S02-B01',
      suggestedZone: 'Khu A (Điện Tử) • Tầng Cao S02',
      status: 'PENDING',
    },
  ]);

  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [scannedBin, setScannedBin] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleStartPutaway = (task: PutawayTask) => {
    setConfirmingId(task.id);
    setScannedBin('');
    setFeedback(null);
  };

  const handleConfirmScan = (task: PutawayTask) => {
    // Nếu quét đúng mã ô kệ hoặc bấm xác nhận
    if (scannedBin.trim() && scannedBin.trim() !== task.suggestedLocation) {
      setFeedback({
        msg: `Cảnh báo: Bạn đang quét ô ${scannedBin}, trong khi thuật toán chỉ định ô ${task.suggestedLocation}!`,
        type: 'error',
      });
      return;
    }

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'COMPLETED' } : t))
    );
    setConfirmingId(null);
    setFeedback({
      msg: `Thành công: Đã cất hàng vào ô ${task.suggestedLocation} an toàn!`,
      type: 'success',
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Cất Hàng Lên Ô Kệ (Put-Away)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Gợi ý vị trí theo tải trọng an toàn</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
          {tasks.filter((t) => t.status === 'PENDING').length} NHIỆM VỤ
        </span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          )}
          <span className="font-semibold">{feedback.msg}</span>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => {
          const isDone = task.status === 'COMPLETED';
          const isConfirming = confirmingId === task.id;

          return (
            <div
              key={task.id}
              className={`rounded-2xl p-5 border transition-all shadow-sm ${
                isDone
                  ? 'bg-slate-50/80 border-slate-200 opacity-70'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              {/* Top row */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{task.productName}</h3>
                  <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-2">
                    <span>Mã Lô: <strong className="text-indigo-700 font-bold">{task.batchNumber}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-700 font-bold">
                      <Scale className="w-3.5 h-3.5" /> {task.weightKg} kg
                    </span>
                  </div>
                </div>

                <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                  {task.qty} cái
                </span>
              </div>

              {/* Vị trí gợi ý */}
              <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-xs text-slate-500 font-sans font-medium block">VỊ TRÍ CHỈ ĐỊNH:</span>
                  <span className="font-bold text-indigo-700 text-sm flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    {task.suggestedLocation}
                  </span>
                </div>
                <div className="text-xs text-slate-600 text-right font-sans font-medium">
                  {task.suggestedZone}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3.5 pt-3 border-t border-slate-100">
                {isDone ? (
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>ĐÃ CẤT LÊN KỆ (STOCKED)</span>
                  </div>
                ) : isConfirming ? (
                  <div className="space-y-2.5">
                    <p className="text-xs text-amber-800 font-bold">
                      Đi đến kệ và quét mã vạch trên mép ô kệ để xác nhận:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scannedBin}
                        onChange={(e) => setScannedBin(e.target.value)}
                        placeholder={`VD: ${task.suggestedLocation}`}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono text-slate-900 font-semibold focus:outline-none focus:border-indigo-600"
                      />
                      <button
                        type="button"
                        onClick={() => setScannedBin(task.suggestedLocation)}
                        className="px-3 py-2 bg-slate-100 text-xs font-mono text-slate-700 font-semibold rounded-xl hover:bg-slate-200 border border-slate-200 cursor-pointer"
                        title="Tự động điền mã mẫu"
                      >
                        Mẫu
                      </button>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConfirmScan(task)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xác Nhận Đã Cất</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="px-4 py-2.5 bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartPutaway(task)}
                    className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Quét Ô Kệ Xác Nhận Cất Hàng</span>
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
