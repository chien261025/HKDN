import React from 'react';
import { BinLocation } from '../../types';
import { Truck, PackageCheck, Box, Scale, ArrowDown, ArrowUp } from 'lucide-react';

interface WarehouseFloorPlan2DProps {
  locations: BinLocation[];
  selectedBinId: number | null;
  onSelectBin: (bin: BinLocation) => void;
  warehouseName: string;
}

export const WarehouseFloorPlan2D: React.FC<WarehouseFloorPlan2DProps> = ({
  locations,
  selectedBinId,
  onSelectBin,
  warehouseName,
}) => {
  // Nhóm ô kệ chuẩn theo Phân Khu (Zone) rồi theo Dãy (Aisle)
  const zoneGroups = React.useMemo(() => {
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
      {/* 1. CỔNG NHẬP HÀNG & KHU ĐỆM TIẾP NHẬN (INBOUND DOCK) */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-emerald-500/10 border border-emerald-300/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-600 text-white shrink-0 shadow-2xs">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-emerald-950 uppercase tracking-wide text-xs">
                CỔNG NHẬP HÀNG (INBOUND DOCK & STAGING)
              </span>
              <span className="bg-emerald-200/70 text-emerald-900 px-2 py-0.2 rounded font-mono font-bold text-[10px]">
                Gate 01 • Gate 02
              </span>
            </div>
            <p className="text-emerald-700 text-[11px]">
              Khu đệm tiếp nhận container & phân loại hàng theo pallet trước khi Putaway cất kệ
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
        {Object.entries(zoneGroups).map(([zoneCode, aisles]) => {
          const zoneTitle =
            zoneCode === 'ZONE_B'
              ? 'KHU B: KHO MÁT & THỰC PHẨM (2-8°C)'
              : zoneCode === 'ZONE_C'
              ? 'KHU C: HÀNG GIÁ TRỊ CAO & ĐIỆN TỬ (SECURE HIGH-VALUE)'
              : 'KHU A: HÀNG TIÊU DÙNG & HÀNG KHÔ (AMBIENT DRY)';

          const zoneBadgeColor =
            zoneCode === 'ZONE_B'
              ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
              : zoneCode === 'ZONE_C'
              ? 'bg-purple-50 text-purple-800 border-purple-200'
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

                        let bgClass = 'bg-emerald-50/50 border-emerald-300 text-emerald-950 hover:bg-emerald-100/60';
                        let badgeBg = 'bg-emerald-200/80 text-emerald-900';
                        let statusText = 'Ô Trống';

                        if (isExpiring) {
                          bgClass = 'bg-rose-50 border-rose-300 text-rose-950 hover:bg-rose-100/60';
                          badgeBg = 'bg-rose-200 text-rose-900';
                          statusText = 'Cận Date';
                        } else if (isReserved) {
                          bgClass = 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100/60';
                          badgeBg = 'bg-amber-200 text-amber-900';
                          statusText = 'Đang Giữ';
                        } else if (isOccupied) {
                          bgClass = 'bg-blue-50/60 border-blue-300 text-blue-950 hover:bg-blue-100/60';
                          badgeBg = 'bg-blue-200 text-blue-900';
                          statusText = 'Có Hàng';
                        }

                        const loadPct = Math.min(100, Math.round((bin.currentWeight / bin.maxWeight) * 100));

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
                              <span>{bin.binNumber}</span>
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
                                  <span>{loadPct}% tải</span>
                                </div>
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
        })}

        {/* Lối đi xe nâng */}
        <div className="py-1.5 px-3 bg-slate-100 rounded-xl flex items-center justify-center gap-2 text-[10px] font-mono text-slate-600 font-bold border border-slate-200">
          <span>◀◀◀ LỐI ĐI XE NÂNG & THỦ KHO NHẶT HÀNG (FORKLIFT AISLE 3.0M) ▶▶▶</span>
        </div>
      </div>

      {/* 3. CỔNG XUẤT HÀNG & KHU ĐÓNG GÓI (OUTBOUND DOCK) */}
      <div className="bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-blue-500/10 border border-blue-300/80 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 shadow-2xs">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-blue-950 uppercase tracking-wide text-xs">
                CỔNG XUẤT HÀNG (OUTBOUND DOCK & DISPATCH)
              </span>
              <span className="bg-blue-200/70 text-blue-900 px-2 py-0.2 rounded font-mono font-bold text-[10px]">
                Gate 03 • Gate 04
              </span>
            </div>
            <p className="text-blue-700 text-[11px]">
              Bàn kiểm đếm đơn hàng SO, đóng gói niêm phong & xuất tải giao cho xe phân phối
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
