import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, ScanLine, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Box } from 'lucide-react';
import { operatorService, LocationDto, ProductDto } from '../../services/operatorService';
import { soundEffects } from '../../utils/soundEffects';

interface StockTransferTabProps {
  onOpenScanner: (targetField?: 'FROM' | 'TO') => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
  activeScanTarget?: 'FROM' | 'TO' | null;
}

export const StockTransferTab: React.FC<StockTransferTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
  activeScanTarget,
}) => {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fromBarcode, setFromBarcode] = useState('');
  const [toBarcode, setToBarcode] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<number>(1);
  const [transferQty, setTransferQty] = useState<string>('5');
  const [notes, setNotes] = useState('Chuyển ô kệ hiện trường PDA');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
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

      if (locs.length >= 2 && !fromBarcode) {
        setFromBarcode(locs[0].binBarcode);
        setToBarcode(locs[1].binBarcode);
      }
    } catch (err: any) {
      setFeedback({ msg: 'Lỗi tải dữ liệu kho: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý khi có mã quét từ camera / súng quét PDA
  useEffect(() => {
    if (scannedCode) {
      const matchedLoc = locations.find(
        (l) => l.binBarcode.toLowerCase() === scannedCode.toLowerCase()
      );

      if (matchedLoc) {
        soundEffects.playSuccessBeep();
        if (activeScanTarget === 'TO' || (fromBarcode && !toBarcode)) {
          setToBarcode(matchedLoc.binBarcode);
          setFeedback({ msg: `[PDA] Đã chọn ô kệ đích: ${matchedLoc.binBarcode}`, type: 'success' });
        } else {
          setFromBarcode(matchedLoc.binBarcode);
          setFeedback({ msg: `[PDA] Đã chọn ô kệ nguồn: ${matchedLoc.binBarcode}`, type: 'success' });
        }
      } else {
        const matchedProd = products.find((p) => p.barcode === scannedCode || p.sku === scannedCode);
        if (matchedProd) {
          soundEffects.playSuccessBeep();
          setSelectedProductId(matchedProd.id);
          setFeedback({ msg: `[PDA] Đã chọn sản phẩm: ${matchedProd.name}`, type: 'success' });
        } else {
          soundEffects.playErrorBuzz();
          setFeedback({ msg: `[PDA] Mã không tồn tại: ${scannedCode}`, type: 'error' });
        }
      }
      onClearScannedCode?.();
    }
  }, [scannedCode, locations, products, activeScanTarget, fromBarcode, toBarcode, onClearScannedCode]);

  const fromLocation = locations.find((l) => l.binBarcode === fromBarcode);
  const toLocation = locations.find((l) => l.binBarcode === toBarcode);

  // Tồn kho hiện có tại ô nguồn
  const availableInFromLoc = inventories.filter(
    (inv) => fromLocation && inv.locationId === fromLocation.id && inv.availableQty > 0
  );

  const activeInvItem = availableInFromLoc.find((inv) =>
    selectedProductId ? inv.productId === selectedProductId : true
  ) || availableInFromLoc[0];

  const currentAvailableQty = activeInvItem?.availableQty || 0;

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
    const qty = parseInt(transferQty);
    if (isNaN(qty) || qty <= 0) {
      soundEffects.playErrorBuzz();
      setFeedback({ msg: 'Số lượng chuyển phải lớn hơn 0!', type: 'error' });
      return;
    }
    if (qty > currentAvailableQty) {
      soundEffects.playErrorBuzz();
      setFeedback({
        msg: `Số lượng chuyển (${qty}) vượt quá tồn khả dụng (${currentAvailableQty}) tại ô nguồn!`,
        type: 'error',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      await operatorService.executeTransfer({
        productId: activeInvItem ? activeInvItem.productId : (selectedProductId || 1),
        fromLocationId: fromLocation.id,
        toLocationId: toLocation.id,
        batchId: activeInvItem ? activeInvItem.batchId : selectedBatchId,
        quantity: qty,
        notes: notes || 'Chuyển vị trí nhanh qua PDA',
      });

      soundEffects.playCompleteChime();
      setFeedback({
        msg: `Thành công: Đã chuyển ${qty} hàng từ ô ${fromLocation.binBarcode} sang ô ${toLocation.binBarcode} và tự động ghi sổ cái!`,
        type: 'success',
      });
      await loadData();
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setFeedback({ msg: 'Lỗi thực hiện điều chuyển: ' + (err.response?.data?.message || err.message), type: 'error' });
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
              3. Điều Chuyển Ô Kệ (Transfer)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Chuyển hàng giữa 2 ô kệ & ghi sổ cái</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      <form onSubmit={handleConfirmTransfer} className="space-y-3">
        {/* Step 1: From Location */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">1. Ô Kệ Nguồn (From Bin)</span>
            <button
              type="button"
              onClick={() => onOpenScanner('FROM')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <ScanLine className="w-3.5 h-3.5" /> Quét ô nguồn
            </button>
          </div>
          <select
            value={fromBarcode}
            onChange={(e) => setFromBarcode(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.binBarcode}>
                {loc.binBarcode} ({loc.zoneCode})
              </option>
            ))}
          </select>
          <div className="text-2xs text-slate-500">
            Tồn khả dụng: <strong className="text-emerald-700">{currentAvailableQty} cái</strong>
          </div>
        </div>

        {/* Step 2: To Location */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">2. Ô Kệ Đích (To Bin)</span>
            <button
              type="button"
              onClick={() => onOpenScanner('TO')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <ScanLine className="w-3.5 h-3.5" /> Quét ô đích
            </button>
          </div>
          <select
            value={toBarcode}
            onChange={(e) => setToBarcode(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.binBarcode}>
                {loc.binBarcode} ({loc.zoneCode})
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Quantity */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">3. Số Lượng Điều Chuyển</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
              className="flex-1 px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold font-mono text-center"
              min="1"
              max={currentAvailableQty || 9999}
            />
            <button
              type="button"
              onClick={() => setTransferQty(String(currentAvailableQty))}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
            >
              Tối Đa
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting || currentAvailableQty <= 0}
          className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-extrabold text-sm shadow-md shadow-purple-200 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{submitting ? 'Đang Thực Hiện...' : 'Xác Nhận Chuyển Ô Kệ'}</span>
        </button>
      </form>
    </div>
  );
};
