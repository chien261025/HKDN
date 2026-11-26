import React from 'react';
import { BinLocation } from '../../types';
import { Box, MapPin, Scale, Lock, SearchX, RotateCcw } from 'lucide-react';

interface RackElevationGridProps {
  locations: BinLocation[];
  selectedBinId: number | null;
  onSelectBin: (bin: BinLocation) => void;
  onResetFilters?: () => void;
}

export const RackElevationGrid: React.FC<RackElevationGridProps> = ({
  locations,
  selectedBinId,
  onSelectBin,
  onResetFilters,
}) => {

  if (locations.length === 0) {
    return (
      <div className="bg-white rounded-2xl py-14 px-6 border border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
          <SearchX className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-slate-800">Không tìm thấy ô kệ nào phù hợp</p>
          <p className="text-xs text-slate-500 max-w-sm">
            Không có vị trí lưu trữ nào khớp với từ khóa tìm kiếm, phân khu hoặc bộ lọc trạng thái hiện tại.
          </p>
        </div>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
      </div>
    );
  }

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
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
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
                        <span className="text-blue-600 font-black">KỆ {rack}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-medium">Khung Thép Chịu Lực</span>
                      </span>
                      <span className="text-xs text-slate-500">
                        {rackLocations.length} tầng ({[...new Set(rackLocations.map(l => l.shelf))].sort().join(', ')})
                      </span>
                    </div>

                    {/* Danh sách các Tầng / Ô Kệ */}
                    <div className="space-y-2.5">
                      {sortedShelves.map((bin) => {
                        const isSelected = selectedBinId === bin.id;
                        const isOccupied = bin.status === 'OCCUPIED';
                        const isReserved = bin.status === 'RESERVED';
                        const isExpiring = bin.status === 'EXPIRING';
                        const isLocked = bin.isActive === false;

                        let statusBadge = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                        let statusText = 'Ô TRỐNG';
                        let dotColor = 'bg-emerald-500';

                        if (isLocked) {
                          statusBadge = 'bg-rose-600 text-white border-rose-600 font-bold';
                          statusText = 'KHÓA BẢO TRÌ';
                          dotColor = 'bg-white animate-pulse';
                        } else if (isExpiring) {
                          statusBadge = 'bg-rose-50 text-rose-700 border-rose-200';
                          statusText = 'CẬN HẠN';
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

                        // Tỷ lệ tải trọng thực tế (không kẹp ở 100% để cảnh báo quá tải chuẩn WMS)
                        const weightPct = bin.maxWeight > 0 ? Math.round((bin.currentWeight / bin.maxWeight) * 100) : 0;
                        const isOverloaded = bin.maxWeight > 0 && bin.currentWeight > bin.maxWeight;

                        return (
                          <div
                            key={bin.id}
                            onClick={() => onSelectBin(bin)}
                            className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                                : isLocked
                                ? 'bg-rose-50/40 border-rose-400 ring-1 ring-rose-200'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
                            }`}
                          >
                            {/* Dòng 1: Barcode + Trạng thái */}
                            <div className="flex items-center justify-between text-xs font-mono">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold px-2.5 py-0.5 rounded border text-xs flex items-center gap-1 ${
                                  isLocked ? 'text-rose-700 bg-rose-100 border-rose-300' : 'text-blue-700 bg-blue-50 border-blue-200'
                                }`}>
                                  {isLocked && <Lock className="w-3 h-3 text-rose-600" />}
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
                            ) : isLocked ? (
                              <p className="mt-2.5 text-xs text-rose-600 font-medium italic">
                                Ô kệ đang khóa bảo trì — tạm ngưng tiếp nhận hàng hóa
                              </p>
                            ) : (
                              <p className="mt-2.5 text-xs text-slate-400 italic">
                                Ô kệ sẵn sàng tiếp nhận hàng nhập kho
                              </p>
                            )}

                            {/* Dòng 3: Tải trọng & Thanh tiến trình */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                              <span className="flex items-center gap-1.5">
                                <Scale className="w-3.5 h-3.5 text-slate-400" />
                                Tải: {bin.currentWeight} / {bin.maxWeight} kg
                              </span>
                              <span className={isOverloaded ? 'text-rose-700 font-extrabold' : weightPct > 80 ? 'text-rose-600 font-bold' : 'text-slate-600'}>
                                {weightPct}%{isOverloaded ? ' • QUÁ TẢI' : ''}
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
