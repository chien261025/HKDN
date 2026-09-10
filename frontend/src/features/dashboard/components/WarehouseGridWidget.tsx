import React from 'react';
import { Boxes, Info } from 'lucide-react';
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
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        {/* Header & Chú thích màu */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-400" />
              <span>Mô Hình Không Gian Ô Kệ (Digital Twin Grid)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Click vào ô kệ để xem chi tiết lô hàng, SKU và số lượng</p>
          </div>

          {/* Chú thích màu sắc */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Trống</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500"></span> Chứa Hàng</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500"></span> Đang Giữ</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"></span> Cận Date</span>
          </div>
        </div>

        {/* Lưới 8 Ô Kệ Gọn Gàng & Dễ Nhìn */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3">
          {grid.map((bin) => {
            let badgeStyle = 'border-slate-800 bg-slate-950/40 text-slate-400';
            let dotColor = 'bg-slate-500';

            if (bin.status === 'EMPTY') {
              badgeStyle = 'border-emerald-500/30 bg-emerald-950/15 text-emerald-300 hover:border-emerald-400/50';
              dotColor = 'bg-emerald-400';
            } else if (bin.status === 'OCCUPIED') {
              badgeStyle = 'border-indigo-500/30 bg-indigo-950/15 text-indigo-200 hover:border-indigo-400/50';
              dotColor = 'bg-indigo-400';
            } else if (bin.status === 'RESERVED') {
              badgeStyle = 'border-amber-500/30 bg-amber-950/15 text-amber-200 hover:border-amber-400/50';
              dotColor = 'bg-amber-400';
            } else if (bin.status === 'EXPIRING') {
              badgeStyle = 'border-rose-500/40 bg-rose-950/20 text-rose-200 hover:border-rose-400/60';
              dotColor = 'bg-rose-400 animate-pulse';
            }

            const isSelected = selectedBin?.id === bin.id;

            return (
              <div
                key={bin.id}
                onClick={() => onSelectBin(bin)}
                className={`cursor-pointer rounded-xl p-2.5 border transition-all ${badgeStyle} ${
                  isSelected ? 'ring-2 ring-indigo-400 shadow-md' : 'hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="font-bold">{bin.aisle}-{bin.rack}</span>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                </div>

                <div className="mt-1.5 text-xs font-semibold truncate">
                  {bin.status === 'EMPTY' ? 'Ô Kệ Trống' : bin.productName}
                </div>

                <div className="mt-1 text-[10px] font-mono opacity-80 flex justify-between">
                  <span>{bin.shelf}</span>
                  <span>{bin.qty ? `${bin.qty} cái` : '0'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chi tiết ô kệ đang chọn */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
        {selectedBin ? (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                  {selectedBin.barcode}
                </span>
                <span className="font-bold text-white text-xs">{selectedBin.productName || 'Ô Chưa Chứa Hàng'}</span>
              </div>
              {selectedBin.sku && (
                <p className="text-slate-400 text-[11px] font-mono">
                  SKU: <span className="text-white">{selectedBin.sku}</span> • Lô: <span className="text-cyan-300">{selectedBin.batch}</span> • HSD: <span className={selectedBin.status === 'EXPIRING' ? 'text-rose-400 font-bold' : 'text-slate-300'}>{selectedBin.expiry}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right font-mono text-xs">
                <span className="text-slate-400">Số lượng: </span>
                <span className="text-emerald-400 font-bold">{selectedBin.qty || 0}</span>
              </div>
              <Link
                to="/inventory"
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Xem Tồn Kho
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Bấm vào một ô kệ trên lưới để kiểm tra thông tin chi tiết
            </span>
            <Link to="/layout" className="text-indigo-400 hover:underline font-medium text-[11px]">
              Mở bản đồ đầy đủ →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
