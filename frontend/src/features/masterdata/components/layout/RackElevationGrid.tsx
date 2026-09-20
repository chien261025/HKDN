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
            className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm"
          >
            {/* Tiêu đề Dãy */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-mono">
                  DÃY HÀNG: {aisle}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500 font-medium">
                {aisleLocations.length} Vị trí lưu trữ
              </span>
            </div>

            {/* Các Kệ (Racks) trong Dãy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {racks.map((rack) => {
                const rackLocations = aisleLocations.filter((l) => l.rack === rack);
                // Sắp xếp tầng từ trên xuống: S02 trước, S01 sau (như giá kệ thực tế)
                const sortedShelves = [...rackLocations].sort((a, b) => b.shelf.localeCompare(a.shelf));

                return (
                  <div
                    key={rack}
                    className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-3"
                  >
                    {/* Header Khung Kệ */}
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-700 font-bold flex items-center gap-2">
                        <span className="text-indigo-600 font-black">KỆ {rack}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-medium">Khung Thép Chịu Lực</span>
                      </span>
                      <span className="text-xs text-slate-500">2 Tầng (S01, S02)</span>
                    </div>

                    {/* Danh sách các Tầng / Ô Kệ */}
                    <div className="space-y-2.5">
                      {sortedShelves.map((bin) => {
                        const isSelected = selectedBinId === bin.id;
                        const isOccupied = bin.status === 'OCCUPIED';
                        const isReserved = bin.status === 'RESERVED';
                        const isExpiring = bin.status === 'EXPIRING';

                        let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        let statusText = 'Ô TRỐNG';
                        let dotColor = 'bg-emerald-500';

                        if (isExpiring) {
                          statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                          statusText = 'CẬN DATE';
                          dotColor = 'bg-rose-500 animate-pulse';
                        } else if (isReserved) {
                          statusBadge = 'bg-amber-50 text-amber-700 border-amber-200';
                          statusText = 'KHÓA GIỮ';
                          dotColor = 'bg-amber-500';
                        } else if (isOccupied) {
                          statusBadge = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                          statusText = 'ĐANG CHỨA';
                          dotColor = 'bg-indigo-600';
                        }

                        // Tỷ lệ tải trọng
                        const weightPct = Math.min(Math.round((bin.currentWeight / bin.maxWeight) * 100), 100);

                        return (
                          <div
                            key={bin.id}
                            onClick={() => onSelectBin(bin)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                            }`}
                          >
                            {/* Dòng 1: Barcode + Trạng thái */}
                            <div className="flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200 text-xs">
                                  {bin.barcode}
                                </span>
                                <span className="text-xs text-slate-500 font-medium">
                                  Tầng {bin.shelf}
                                </span>
                              </div>

                              <span
                                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 font-sans ${statusBadge}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                {statusText}
                              </span>
                            </div>

                            {/* Dòng 2: Hàng hóa (nếu có) */}
                            {bin.productName ? (
                              <div className="mt-2.5 text-sm space-y-1">
                                <p className="font-bold text-slate-900 truncate">{bin.productName}</p>
                                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                                  <span>SKU: <b className="text-slate-700">{bin.sku}</b></span>
                                  <span className="text-emerald-700 font-bold font-mono text-sm">
                                    {bin.qty} cái
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-2.5 text-xs text-slate-400 italic">
                                Ô kệ sẵn sàng tiếp nhận hàng nhập Put-away
                              </p>
                            )}

                            {/* Dòng 3: Tải trọng & Thanh tiến trình */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5 text-slate-400" />
                                Tải: {bin.currentWeight} / {bin.maxWeight} kg
                              </span>
                              <span className={weightPct > 80 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
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
