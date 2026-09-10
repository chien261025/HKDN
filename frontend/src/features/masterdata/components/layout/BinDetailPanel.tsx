import React from 'react';
import { BinLocation } from '../../types';
import { Info, Scale, ShieldCheck, ArrowRight, Package, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BinDetailPanelProps {
  selectedBin: BinLocation | null;
  totalLocationsCount: number;
  occupiedCount: number;
}

export const BinDetailPanel: React.FC<BinDetailPanelProps> = ({
  selectedBin,
  totalLocationsCount,
  occupiedCount,
}) => {
  if (!selectedBin) {
    return (
      <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-sm text-xs sticky top-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Info className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-white uppercase tracking-wider text-xs">
            Bảng Giám Sát Ô Kệ (Inspector)
          </h3>
        </div>

        <p className="text-slate-400 text-[11px] leading-relaxed">
          Hãy click vào một ô kệ trên sơ đồ bên trái để kiểm tra chi tiết tải trọng, mặt hàng đang lưu trữ và số lô hạn dùng.
        </p>

        {/* Tổng quan phân khu */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Tổng số vị trí:</span>
            <span className="text-white font-bold">{totalLocationsCount} ô</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Đang lưu hàng:</span>
            <span className="text-indigo-400 font-bold">{occupiedCount} ô</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Tỷ lệ lấp đầy:</span>
            <span className="text-emerald-400 font-bold">
              {totalLocationsCount > 0 ? Math.round((occupiedCount / totalLocationsCount) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Tỷ lệ tải trọng
  const weightPct = Math.min(Math.round((selectedBin.currentWeight / selectedBin.maxWeight) * 100), 100);

  return (
    <div className="bg-slate-900/60 rounded-2xl p-5 border border-slate-800 space-y-4 shadow-sm text-xs sticky top-4">
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Chi Tiết Vị Trí</span>
          <h3 className="font-bold text-white text-sm font-mono mt-0.5 text-cyan-300">
            {selectedBin.barcode}
          </h3>
        </div>

        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-sans ${
            selectedBin.status === 'OCCUPIED'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : selectedBin.status === 'RESERVED'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : selectedBin.status === 'EXPIRING'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {selectedBin.status === 'OCCUPIED'
            ? 'Đang Chứa Hàng'
            : selectedBin.status === 'RESERVED'
            ? 'Đang Giữ Đơn'
            : selectedBin.status === 'EXPIRING'
            ? 'Cận Date (FEFO)'
            : 'Ô Trống'}
        </span>
      </div>

      {/* Tọa độ không gian kho */}
      <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">Phân Khu:</span>
          <span className="text-white font-bold">{selectedBin.zoneName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Tọa Độ Vật Lý:</span>
          <span className="text-cyan-300 font-bold">
            Dãy {selectedBin.aisle} • Kệ {selectedBin.rack} • Tầng {selectedBin.shelf}
          </span>
        </div>
      </div>

      {/* Thước Đo Tải Trọng An Toàn (Weight Safety Gauge) */}
      <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            Tải Trọng Chịu Lực:
          </span>
          <span className="font-mono font-bold text-white text-xs">
            {selectedBin.currentWeight} / {selectedBin.maxWeight} kg ({weightPct}%)
          </span>
        </div>

        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              weightPct > 85 ? 'bg-rose-500' : weightPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${weightPct}%` }}
          ></div>
        </div>

        <p className="text-[10px] text-slate-400 font-mono">
          {selectedBin.shelf === 'S01'
            ? 'Tầng trệt S01: Chuyên hàng nặng (>100kg), kết cấu gia cố thép chịu lực.'
            : 'Tầng S02: Hàng nhẹ hoặc vừa (≤100kg), tối ưu diện tích lưu kho.'}
        </p>
      </div>

      {/* Thông tin sản phẩm lưu trữ */}
      {selectedBin.productName ? (
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide block">
            Hàng Hóa Đang Lưu Trữ
          </span>
          <h4 className="font-bold text-white text-sm">{selectedBin.productName}</h4>
          <div className="space-y-1 font-mono text-[11px] pt-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Mã SKU:</span>
              <span className="text-indigo-300">{selectedBin.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Lô Hàng:</span>
              <span className="text-cyan-300 font-bold">{selectedBin.batch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hạn Sử Dụng:</span>
              <span className={selectedBin.status === 'EXPIRING' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                {selectedBin.expiry}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800">
              <span className="text-slate-400">Số Lượng Tồn:</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">
                {selectedBin.qty} cái
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-500/20 text-emerald-300 text-xs text-center space-y-1">
          <p className="font-bold">Vị Trí Sẵn Sàng</p>
          <p className="text-[11px] text-slate-400">Ô kệ này chưa có hàng, sẵn sàng tiếp nhận hàng nhập mới.</p>
        </div>
      )}

      {/* Action Button */}
      <Link
        to="/inventory"
        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
      >
        <span>Xem Tồn Kho & Điều Phối Xuất</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};
