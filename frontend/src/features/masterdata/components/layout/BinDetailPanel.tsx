import React from 'react';
import { BinLocation } from '../../types';
import {
  Scale,
  ArrowRightLeft,
  Package,
  Calendar,
  MapPin,
  ExternalLink,
  Printer,
  Plus,
  Truck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BinDetailPanelProps {
  selectedBin: BinLocation | null;
  totalLocationsCount: number;
  occupiedCount: number;
  onOpenTransferModal?: (bin: BinLocation) => void;
}

export const BinDetailPanel: React.FC<BinDetailPanelProps> = ({
  selectedBin,
  totalLocationsCount,
  occupiedCount,
  onOpenTransferModal,
}) => {
  if (!selectedBin) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm text-sm sticky top-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Package className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Bảng Tra Cứu Vị Trí (Inspector)
          </h3>
        </div>

        <p className="text-slate-600 text-xs leading-relaxed">
          Hãy nhấp chọn một ô kệ trên sơ đồ bên trái để kiểm tra tải trọng, thông tin sản phẩm và thực hiện các thao tác điều chuyển, xuất hàng.
        </p>

        {/* Tổng quan phân khu */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 font-mono text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Tổng số ô kệ:</span>
            <span className="text-slate-900 font-bold">{totalLocationsCount} vị trí</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Đang chứa hàng:</span>
            <span className="text-blue-600 font-bold">{occupiedCount} ô</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Ô còn trống:</span>
            <span className="text-emerald-600 font-bold">{totalLocationsCount - occupiedCount} ô</span>
          </div>
          <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
            <span>Tỷ lệ lấp đầy:</span>
            <span className="text-indigo-700 font-extrabold">
              {totalLocationsCount > 0 ? Math.round((occupiedCount / totalLocationsCount) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Quick link to Labels */}
        <Link
          to="/labels"
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all border border-slate-300"
        >
          <Printer className="w-4 h-4 text-blue-600" />
          <span>Trung Tâm In Mã Vạch & QR</span>
        </Link>
      </div>
    );
  }

  // Tỷ lệ tải trọng
  const weightPct = Math.min(Math.round((selectedBin.currentWeight / selectedBin.maxWeight) * 100), 100);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm text-sm sticky top-4">
      {/* Header Panel */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <span className="text-[11px] text-slate-500 uppercase font-mono block font-bold">Mã Vị Trí Ô Kệ</span>
          <h3 className="font-extrabold text-blue-900 text-base font-mono mt-0.5">
            {selectedBin.barcode}
          </h3>
        </div>

        <span
          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
            selectedBin.status === 'OCCUPIED'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : selectedBin.status === 'RESERVED'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : selectedBin.status === 'EXPIRING'
              ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}
        >
          {selectedBin.status === 'OCCUPIED'
            ? 'Đang Chứa Hàng'
            : selectedBin.status === 'RESERVED'
            ? 'Đang Giữ Đơn'
            : selectedBin.status === 'EXPIRING'
            ? 'Cận Hạn (FEFO)'
            : 'Ô Còn Trống'}
        </span>
      </div>

      {/* Tọa độ không gian kho */}
      <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-slate-500">Phân Khu:</span>
          <span className="text-slate-900 font-bold">{selectedBin.zoneName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Tọa Độ Vật Lý:</span>
          <span className="text-blue-700 font-bold">
            Dãy {selectedBin.aisle} • Kệ {selectedBin.rack} • Tầng {selectedBin.shelf} • Ô {selectedBin.binNumber}
          </span>
        </div>
      </div>

      {/* Thước Đo Tải Trọng An Toàn (Weight Safety Gauge) */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-700 font-semibold flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-blue-600" />
            Tải Trọng Chịu Lực:
          </span>
          <span className="font-mono font-bold text-slate-900 text-xs">
            {selectedBin.currentWeight} / {selectedBin.maxWeight} kg ({weightPct}%)
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              weightPct > 85 ? 'bg-rose-500' : weightPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${weightPct}%` }}
          ></div>
        </div>

        <p className="text-[11px] text-slate-500">
          {selectedBin.shelf === 'S01'
            ? 'Tầng trệt S01: Gia cố thép chịu lực, chứa pallet hàng nặng (>100kg).'
            : 'Tầng cao S02: Chuyên hàng nhẹ hoặc vừa, thuận tiện thao tác bốc dỡ.'}
        </p>
      </div>

      {/* Thông tin sản phẩm lưu trữ */}
      {selectedBin.productName ? (
        <div className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-200 space-y-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
            Hàng Hóa Đang Lưu Trữ
          </span>
          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">{selectedBin.productName}</h4>
          <div className="space-y-1 font-mono text-xs pt-1 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Mã SKU:</span>
              <span className="text-blue-700 font-bold">{selectedBin.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số Lô (Batch):</span>
              <span className="text-slate-800 font-bold">{selectedBin.batch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hạn Dùng:</span>
              <span className={selectedBin.status === 'EXPIRING' ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                {selectedBin.expiry}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-blue-100">
              <span className="text-slate-600 font-bold">Số Lượng Thực Tế:</span>
              <span className="text-base font-extrabold text-blue-700 font-mono">
                {selectedBin.qty} cái
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center space-y-1">
          <p className="font-bold">Ô Kệ Còn Trống</p>
          <p className="text-xs text-slate-600">Sẵn sàng nhận hàng nhập kho mới hoặc tiếp nhận điều chuyển.</p>
        </div>
      )}

      {/* Bộ nút thao tác nghiệp vụ trực tiếp (Action Buttons) */}
      <div className="space-y-2 pt-1">
        {selectedBin.productName ? (
          <>
            <button
              type="button"
              onClick={() => onOpenTransferModal && onOpenTransferModal(selectedBin)}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-200 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Điều Chuyển Hàng Sang Ô Khác</span>
            </button>

            <div className="flex items-center gap-2">
              <Link
                to="/outbound"
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200"
              >
                <Truck className="w-3.5 h-3.5 text-slate-600" />
                <span>Xuất Hàng</span>
              </Link>
              <Link
                to={`/labels?bin=${selectedBin.barcode}&tab=BINS`}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200"
                title="In tem nhãn Barcode GS1 dán lên kệ"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span>In Tem Ô Kệ</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/inbound"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cất Hàng Nhập Kho (Putaway)</span>
            </Link>

            <Link
              to={`/labels?bin=${selectedBin.barcode}&tab=BINS`}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200"
              title="In tem nhãn Barcode GS1 dán lên kệ"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>In Tem Mã Vạch Dán Kệ</span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
};
