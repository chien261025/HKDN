import React from 'react';
import { Boxes, Info, ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BinCell } from '../types';

interface WarehouseGridWidgetProps {
  grid: BinCell[];
  selectedBin: BinCell | null;
  onSelectBin: (bin: BinCell) => void;
}

export const WarehouseGridWidget: React.FC<WarehouseGridWidgetProps> = ({
  grid,
  selectedBin,
  onSelectBin,
}) => {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
      <div>
        {/* Header & Legend */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Boxes className="w-4.5 h-4.5" />
              </div>
              <span>Mô Hình Không Gian Ô Kệ (Digital Twin Grid)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Chọn ô kệ trên bản đồ ảo để xem dữ liệu lô hàng thời gian thực</p>
          </div>

          {/* Color legend pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Trống
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Chứa Hàng
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Đang Giữ
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Cận Date
            </span>
          </div>
        </div>

        {/* 8 Precision Digital Twin Bin Slots */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          {grid.map((bin) => {
            let statusPill = {
              text: 'Chứa Hàng',
              dot: 'bg-indigo-600',
              bg: 'bg-white',
              border: 'border-slate-200 hover:border-indigo-300',
              badge: 'bg-indigo-50 text-indigo-700',
            };

            if (bin.status === 'EMPTY') {
              statusPill = {
                text: 'Trống',
                dot: 'bg-emerald-500',
                bg: 'bg-slate-50/50',
                border: 'border-slate-200/90 hover:border-emerald-300',
                badge: 'bg-emerald-50 text-emerald-700',
              };
            } else if (bin.status === 'RESERVED') {
              statusPill = {
                text: 'Đang Giữ',
                dot: 'bg-amber-500',
                bg: 'bg-white',
                border: 'border-slate-200 hover:border-amber-300',
                badge: 'bg-amber-50 text-amber-800',
              };
            } else if (bin.status === 'EXPIRING') {
              statusPill = {
                text: 'Cận Date',
                dot: 'bg-rose-500 animate-pulse',
                bg: 'bg-rose-50/30',
                border: 'border-rose-200 hover:border-rose-400',
                badge: 'bg-rose-50 text-rose-700 border border-rose-200',
              };
            }

            const isSelected = selectedBin?.id === bin.id;

            return (
              <div
                key={bin.id}
                onClick={() => onSelectBin(bin)}
                className={`cursor-pointer rounded-xl p-3.5 border transition-all relative ${statusPill.bg} ${statusPill.border} ${
                  isSelected
                    ? 'ring-2 ring-indigo-600 shadow-md border-indigo-500 bg-indigo-50/30'
                    : 'hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                {/* Coordinates & Status Dot */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-slate-800 tracking-tight">
                    {bin.aisle}-{bin.rack}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                      {bin.shelf}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${statusPill.dot}`}></span>
                  </div>
                </div>

                {/* Product Name */}
                <div className="mt-2.5 min-h-[36px]">
                  <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                    {bin.status === 'EMPTY' ? (
                      <span className="text-slate-400 italic font-normal">Ô kệ đang trống</span>
                    ) : (
                      bin.productName
                    )}
                  </p>
                </div>

                {/* Quantity or Status Tag */}
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Tồn chứa</span>
                  {bin.status === 'EMPTY' ? (
                    <span className="text-xs font-mono font-bold text-slate-300">0</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-slate-800">
                      <Package className="w-3 h-3 text-slate-400" />
                      {bin.qty} cái
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected bin detail telemetry bar */}
      <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200/80 text-sm">
        {selectedBin ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold bg-white text-indigo-700 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  {selectedBin.barcode}
                </span>
                <span className="font-bold text-slate-800 text-sm">
                  {selectedBin.productName || 'Ô Kệ Chưa Chứa Hàng'}
                </span>
              </div>
              {selectedBin.sku && (
                <p className="text-slate-500 text-xs font-mono mt-1">
                  SKU: <span className="text-slate-800 font-bold">{selectedBin.sku}</span> • Lô:{' '}
                  <span className="text-indigo-700 font-bold">{selectedBin.batch}</span> • HSD:{' '}
                  <span
                    className={
                      selectedBin.status === 'EXPIRING'
                        ? 'text-rose-600 font-bold bg-rose-50 px-1 rounded'
                        : 'text-slate-700 font-semibold'
                    }
                  >
                    {selectedBin.expiry}
                  </span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 block">Số lượng khả dụng</span>
                <span className="text-emerald-700 font-black text-base">{selectedBin.qty || 0} cái</span>
              </div>
              <Link
                to="/inventory"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs"
              >
                <span>Xem Tồn Kho</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-slate-600 text-xs sm:text-sm font-medium">
            <span className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-500" />
              Nhấp vào một ô kệ trên lưới để kiểm tra thông tin chi tiết và hạn dùng
            </span>
            <Link
              to="/layout"
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-xs group"
            >
              <span>Mở bản đồ đầy đủ</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
