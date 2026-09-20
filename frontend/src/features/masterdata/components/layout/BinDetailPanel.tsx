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
      <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm text-sm sticky top-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <Info className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Bảng Giám Sát Ô Kệ (Inspector)
          </h3>
        </div>

        <p className="text-slate-600 text-xs leading-relaxed">
          Hãy click vào một ô kệ trên sơ đồ bên trái để kiểm tra chi tiết tải trọng, mặt hàng đang lưu trữ và số lô hạn dùng.
        </p>

        {/* Tổng quan phân khu */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 font-mono text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Tổng số vị trí:</span>
            <span className="text-slate-900 font-bold">{totalLocationsCount} ô</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Đang lưu hàng:</span>
            <span className="text-indigo-600 font-bold">{occupiedCount} ô</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tỷ lệ lấp đầy:</span>
            <span className="text-emerald-600 font-bold">
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
    <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm text-sm sticky top-4">
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <span className="text-xs text-slate-500 uppercase font-mono block">Chi Tiết Vị Trí</span>
          <h3 className="font-bold text-indigo-700 text-base font-mono mt-0.5">
            {selectedBin.barcode}
          </h3>
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full font-sans border ${
            selectedBin.status === 'OCCUPIED'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : selectedBin.status === 'RESERVED'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : selectedBin.status === 'EXPIRING'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
      <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-slate-500">Phân Khu:</span>
          <span className="text-slate-900 font-bold">{selectedBin.zoneName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tọa Độ Vật Lý:</span>
          <span className="text-indigo-600 font-bold">
            Dãy {selectedBin.aisle} • Kệ {selectedBin.rack} • Tầng {selectedBin.shelf}
          </span>
        </div>
      </div>

      {/* Thước Đo Tải Trọng An Toàn (Weight Safety Gauge) */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-700 font-semibold flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            Tải Trọng Chịu Lực:
          </span>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {selectedBin.currentWeight} / {selectedBin.maxWeight} kg ({weightPct}%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              weightPct > 85 ? 'bg-rose-500' : weightPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${weightPct}%` }}
          ></div>
        </div>

        <p className="text-xs text-slate-500">
          {selectedBin.shelf === 'S01'
            ? 'Tầng trệt S01: Chuyên hàng nặng (>100kg), kết cấu gia cố thép chịu lực.'
            : 'Tầng S02: Hàng nhẹ hoặc vừa (≤100kg), tối ưu diện tích lưu kho.'}
        </p>
      </div>

      {/* Thông tin sản phẩm lưu trữ */}
      {selectedBin.productName ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-sm">
          <span className="text-xs uppercase font-bold text-slate-500 tracking-wider block">
            Hàng Hóa Đang Lưu Trữ
          </span>
          <h4 className="font-bold text-slate-900 text-sm">{selectedBin.productName}</h4>
          <div className="space-y-1.5 font-mono text-xs pt-1 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã SKU:</span>
              <span className="text-indigo-600 font-semibold">{selectedBin.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Lô Hàng:</span>
              <span className="text-slate-800 font-bold">{selectedBin.batch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hạn Sử Dụng:</span>
              <span className={selectedBin.status === 'EXPIRING' ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                {selectedBin.expiry}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
              <span className="text-slate-500">Số Lượng Tồn:</span>
              <span className="text-base font-extrabold text-emerald-600 font-mono">
                {selectedBin.qty} cái
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-1">
          <p className="font-bold">Vị Trí Sẵn Sàng</p>
          <p className="text-xs text-slate-500">Ô kệ này chưa có hàng, sẵn sàng tiếp nhận hàng nhập mới.</p>
        </div>
      )}

      {/* Action Button */}
      <Link
        to="/inventory"
        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-600/20"
      >
        <span>Xem Tồn Kho & Điều Phối Xuất</span>
        <ExternalLink className="w-4 h-4" />
      </Link>
    </div>
  );
};
