import React, { useState } from 'react';
import { Cpu, Sparkles, CheckCircle2, ArrowDownRight, Layers } from 'lucide-react';
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
        reason: `Trọng lượng kiện hàng (${putAwayWeight}kg) > 100kg: Tự động định tuyến xuống Tầng trệt S01 nhằm hạ thấp trọng tâm và bảo vệ kết cấu cơ học giá kệ.`,
      });
    } else {
      setPutAwayResult({
        zone: 'ZONE_A (Hàng Khô)',
        shelf: 'S02 (Tầng 2 - Standard Shelf)',
        bin: 'ZA-A01-R01-S02-B04',
        reason: `Trọng lượng kiện hàng (${putAwayWeight}kg) <= 100kg: Tối ưu vị trí tầng cao S02 để giải phóng mặt bằng tầng sàn cho hàng nặng xuất nhập nhanh.`,
      });
    }
  };

  const isHeavy = putAwayWeight > 100;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 tracking-tight">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <span>Thuật Toán Gợi Ý Cất Hàng (Smart Put-away)</span>
        </h3>
        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
          WEIGHT HEURISTIC
        </span>
      </div>

      {/* Weight Selector & Visual Cue */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-600 font-semibold">Trọng lượng kiện hàng nhập kho:</span>
          <span className="font-mono font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 text-sm">
            {putAwayWeight} kg
          </span>
        </div>

        {/* Custom styled range slider */}
        <div className="relative py-1">
          <input
            type="range"
            min="10"
            max="300"
            step="10"
            value={putAwayWeight}
            onChange={(e) => setPutAwayWeight(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        {/* Quick weight presets */}
        <div className="flex items-center justify-between gap-1 text-[11px]">
          <button
            type="button"
            onClick={() => setPutAwayWeight(30)}
            className={`px-2 py-1 rounded-md border transition-all cursor-pointer ${
              putAwayWeight === 30 ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            30kg (Nhẹ)
          </button>
          <button
            type="button"
            onClick={() => setPutAwayWeight(100)}
            className={`px-2 py-1 rounded-md border transition-all cursor-pointer ${
              putAwayWeight === 100 ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            100kg (Ngưỡng trệt)
          </button>
          <button
            type="button"
            onClick={() => setPutAwayWeight(220)}
            className={`px-2 py-1 rounded-md border transition-all cursor-pointer ${
              putAwayWeight === 220 ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            220kg (Tải nặng)
          </button>
        </div>

        {/* Mini 2-Tier Rack Preview Indicator */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div
            className={`p-2.5 rounded-xl border transition-all text-center ${
              !isHeavy
                ? 'bg-indigo-50/80 border-indigo-400 text-indigo-900 shadow-2xs font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="text-[10px] font-mono uppercase">Tầng Cao (S02)</div>
            <div className="text-xs font-semibold mt-0.5">Kiện hàng ≤ 100kg</div>
          </div>

          <div
            className={`p-2.5 rounded-xl border transition-all text-center ${
              isHeavy
                ? 'bg-amber-50/80 border-amber-400 text-amber-900 shadow-2xs font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-400'
            }`}
          >
            <div className="text-[10px] font-mono uppercase">Tầng Trệt (S01)</div>
            <div className="text-xs font-semibold mt-0.5">Kiện hàng &gt; 100kg</div>
          </div>
        </div>
      </div>

      <button
        onClick={calculatePutAway}
        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs hover:shadow hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
      >
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>Phân Tích Vị Trí Cất Hàng Tối Ưu</span>
      </button>

      {putAwayResult && (
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2 font-mono">
          <div className="flex justify-between items-center text-indigo-950 font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Gợi ý: {putAwayResult.shelf}
            </span>
            <span className="text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 shadow-2xs">
              {putAwayResult.bin}
            </span>
          </div>
          <p className="text-slate-700 text-[11px] leading-relaxed font-sans font-normal pt-1 border-t border-indigo-100">
            {putAwayResult.reason}
          </p>
        </div>
      )}
    </div>
  );
};
