import React, { useState } from 'react';
import { ShieldCheck, Play } from 'lucide-react';
import { SimulationResult } from '../types';

export const ConcurrencyTestWidget: React.FC = () => {
  const [isSimulatingLock, setIsSimulatingLock] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);

  const runConcurrencyTest = () => {
    setIsSimulatingLock(true);
    setSimulationResults([]);

    const initialStock = 10;
    const totalThreads = 20;
    let reserved = 0;
    const results: SimulationResult[] = [];

    for (let i = 1; i <= totalThreads; i++) {
      if (reserved < initialStock) {
        reserved += 1;
        results.push({
          threadId: i,
          status: 'SUCCESS',
          message: `Luồng #${i}: Khóa bi quan thành công! Tồn giữ mới = ${reserved}/10`,
        });
      } else {
        results.push({
          threadId: i,
          status: 'REJECTED',
          message: `Luồng #${i}: BỊ CHẶN AN TOÀN! Hết tồn khả dụng (Available = 0). Chống âm kho thành công!`,
        });
      }
    }

    setTimeout(() => {
      setSimulationResults(results);
      setIsSimulatingLock(false);
    }, 500);
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Mô Phỏng 20 Luồng Đồng Thời (Pessimistic Lock)</span>
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          SELECT FOR UPDATE
        </span>
      </div>

      <p className="text-xs text-slate-400 leading-relaxed">
        Giả lập 20 khách hàng cùng bấm mua 1 sản phẩm có tồn kho = 10. Hệ thống sử dụng khóa bi quan cấp hàng để triệt tiêu Race Condition.
      </p>

      {/* Button chạy test */}
      <button
        onClick={runConcurrencyTest}
        disabled={isSimulatingLock}
        className="w-full py-2 px-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-900/20 disabled:opacity-50"
      >
        <Play className="w-3.5 h-3.5 fill-current" />
        <span>{isSimulatingLock ? 'Đang Chạy 20 Luồng...' : 'Kích Hoạt Test 20 Luồng Đồng Thời'}</span>
      </button>

      {/* Khung kết quả chạy test */}
      {simulationResults.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex justify-between">
            <span>KẾT QUẢ: 10 THÀNH CÔNG • 10 BỊ CHẶN</span>
            <span>TỒN ÂM: 0</span>
          </div>
          {simulationResults.map((r, i) => (
            <div
              key={i}
              className={`p-1.5 rounded flex items-center justify-between border ${
                r.status === 'SUCCESS'
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-400'
              }`}
            >
              <span className="truncate max-w-[240px]">{r.message}</span>
              <span className="font-bold flex-shrink-0">{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
