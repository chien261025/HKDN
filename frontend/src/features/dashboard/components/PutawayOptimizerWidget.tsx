import React, { useState } from 'react';
import { Cpu, Sparkles } from 'lucide-react';
import { PutawayResult } from '../types';

export const PutawayOptimizerWidget: React.FC = () => {
  const [putAwayWeight, setPutAwayWeight] = useState<number>(150);
  const [putAwayResult, setPutAwayResult] = useState<PutawayResult | null>(null);

  const calculatePutAway = () => {
    if (putAwayWeight > 100) {
      setPutAwayResult({
        zone: 'ZONE_A (Hàng Khô / Tải Nặng)',
        shelf: 'S01 (Tầng Trệt - Ground Shelf)',
        bin: 'ZA-A01-R01-S01-B02',
        reason: `Trọng lượng kiện hàng (${putAwayWeight}kg) > 100kg: Thuật toán tự động định tuyến xuống Tầng trệt S01 để bảo vệ kết cấu cơ học giá kệ.`,
      });
    } else {
      setPutAwayResult({
        zone: 'ZONE_A (Hàng Khô)',
        shelf: 'S02 (Tầng 2 - Standard Shelf)',
        bin: 'ZA-A01-R01-S02-B04',
        reason: `Trọng lượng kiện hàng (${putAwayWeight}kg) <= 100kg: Thuật toán tối ưu hóa vị trí tầng cao S02 để tiết kiệm diện tích sàn tầng trệt.`,
      });
    }
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex justify-between items-center pb-2.5 border-b border-slate-800">
        <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wide">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Thuật Toán Gợi Ý Cất Hàng (Smart Put-away)</span>
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          WEIGHT OPTIMIZER
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs text-slate-300">
          <span>Nhập trọng lượng kiện hàng:</span>
          <span className="font-mono font-bold text-cyan-400">{putAwayWeight} kg</span>
        </div>

        <input
          type="range"
          min="10"
          max="300"
          step="10"
          value={putAwayWeight}
          onChange={(e) => setPutAwayWeight(Number(e.target.value))}
          className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>10 kg (Nhẹ)</span>
          <span className="text-amber-400">100 kg (Ngưỡng tầng trệt)</span>
          <span>300 kg (Nặng)</span>
        </div>
      </div>

      <button
        onClick={calculatePutAway}
        className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-slate-700/80"
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        <span>Chạy Thuật Toán Phân Tích Vị Trí</span>
      </button>

      {putAwayResult && (
        <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs space-y-1 font-mono">
          <div className="flex justify-between text-indigo-300 font-bold">
            <span>GỢI Ý: {putAwayResult.shelf}</span>
            <span className="text-cyan-300">{putAwayResult.bin}</span>
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{putAwayResult.reason}</p>
        </div>
      )}
    </div>
  );
};
