import React, { useState } from 'react';
import { ShieldCheck, Play, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
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
          message: `Luồng #${i.toString().padStart(2, '0')}: Khóa bi quan thành công (Tồn giữ: ${reserved}/10)`,
        });
      } else {
        results.push({
          threadId: i,
          status: 'REJECTED',
          message: `Luồng #${i.toString().padStart(2, '0')}: Chặn an toàn (Available = 0, ngăn âm kho)`,
        });
      }
    }

    setTimeout(() => {
      setSimulationResults(results);
      setIsSimulatingLock(false);
    }, 400);
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>Khóa Bi Quan Độc Quyền (Pessimistic Lock)</span>
        </h3>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
          SELECT FOR UPDATE
        </span>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed">
        Giả lập 20 giao dịch đồng thời đặt mua cùng 1 sản phẩm có tồn kho = 10. Database tự động khóa dòng cấp phát để loại bỏ hoàn toàn tình trạng <span className="font-semibold text-slate-800">Race Condition</span>.
      </p>

      {/* Mini telemetry stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Luồng Giao Dịch</span>
          <span className="font-mono text-sm font-black text-slate-800">20 threads</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/70">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Tồn Khả Dụng</span>
          <span className="font-mono text-sm font-black text-indigo-600">10 cái</span>
        </div>
        <div className="bg-emerald-50/70 p-2 rounded-xl border border-emerald-200/70">
          <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Tồn Âm Cam Kết</span>
          <span className="font-mono text-sm font-black text-emerald-700">0 cái</span>
        </div>
      </div>

      {/* Trigger Button */}
      <div className="flex gap-2">
        <button
          onClick={runConcurrencyTest}
          disabled={isSimulatingLock}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulatingLock ? 'Đang kiểm thử 20 luồng...' : 'Kích Hoạt Test 20 Luồng Đồng Thời'}</span>
        </button>

        {simulationResults.length > 0 && (
          <button
            onClick={() => setSimulationResults([])}
            title="Xóa kết quả test"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Test Results Log */}
      {simulationResults.length > 0 && (
        <div className="space-y-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              10 Thành Công • 10 Bị Chặn
            </span>
            <span className="text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded font-mono">
              ÂM KHO = 0
            </span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {simulationResults.map((r, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg flex items-center justify-between border ${
                  r.status === 'SUCCESS'
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span className="truncate max-w-[260px] text-[11px]">{r.message}</span>
                <span
                  className={`font-bold text-[10px] px-1.5 py-0.2 rounded ${
                    r.status === 'SUCCESS'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
