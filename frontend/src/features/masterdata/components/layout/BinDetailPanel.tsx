import React, { useState } from 'react';
import { BinLocation } from '../../types';
import { locationService } from '../../services/locationService';
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
  Lock,
  Unlock,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BinDetailPanelProps {
  selectedBin: BinLocation | null;
  totalLocationsCount: number;
  occupiedCount: number;
  onOpenTransferModal?: (bin: BinLocation) => void;
  onRefreshLocations?: () => void;
}

export const BinDetailPanel: React.FC<BinDetailPanelProps> = ({
  selectedBin,
  totalLocationsCount,
  occupiedCount,
  onOpenTransferModal,
  onRefreshLocations,
}) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  React.useEffect(() => {
    setStatusError(null);
  }, [selectedBin?.id]);

  const isLocked = selectedBin ? selectedBin.isActive === false : false;
  const hasReservedStock = selectedBin
    ? (selectedBin.reservedQty != null && selectedBin.reservedQty > 0) || selectedBin.status === 'RESERVED'
    : false;

  const handleToggleLock = async () => {
    if (!selectedBin || updatingStatus) return;
    setUpdatingStatus(true);
    setStatusError(null);
    const nextActive = selectedBin.isActive === false;
    try {
      await locationService.updateLocationStatus(selectedBin.id, nextActive);
      onRefreshLocations?.();
    } catch (err: any) {
      setStatusError(err?.response?.data?.message || err?.message || 'Không thể cập nhật trạng thái ô kệ.');
    } finally {
      setUpdatingStatus(false);
    }
  };
  if (!selectedBin) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm text-sm sticky top-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
            <Package className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
            Thông Tin Chi Tiết Vị Trí Ô Kệ
          </h3>
        </div>

        <p className="text-slate-600 text-xs leading-relaxed">
          Chọn một vị trí ô kệ trên sơ đồ để kiểm tra tải trọng, thông tin sản phẩm và thực hiện các thao tác kho.
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

  // Tỷ lệ tải trọng thực tế (không che giấu tình trạng vượt tải trọng thiết kế)
  const weightPct = selectedBin.maxWeight > 0 ? Math.round((selectedBin.currentWeight / selectedBin.maxWeight) * 100) : 0;
  const barPct = Math.min(weightPct, 100);
  const isOverloaded = selectedBin.maxWeight > 0 && selectedBin.currentWeight > selectedBin.maxWeight;
  const excessWeight = isOverloaded ? Number((selectedBin.currentWeight - selectedBin.maxWeight).toFixed(1)) : 0;

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
            ? 'Lô Cận Hạn'
            : 'Ô Còn Trống'}
        </span>
      </div>

      {/* Khối quản lý trạng thái Khóa / Mở Khóa Ô Kệ (Toggle Switch) */}
      <div
        className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
          isLocked ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2">
          {isLocked ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Đang Khóa / Bảo Trì</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Hoạt Động Bình Thường</span>
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={updatingStatus || (!isLocked && hasReservedStock)}
          onClick={handleToggleLock}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
            isLocked
              ? 'bg-rose-600 text-white border-rose-700 hover:bg-rose-700 shadow-rose-200 cursor-pointer'
              : hasReservedStock
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
          }`}
          title={
            isLocked
              ? 'Bấm để Mở Khóa ô kệ'
              : hasReservedStock
              ? 'Không thể khóa bảo trì ô đang có hàng giữ cho đơn xuất kho'
              : 'Bấm để Khóa Bảo Trì ô kệ này'
          }
        >
          {isLocked ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-white" />
              <span>{updatingStatus ? 'Đang cập nhật...' : 'Mở Khóa Ô'}</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              <span>{updatingStatus ? 'Đang cập nhật...' : 'Khóa Bảo Trì'}</span>
            </>
          )}
        </button>
      </div>
      {!isLocked && hasReservedStock && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Ô kệ đang giữ hàng cho đơn xuất kho — tạm khóa thao tác bảo trì để đảm bảo tiến độ lấy hàng.</span>
        </div>
      )}
      {statusError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
          {statusError}
        </div>
      )}

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
      <div className={`p-3 rounded-xl border space-y-2 ${isOverloaded ? 'bg-rose-50/80 border-rose-300' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-700 font-semibold flex items-center gap-1.5">
            <Scale className={`w-3.5 h-3.5 ${isOverloaded ? 'text-rose-600' : 'text-blue-600'}`} />
            Tải Trọng Chịu Lực:
          </span>
          <span className={`font-mono font-bold text-xs ${isOverloaded ? 'text-rose-700' : 'text-slate-900'}`}>
            {selectedBin.currentWeight} / {selectedBin.maxWeight} kg ({weightPct}%{isOverloaded ? ' • QUÁ TẢI' : ''})
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOverloaded ? 'bg-rose-600' : weightPct > 85 ? 'bg-rose-500' : weightPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${barPct}%` }}
          ></div>
        </div>

        <p className="text-[11px] text-slate-500 font-medium">
          Tải trọng thiết kế: <span className="font-bold text-slate-700">{selectedBin.maxWeight} kg</span> •{' '}
          {isOverloaded ? (
            <>
              Vượt tải thiết kế:{' '}
              <span className="font-extrabold text-rose-700">+{excessWeight} kg</span>
            </>
          ) : (
            <>
              Sức chứa còn lại:{' '}
              <span className="font-bold text-emerald-700">{Math.max(0, Number((selectedBin.maxWeight - selectedBin.currentWeight).toFixed(1)))} kg</span>
            </>
          )}
        </p>

        {isOverloaded && (
          <div className="p-2 rounded-lg bg-rose-100/90 border border-rose-300 text-[11px] text-rose-900 font-semibold flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-700 shrink-0 mt-0.5" />
            <span>Cảnh báo an toàn kệ: Tải trọng thực tế đang vượt giới hạn thiết kế. Vui lòng điều chuyển bớt hàng sang ô khác.</span>
          </div>
        )}
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
              <span className="text-slate-500">Số Lô:</span>
              <span className="text-slate-800 font-bold">{selectedBin.batch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Hạn Dùng:</span>
              <span className={selectedBin.status === 'EXPIRING' ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                {selectedBin.expiry}
              </span>
            </div>
            <div className="pt-2 border-t border-blue-100 space-y-1 font-mono text-2xs">
              <div className="flex justify-between items-center text-slate-700">
                <span className="font-semibold">Tồn Thực Tế:</span>
                <span className="font-bold text-slate-900">{selectedBin.onHandQty != null ? selectedBin.onHandQty : (selectedBin.qty || 0)} cái</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Đang Giữ Đơn:</span>
                <span className={`font-bold ${
                  (selectedBin.reservedQty && selectedBin.reservedQty > 0) || selectedBin.status === 'RESERVED'
                    ? 'text-amber-600'
                    : 'text-slate-500'
                }`}>
                  {selectedBin.reservedQty != null ? selectedBin.reservedQty : (selectedBin.status === 'RESERVED' ? selectedBin.qty : 0)} cái
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-blue-100/60 font-sans">
                <span className="text-slate-800 font-bold text-xs">Tồn Khả Dụng:</span>
                <span className={`text-sm font-extrabold font-mono ${
                  (selectedBin.availableQty != null ? selectedBin.availableQty : (selectedBin.status === 'RESERVED' ? 0 : selectedBin.qty || 0)) > 0
                    ? 'text-emerald-700'
                    : 'text-rose-600'
                }`}>
                  {selectedBin.availableQty != null ? selectedBin.availableQty : (selectedBin.status === 'RESERVED' ? 0 : selectedBin.qty || 0)} cái
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : isLocked ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-center space-y-1">
          <p className="font-bold">Ô Kệ Đang Khóa Bảo Trì</p>
          <p className="text-xs text-rose-700">Tạm ngưng tiếp nhận hàng nhập kho mới và điều chuyển cho đến khi được mở khóa.</p>
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
              disabled={isLocked}
              title={isLocked ? 'Ô kệ đang khóa bảo trì' : 'Lập lệnh điều chuyển hàng sang vị trí ô kệ khác'}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-200 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>{isLocked ? 'Ô Kệ Đang Khóa Bảo Trì' : 'Điều Chuyển Hàng Sang Ô Khác'}</span>
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
            {isLocked ? (
              <button
                type="button"
                disabled
                title="Ô kệ đang khóa bảo trì"
                className="w-full py-2.5 px-3 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 opacity-75 cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Ô Kệ Đang Khóa Bảo Trì</span>
              </button>
            ) : (
              <Link
                to="/inbound"
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cất Hàng Nhập Kho</span>
              </Link>
            )}

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
