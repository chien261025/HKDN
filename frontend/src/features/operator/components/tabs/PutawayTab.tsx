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
      <div className="p-3.5 rounded-2xl bg-[#0d1322] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              2. Cất Hàng Lên Ô Kệ (Put-Away)
            </h2>
            <p className="text-[11px] text-slate-400">Gợi ý vị trí theo tải trọng an toàn</p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          {tasks.filter((t) => t.status === 'PENDING').length} NHIỆM VỤ
        </span>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
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
              className={`rounded-2xl p-4 border transition-all shadow-lg ${
                isDone
                  ? 'bg-[#090d18] border-slate-800/60 opacity-60'
                  : 'bg-[#0b101d] border-slate-800 hover:border-indigo-500/40'
              }`}
            >
              {/* Top row */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-bold text-white">{task.productName}</h3>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Mã Lô: <strong className="text-cyan-300">{task.batchNumber}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-300">
                      <Scale className="w-3 h-3" /> {task.weightKg} kg
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {task.qty} cái
                </span>
              </div>

              {/* Vị trí gợi ý */}
              <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block">VỊ TRÍ CHỈ ĐỊNH:</span>
                  <span className="font-bold text-indigo-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {task.suggestedLocation}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 text-right font-sans">
                  {task.suggestedZone}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-3 pt-2 border-t border-slate-800/60">
                {isDone ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ĐÃ CẤT LÊN KỆ (STOCKED)</span>
                  </div>
                ) : isConfirming ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-amber-300 font-medium">
                      Đi đến kệ và quét mã vạch trên mép ô kệ để xác nhận:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={scannedBin}
                        onChange={(e) => setScannedBin(e.target.value)}
                        placeholder={`VD: ${task.suggestedLocation}`}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setScannedBin(task.suggestedLocation)}
                        className="px-2.5 py-2 bg-slate-800 text-[10px] font-mono text-slate-300 rounded-xl hover:bg-slate-700"
                        title="Tự động điền mã mẫu"
                      >
                        Mẫu
                      </button>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleConfirmScan(task)}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Xác Nhận Đã Cất</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="px-3 py-2.5 bg-slate-900 text-slate-400 hover:text-white rounded-xl text-xs"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleStartPutaway(task)}
                    className="w-full py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
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
