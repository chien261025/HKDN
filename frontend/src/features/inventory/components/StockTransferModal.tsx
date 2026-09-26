import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft, MapPin, Package, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { StockItem } from '../types';
import { inventoryService } from '../services/inventoryService';
import { locationService } from '../../masterdata/services/locationService';
import { BinLocation } from '../../masterdata/types';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceItem: StockItem | null;
  onSuccess: () => void;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  sourceItem,
  onSuccess,
}) => {
  const [locations, setLocations] = useState<BinLocation[]>([]);
  const [targetLocationId, setTargetLocationId] = useState<number | ''>('');
  const [transferQty, setTransferQty] = useState<string>('1');
  const [notes, setNotes] = useState<string>('Tái sắp xếp không gian kho');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      locationService.getLocations().then((locs) => {
        setLocations(locs);
        // Chọn ô đích hợp lệ đầu tiên khác ô nguồn
        const diff = locs.find((l) => l.barcode !== sourceItem?.locationBarcode && l.id !== sourceItem?.locationId);
        if (diff) setTargetLocationId(diff.id);
      });
      setTransferQty('1');
      setErrorMsg(null);
    }
  }, [isOpen, sourceItem]);

  if (!isOpen || !sourceItem) return null;

  const maxQty = sourceItem.availableQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const qty = parseInt(transferQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Số lượng điều chuyển phải lớn hơn 0!');
      return;
    }
    if (qty > maxQty) {
      setErrorMsg(`Số lượng điều chuyển (${qty}) vượt quá số lượng khả dụng tại ô nguồn (${maxQty})!`);
      return;
    }
    if (!targetLocationId) {
      setErrorMsg('Vui lòng chọn ô kệ đích để cất hàng!');
      return;
    }

    setLoading(true);
    try {
      const finalNotes = customNotes.trim() ? `${notes}: ${customNotes.trim()}` : notes;

      // Tìm locationId của ô nguồn (fallback theo id hoặc tra barcode nếu locationId chưa có)
      let fromLocId = sourceItem.locationId;
      if (!fromLocId) {
        const found = locations.find((l) => l.barcode === sourceItem.locationBarcode);
        fromLocId = found ? found.id : 5;
      }

      await inventoryService.transferStock({
        productId: sourceItem.productId,
        fromLocationId: fromLocId,
        toLocationId: Number(targetLocationId),
        batchId: sourceItem.batchId || 1,
        quantity: qty,
        notes: finalNotes,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Lỗi khi điều chuyển hàng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-semibold border border-indigo-100">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Lập Lệnh Điều Chuyển Hàng Nội Bộ</h2>
              <p className="text-2xs text-slate-500">Di chuyển giữa các ô kệ trong kho bãi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Chi tiết mặt hàng nguồn */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 text-sm">{sourceItem.name}</span>
              <span className="font-mono text-2xs font-medium px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
                {sourceItem.sku}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-2xs pt-1.5 border-t border-slate-200/80">
              <div>Số Lô: <strong className="text-slate-800 font-semibold">{sourceItem.batchNumber}</strong></div>
              <div>Hạn dùng: <strong className="text-rose-600 font-semibold">{sourceItem.expiryDate}</strong></div>
              <div className="flex items-center gap-1.5 col-span-2 whitespace-nowrap">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">Ô nguồn hiện tại: </span>
                <strong className="text-slate-800 font-semibold">{sourceItem.locationBarcode}</strong>
                <span className="text-slate-400">(Khả dụng: {maxQty} SP)</span>
              </div>
            </div>
          </div>

          {/* Chọn ô đích */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Vị Trí Ô Kệ Đích Nhận Hàng:</span>
            </label>
            <select
              value={targetLocationId}
              onChange={(e) => setTargetLocationId(Number(e.target.value))}
              required
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs font-semibold focus:outline-none focus:border-indigo-600 bg-white"
            >
              {locations
                .filter((l) => l.barcode !== sourceItem.locationBarcode && l.id !== sourceItem.locationId)
                .map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.barcode} • {loc.zoneName} (Tầng {loc.shelf})
                  </option>
                ))}
            </select>
          </div>

          {/* Số lượng điều chuyển */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Số Lượng Chuyển (Cái):</label>
              <button
                type="button"
                onClick={() => setTransferQty(String(maxQty))}
                className="text-2xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
              >
                Chuyển Hết ({maxQty})
              </button>
            </div>
            <input
              type="number"
              min="1"
              max={maxQty}
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
              required
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-indigo-700 focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Lý do điều chuyển */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">Lý Do / Mục Đích Điều Chuyển:</label>
            <select
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600 bg-white"
            >
              <option value="Tái sắp xếp không gian kho (Consolidation)">Tái sắp xếp không gian kho (Consolidation)</option>
              <option value="Hạ tải xuống tầng đáy S01 an toàn">Hạ tải xuống tầng đáy S01 an toàn</option>
              <option value="Chuyển vào kho mát Zone B bảo quản">Chuyển vào kho mát Zone B bảo quản</option>
              <option value="Gom hàng cận HSD gần cửa xuất (Picking)">Gom hàng cận HSD gần cửa xuất (Picking)</option>
              <option value="Khác">Khác...</option>
            </select>
            {notes === 'Khác' && (
              <input
                type="text"
                placeholder="Nhập ghi chú chi tiết..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full mt-1 p-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
              />
            )}
          </div>

          {/* Nút bấm */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4" />
              )}
              <span>Xác Nhận Điều Chuyển Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
