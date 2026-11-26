import React, { useMemo } from 'react';
import { BinLocation } from '../../types';
import { Truck, PackageCheck, Box, Scale, ArrowDown, ArrowUp, Lock, SearchX, RotateCcw } from 'lucide-react';

interface WarehouseFloorPlan2DProps {
  locations: BinLocation[];
  selectedBinId: number | null;
  onSelectBin: (bin: BinLocation) => void;
  warehouseName: string;
  onResetFilters?: () => void;
}

export const WarehouseFloorPlan2D: React.FC<WarehouseFloorPlan2DProps> = ({
  locations,
  selectedBinId,
  onSelectBin,
  warehouseName,
  onResetFilters,
}) => {

  // Nhóm ô kệ chuẩn theo Phân Khu (Zone) rồi theo Dãy (Aisle)
  const zoneGroups = useMemo(() => {
    const groups: Record<string, Record<string, BinLocation[]>> = {};
    locations.forEach((loc) => {
      const z = loc.zone || 'ZONE_A';
      if (!groups[z]) groups[z] = {};
      const aisle = loc.aisle || 'A01';
      if (!groups[z][aisle]) groups[z][aisle] = [];
      groups[z][aisle].push(loc);
    });
    return groups;
  }, [locations]);

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* 1. CỔNG TIẾP NHẬN NHẬP HÀNG */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 border border-emerald-300/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0 shadow-2xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-950 uppercase tracking-wide text-xs">
                CỬA TIẾP NHẬN & PHÂN LOẠI NHẬP HÀNG
              </span>
              <span className="bg-emerald-200/70 text-emerald-900 px-2 py-0.2 rounded font-mono font-bold text-[10px]">
                Cửa 01 • Cửa 02
              </span>
            </div>
            <p className="text-emerald-700 text-[11px]">
              Khu vực dỡ hàng container và phân loại pallet trước khi cất vào ô kệ
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          <span>Luồng Nhập Vào Kệ</span>
        </div>
      </div>

      {/* 2. KHU VỰC CÁC PHÂN KHU & DÃY KỆ (ZONES & AISLES) */}
      <div className="space-y-4">
        {locations.length === 0 ? (
          <div className="py-12 px-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
              <SearchX className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">Không tìm thấy ô kệ nào phù hợp</p>
              <p className="text-xs text-slate-500 max-w-sm">
                Không có vị trí lưu trữ nào khớp với từ khóa tìm kiếm, phân khu hoặc bộ lọc trạng thái hiện tại trong {warehouseName}.
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
        ) : (
          Object.entries(zoneGroups).map(([zoneCode, aisles]) => {
          const zoneTitle =
            zoneCode === 'ZONE_B'
              ? 'KHU B: KHO MÁT & THỰC PHẨM (2°C - 8°C)'
              : zoneCode === 'ZONE_C'
              ? 'KHU C: HÀNG GIÁ TRỊ CAO & THIẾT BỊ ĐIỆN TỬ'
              : zoneCode === 'ZONE_QUA'
              ? 'KHU Q: KHU CÁCH LY & HÀNG CHỜ XỬ LÝ'
              : 'KHU A: HÀNG TIÊU DÙNG & HÀNG KHÔ THƯỜNG';

          const zoneBadgeColor =
            zoneCode === 'ZONE_B'
              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
              : zoneCode === 'ZONE_C'
              ? 'bg-purple-50 text-purple-800 border-purple-200'
              : zoneCode === 'ZONE_QUA'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-blue-50 text-blue-800 border-blue-200';

          return (
            <div key={zoneCode} className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              {/* Tiêu đề phân khu */}
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${zoneBadgeColor}`}>
                  {zoneTitle}
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  {Object.values(aisles).reduce((acc, list) => acc + list.length, 0)} Vị trí lưu trữ
                </span>
              </div>

              {/* Các Dãy Kệ trong phân khu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(aisles).map(([aisleName, binList]) => (
                  <div
                    key={aisleName}
                    className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs font-mono pb-1.5 border-b border-slate-100">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        DÃY KỆ {aisleName}
                      </span>
                      <span className="text-slate-400 text-[11px]">{binList.length} Ô</span>
                    </div>

                    {/* Danh sách các ô kệ */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {binList.map((bin) => {
                        const isSelected = selectedBinId === bin.id;
                        const isOccupied = bin.status === 'OCCUPIED';
                        const isReserved = bin.status === 'RESERVED';
                        const isExpiring = bin.status === 'EXPIRING';
                        const isLocked = bin.isActive === false;

                        let bgClass = 'bg-emerald-50/50 border-emerald-300 text-emerald-950 hover:bg-emerald-100/60';
                        let badgeBg = 'bg-emerald-200/80 text-emerald-900';
                        let statusText = 'Ô Trống';

                        if (isLocked) {
                          bgClass = 'bg-rose-50 border-rose-500 text-rose-950 ring-1 ring-rose-400';
                          badgeBg = 'bg-rose-600 text-white font-bold';
                          statusText = 'Khóa B.Trì';
                        } else if (isExpiring) {
                          bgClass = 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100/60';
                          badgeBg = 'bg-rose-200 text-rose-900';
                          statusText = 'Cận Hạn';
                        } else if (isReserved) {
                          bgClass = 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100/60';
                          badgeBg = 'bg-amber-200 text-amber-900';
                          statusText = 'Đang Giữ';
                        } else if (isOccupied) {
                          bgClass = 'bg-blue-50/60 border-blue-300 text-blue-950 hover:bg-blue-100/60';
                          badgeBg = 'bg-blue-200 text-blue-900';
                          statusText = 'Có Hàng';
                        }

                        const loadPct = bin.maxWeight > 0 ? Math.round((bin.currentWeight / bin.maxWeight) * 100) : 0;
                        const isOverloaded = bin.maxWeight > 0 && bin.currentWeight > bin.maxWeight;

                        return (
                          <div
                            key={bin.id}
                            onClick={() => onSelectBin(bin)}
                            className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all relative ${bgClass} ${
                              isSelected
                                ? 'ring-2 ring-blue-600 shadow-md scale-[1.02] border-blue-600 z-10'
                                : 'shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold leading-none mb-1">
                              <span className="flex items-center gap-1">
                                {isLocked && <Lock className="w-3 h-3 text-rose-600 shrink-0" />}
                                <span>{bin.binNumber}</span>
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${badgeBg}`}>
                                {statusText}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-500 font-mono truncate" title={bin.barcode}>
                              {bin.barcode.split('-').slice(2).join('-')}
                            </div>

                            {/* Tên sản phẩm */}
                            {bin.productName ? (
                              <div className="mt-1.5 pt-1.5 border-t border-slate-200/60">
                                <p className="text-[11px] font-bold text-slate-900 truncate" title={bin.productName}>
                                  {bin.productName}
                                </p>
                                <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 mt-0.5">
                                  <span>SL: <strong className="text-blue-700">{bin.qty || 0}</strong></span>
                                  <span className={isOverloaded ? 'text-rose-700 font-extrabold' : ''}>
                                    {loadPct}%{isOverloaded ? ' • QUÁ TẢI' : ' tải'}
                                  </span>
                                </div>
                              </div>
                            ) : isLocked ? (
                              <div className="mt-1.5 pt-1 text-[10px] text-rose-700 font-semibold italic flex items-center gap-1">
                                <Lock className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Tạm ngưng lưu kho</span>
                              </div>
                            ) : (
                              <div className="mt-1.5 pt-1 text-[10px] text-emerald-700 italic flex items-center gap-1">
                                <Box className="w-3 h-3 text-emerald-600" />
                                <span>Sẵn sàng lưu kho</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
        )}

        {/* Lối đi xe nâng */}
        <div className="py-1.5 px-3 bg-slate-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono text-slate-600 font-bold border border-slate-200">
          <span>◀◀◀ LỐI ĐI XE NÂNG & LẤY HÀNG (ĐỘ RỘNG TIÊU CHUẨN 3.0M) ▶▶▶</span>
        </div>
      </div>

      {/* 3. CỔNG XUẤT HÀNG & KHU ĐIỀU PHỐI */}
      <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 border border-blue-300/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-2xs">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-blue-950 uppercase tracking-wide text-xs">
                CỬA ĐIỀU PHỐI & BÀN GIAO XUẤT HÀNG
              </span>
              <span className="bg-blue-200/70 text-blue-900 px-2 py-0.2 rounded font-mono font-bold text-[10px]">
                Cửa 03 • Cửa 04
              </span>
            </div>
            <p className="text-blue-700 text-[11px]">
              Khu vực kiểm đếm đơn hàng, đóng gói niêm phong và bàn giao phương tiện vận chuyển
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-blue-700 font-bold text-[11px]">
          <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
          <span>Luồng Xuất Khỏi Kho</span>
        </div>
      </div>
    </div>
  );
};
