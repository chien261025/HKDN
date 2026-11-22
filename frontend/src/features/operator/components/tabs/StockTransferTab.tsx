import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRightLeft, ScanLine, CheckCircle2, AlertTriangle, RefreshCw, Box, Check, Calendar } from 'lucide-react';
import { operatorService, LocationDto, ProductDto } from '../../services/operatorService';
import { soundEffects } from '../../utils/soundEffects';

interface StockTransferTabProps {
  onOpenScanner: (targetField?: 'FROM' | 'TO') => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
  activeScanTarget?: 'FROM' | 'TO' | null;
  isCompact?: boolean;
}

export const StockTransferTab: React.FC<StockTransferTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
  activeScanTarget,
  isCompact,
}) => {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fromBarcode, setFromBarcode] = useState('');
  const [toBarcode, setToBarcode] = useState('');
  const [selectedInvId, setSelectedInvId] = useState<number | null>(null);
  const [transferQty, setTransferQty] = useState<string>('5');
  const [notes, setNotes] = useState('Điều chuyển vị trí nội bộ qua thiết bị PDA');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [locs, prods, invs] = await Promise.all([
        operatorService.getLocations(),
        operatorService.getProducts(),
        operatorService.getInventories(),
      ]);
      setLocations(locs);
      setProducts(prods);
      setInventories(invs);

      // Tự động chọn ô nguồn có tồn kho khả dụng nếu chưa chọn
      if (!fromBarcode && locs.length > 0) {
        const locWithStock = locs.find((l) =>
          invs.some((i) => i.locationId === l.id && i.availableQty > 0)
        );
        const initialFrom = locWithStock ? locWithStock.binBarcode : locs[0].binBarcode;
        setFromBarcode(initialFrom);

        const destLoc = locs.find((l) => l.binBarcode !== initialFrom);
        if (destLoc) setToBarcode(destLoc.binBarcode);
      }
    } catch (err: any) {
      setFeedback({ msg: 'Lỗi tải dữ liệu kho: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [fromBarcode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Xử lý khi có mã quét từ Camera / Súng quét barcode PDA
  useEffect(() => {
    if (scannedCode) {
      const matchedLoc = locations.find(
        (l) => l.binBarcode.toLowerCase() === scannedCode.toLowerCase()
      );

      if (matchedLoc) {
        soundEffects.playSuccessBeep();
        if (activeScanTarget === 'TO') {
          setToBarcode(matchedLoc.binBarcode);
          setFeedback({ msg: `[PDA] Đã chọn ô đích: ${matchedLoc.binBarcode}`, type: 'success' });
        } else {
          setFromBarcode(matchedLoc.binBarcode);
          setFeedback({ msg: `[PDA] Đã chọn ô nguồn: ${matchedLoc.binBarcode}`, type: 'success' });
        }
      } else {
        // Kiểm tra xem mã quét có phải là mã vạch sản phẩm không
        const matchedInv = inventories.find(
          (i) =>
            i.locationBarcode === fromBarcode &&
            (i.barcode === scannedCode || i.sku === scannedCode)
        );
        if (matchedInv) {
          soundEffects.playSuccessBeep();
          setSelectedInvId(matchedInv.id);
          setFeedback({
            msg: `[PDA] Đã chọn mặt hàng: ${matchedInv.productName} (Lô ${matchedInv.batchNumber})`,
            type: 'success',
          });
        } else {
          soundEffects.playErrorBuzz();
          setFeedback({ msg: `[PDA] Mã không hợp lệ hoặc không có trong ô nguồn: ${scannedCode}`, type: 'error' });
        }
      }
      onClearScannedCode?.();
    }
  }, [scannedCode, locations, inventories, activeScanTarget, fromBarcode, onClearScannedCode]);

  const fromLocation = locations.find((l) => l.binBarcode === fromBarcode);
  const toLocation = locations.find((l) => l.binBarcode === toBarcode);

  // Danh sách các mặt hàng thực tế đang có số dư khả dụng tại ô nguồn
  const availableInFromLoc = inventories.filter(
    (inv) => fromLocation && inv.locationId === fromLocation.id && inv.availableQty > 0
  );

  // Chọn mặt hàng đang active
  const activeInvItem =
    availableInFromLoc.find((inv) => inv.id === selectedInvId) || availableInFromLoc[0] || null;

  const currentAvailableQty = activeInvItem?.availableQty || 0;

  // Tự động set số lượng mặc định khi đổi mặt hàng
  useEffect(() => {
    if (activeInvItem && (!selectedInvId || !availableInFromLoc.some((i) => i.id === selectedInvId))) {
      setSelectedInvId(activeInvItem.id);
      setTransferQty(String(Math.min(5, activeInvItem.availableQty)));
    }
  }, [activeInvItem, selectedInvId, availableInFromLoc]);

  const handleConfirmTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromLocation || !toLocation) {
      soundEffects.playErrorBuzz();
      setFeedback({ msg: 'Vui lòng chọn đầy đủ ô nguồn và ô đích!', type: 'error' });
      return;
    }
    if (fromLocation.id === toLocation.id) {
      soundEffects.playErrorBuzz();
      setFeedback({ msg: 'Ô nguồn và ô đích không được trùng nhau!', type: 'error' });
      return;
    }
    if (!activeInvItem) {
      soundEffects.playErrorBuzz();
      setFeedback({ msg: 'Ô nguồn hiện tại không có mặt hàng nào để điều chuyển!', type: 'error' });
      return;
    }
    const qty = parseInt(transferQty);
    if (isNaN(qty) || qty <= 0) {
      soundEffects.playErrorBuzz();
      setFeedback({ msg: 'Số lượng chuyển phải là số nguyên lớn hơn 0!', type: 'error' });
      return;
    }
    if (qty > currentAvailableQty) {
      soundEffects.playErrorBuzz();
      setFeedback({
        msg: `Số lượng chuyển (${qty}) vượt quá tồn khả dụng (${currentAvailableQty}) của mặt hàng này!`,
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await operatorService.executeTransfer({
        productId: activeInvItem.productId,
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        batchId: activeInvItem.batchId,
        quantity: qty,
        notes: notes || 'Điều chuyển vị trí nội bộ PDA',
      });

      soundEffects.playCompleteChime();
      setFeedback({
        msg: `Thành công: Đã chuyển ${qty} ${activeInvItem.unit || 'sản phẩm'} ${activeInvItem.productName} từ ô ${fromLocation.binBarcode} sang ô ${toLocation.binBarcode} an toàn!`,
        type: 'success',
      });
      await loadData();
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setFeedback({
        msg: 'Lỗi thực hiện điều chuyển: ' + (err.response?.data?.message || err.message),
        type: 'error',
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Điều Chuyển Ô Kệ (Stock Transfer)
            </h2>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          title="Tải lại số dư ô kệ"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      <form onSubmit={handleConfirmTransfer} className="space-y-4">
        <div className={`grid grid-cols-1 ${isCompact ? '' : 'lg:grid-cols-2'} gap-4`}>
          {/* Cột Trái: Ô Nguồn & Mặt Hàng */}
          <div className="space-y-3.5">
            {/* Ô Kệ Nguồn */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Ô Kệ Nguồn (From Bin)
                </span>
                <button
                  type="button"
                  onClick={() => onOpenScanner('FROM')}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <ScanLine className="w-3.5 h-3.5" /> Quét ô nguồn
                </button>
              </div>
              <select
                value={fromBarcode}
                onChange={(e) => {
                  setFromBarcode(e.target.value);
                  setSelectedInvId(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
              >
                {locations.map((loc) => {
                  const hasStock = inventories.some((i) => i.locationId === loc.id && i.availableQty > 0);
                  return (
                    <option key={loc.id} value={loc.binBarcode}>
                      {loc.binBarcode} ({loc.zoneCode}) {hasStock ? '• [Có hàng]' : '• [Trống]'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Chọn Mặt Hàng Trong Ô Nguồn */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Mặt Hàng & Lô Cần Chuyển
                </span>
                <span className="text-2xs font-mono font-bold text-slate-400">
                  {availableInFromLoc.length} MẶT HÀNG TRONG Ô
                </span>
              </div>

              {availableInFromLoc.length === 0 ? (
                <div className="p-4 text-center text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
                  Ô kệ nguồn này hiện không có mặt hàng nào có tồn kho khả dụng để chuyển.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-0.5">
                  {availableInFromLoc.map((item) => {
                    const isSelected = activeInvItem?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedInvId(item.id);
                          setTransferQty(String(Math.min(5, item.availableQty)));
                        }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/80 ring-2 ring-purple-100 shadow-xs'
                            : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-slate-900 text-xs truncate">{item.productName}</div>
                          {isSelected && <Check className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-2xs font-mono text-slate-600">
                          <span>SKU: <strong className="text-slate-800">{item.sku}</strong></span>
                          <span>• Lô: <strong className="text-indigo-700">{item.batchNumber}</strong></span>
                          {item.expiryDate && (
                            <span>• HSD: <strong>{new Date(item.expiryDate).toLocaleDateString('vi-VN')}</strong></span>
                          )}
                        </div>
                        <div className="mt-1 pt-1 border-t border-slate-200/60 flex items-center justify-between text-2xs font-mono">
                          <span className="text-slate-500">Khả dụng:</span>
                          <strong className="text-emerald-700 font-extrabold text-xs">
                            {item.availableQty} {item.unit || 'cái'}
                          </strong>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Cột Phải: Ô Đích, Số Lượng & Nút Xác Nhận */}
          <div className="space-y-3.5">
            {/* Ô Kệ Đích */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Ô Kệ Đích (To Bin)
                </span>
                <button
                  type="button"
                  onClick={() => onOpenScanner('TO')}
                  className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <ScanLine className="w-3.5 h-3.5" /> Quét ô đích
                </button>
              </div>
              <select
                value={toBarcode}
                onChange={(e) => setToBarcode(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-purple-600 focus:outline-none"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.binBarcode} disabled={loc.binBarcode === fromBarcode}>
                    {loc.binBarcode} ({loc.zoneCode}) {loc.binBarcode === fromBarcode ? '• [Ô nguồn trùng]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Số Lượng Điều Chuyển */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Số Lượng Điều Chuyển
                </span>
                {activeInvItem && (
                  <span className="text-2xs font-mono text-slate-500">
                    Tối đa: <strong className="text-emerald-700">{currentAvailableQty} {activeInvItem.unit}</strong>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold font-mono text-center focus:bg-white focus:border-purple-600 focus:outline-none"
                  min="1"
                  max={currentAvailableQty || 9999}
                />
                <button
                  type="button"
                  onClick={() => setTransferQty(String(currentAvailableQty))}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Tối Đa
                </button>
              </div>
            </div>

            {/* Ghi chú điều chuyển */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
              <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
                Ghi chú điều chuyển (Tùy chọn)
              </span>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Lý do điều chuyển (sắp xếp lại kho, tối ưu vị trí...)"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || currentAvailableQty <= 0 || fromBarcode === toBarcode}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md shadow-purple-200 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{submitting ? 'Đang Thực Hiện Điều Chuyển...' : 'Xác Nhận Chuyển Ô Kệ & Cập Nhật Sổ Cái'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
