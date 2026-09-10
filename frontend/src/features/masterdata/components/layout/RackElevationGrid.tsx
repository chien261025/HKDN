import React from 'react';
import { BinLocation } from '../../types';
import { Box, MapPin, Scale } from 'lucide-react';

interface RackElevationGridProps {
  locations: BinLocation[];
  selectedBinId: number | null;
  onSelectBin: (bin: BinLocation) => void;
}

export const RackElevationGrid: React.FC<RackElevationGridProps> = ({
  locations,
  selectedBinId,
  onSelectBin,
}) => {
  // Nhóm các ô kệ theo Dãy (Aisle)
  const aisles = Array.from(new Set(locations.map((l) => l.aisle)));

  return (
    <div className="space-y-4">
      {aisles.map((aisle) => {
        const aisleLocations = locations.filter((l) => l.aisle === aisle);
        // Nhóm tiếp theo Kệ (Rack)
        const racks = Array.from(new Set(aisleLocations.map((l) => l.rack)));

        return (
          <div
            key={aisle}
            className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-sm"
          >
            {/* Tiêu đề Dãy */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  DÃY HÀNG: {aisle}
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {aisleLocations.length} Vị trí lưu trữ
              </span>
            </div>

            {/* Các Kệ (Racks) trong Dãy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {racks.map((rack) => {
                const rackLocations = aisleLocations.filter((l) => l.rack === rack);
                // Sắp xếp tầng từ trên xuống: S02 trước, S01 sau (như giá kệ thực tế)
                const sortedShelves = [...rackLocations].sort((a, b) => b.shelf.localeCompare(a.shelf));

                return (
                  <div
                    key={rack}
                    className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 space-y-2.5"
                  >
                    {/* Header Khung Kệ */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-300 font-bold flex items-center gap-1.5">
                        <span className="text-cyan-400">KỆ {rack}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] text-slate-400">Khung Thép Chịu Lực</span>
                      </span>
                      <span className="text-[10px] text-slate-500">2 Tầng (S01, S02)</span>
                    </div>

                    {/* Danh sách các Tầng / Ô Kệ */}
                    <div className="space-y-2">
                      {sortedShelves.map((bin) => {
                        const isSelected = selectedBinId === bin.id;
                        const isOccupied = bin.status === 'OCCUPIED';
                        const isReserved = bin.status === 'RESERVED';
                        const isExpiring = bin.status === 'EXPIRING';

                        let statusBadge = 'bg-emerald-950/20 text-emerald-300 border-emerald-500/30';
                        let statusText = 'Ô TRỐNG';
                        let dotColor = 'bg-emerald-400';

                        if (isExpiring) {
                          statusBadge = 'bg-rose-950/30 text-rose-300 border-rose-500/40';
                          statusText = 'CẬN DATE';
                          dotColor = 'bg-rose-400 animate-pulse';
                        } else if (isReserved) {
                          statusBadge = 'bg-amber-950/30 text-amber-300 border-amber-500/40';
                          statusText = 'KHÓA GIỮ';
                          dotColor = 'bg-amber-400';
                        } else if (isOccupied) {
                          statusBadge = 'bg-indigo-950/30 text-indigo-300 border-indigo-500/40';
                          statusText = 'ĐANG CHỨA';
                          dotColor = 'bg-indigo-400';
                        }

                        // Tỷ lệ tải trọng
                        const weightPct = Math.min(Math.round((bin.currentWeight / bin.maxWeight) * 100), 100);

                        return (
                          <div
                            key={bin.id}
                            onClick={() => onSelectBin(bin)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-950/30 border-indigo-400/90 ring-1 ring-indigo-400/40 shadow-md'
                                : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-850/50'
                            }`}
                          >
                            {/* Dòng 1: Barcode + Trạng thái */}
                            <div className="flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40 text-[11px]">
                                  {bin.barcode}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Tầng {bin.shelf}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 font-sans ${statusBadge}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                {statusText}
                              </span>
                            </div>

                            {/* Dòng 2: Hàng hóa (nếu có) */}
                            {bin.productName ? (
                              <div className="mt-2 text-xs space-y-1">
                                <p className="font-bold text-white truncate">{bin.productName}</p>
                                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                                  <span>SKU: {bin.sku}</span>
                                  <span className="text-emerald-400 font-bold font-mono">
                                    {bin.qty} cái
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-2 text-[11px] text-slate-500 italic">
                                Ô kệ sẵn sàng tiếp nhận hàng nhập Put-away
                              </p>
                            )}

                            {/* Dòng 3: Tải trọng & Thanh tiến trình */}
                            <div className="mt-2 pt-2 border-t border-slate-850/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                              <span className="flex items-center gap-1">
                                <Scale className="w-3 h-3 text-slate-500" />
                                Tải: {bin.currentWeight} / {bin.maxWeight} kg
                              </span>
                              <span className={weightPct > 80 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                                {weightPct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
