import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, ArrowRightLeft, MapPin, Package, AlertCircle, CheckCircle2, RefreshCw, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { StockItem } from '../types';
import { inventoryService } from '../services/inventoryService';
import { locationService } from '../../masterdata/services/locationService';
import { BinLocation } from '../../masterdata/types';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceItem: StockItem | null;
  availableStocks?: StockItem[];
  availableLocations?: BinLocation[];
  onSuccess: () => void;
}

export const TRANSFER_REASONS = [
  { value: 'CONSOLIDATION', label: 'Tái sắp xếp / Gom gọn tối ưu diện tích kho' },
  { value: 'REPLENISHMENT', label: 'Bổ sung tồn kho từ khu dự trữ xuống kệ nhặt hàng' },
  { value: 'HEAVY_BOTTOM_SHELF', label: 'Hạ tải hàng nặng xuống tầng đáy (S01) an toàn' },
  { value: 'COOL_STORAGE', label: 'Chuyển vào kho mát (Zone B 2°C - 8°C) bảo quản tiêu chuẩn' },
  { value: 'NEAR_EXPIRY_STAGING', label: 'Gom hàng cận HSD về gần cửa xuất kho (FEFO Staging)' },
  { value: 'QUARANTINE_DISPOSAL', label: 'Cách ly lô hàng nghi vấn / Hết hạn chờ tiêu hủy' },
  { value: 'MAINTENANCE_RELOCATION', label: 'Giải phóng ô kệ để bảo trì / sửa chữa ô kệ' },
  { value: 'OTHER', label: 'Lý do khác (Nhập ghi chú chi tiết)...' },
];

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  sourceItem,
  availableStocks,
  availableLocations,
  onSuccess,
}) => {
  const [internalSourceItem, setInternalSourceItem] = useState<StockItem | null>(null);
  const [locations, setLocations] = useState<BinLocation[]>([]);
  const [targetLocationId, setTargetLocationId] = useState<number | ''>('');
  const [transferQty, setTransferQty] = useState<string>('1');
  const [selectedReason, setSelectedReason] = useState<string>('CONSOLIDATION');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Danh sách các ô kệ đang khóa bảo trì lưu trong localStorage
  const lockedBins = useMemo(() => {
    try {
      const saved = localStorage.getItem('smart_wms_locked_bins');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [isOpen]);

  const effectiveItem = sourceItem || internalSourceItem || (availableStocks && availableStocks.length > 0 ? availableStocks[0] : null);

  const targetWhId = effectiveItem?.warehouseId || (
    effectiveItem?.locationBarcode?.startsWith('WH02') ? 2 :
    effectiveItem?.locationBarcode?.startsWith('WH03') ? 3 :
    effectiveItem?.locationBarcode?.startsWith('WH04') ? 4 : 1
  );

  // Chỉ khởi tạo state khi modal mở (tránh loop re-render làm mất lựa chọn của người dùng)
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setErrorMsg(null);
      const curItem = sourceItem || (availableStocks && availableStocks.length > 0 ? availableStocks[0] : null);
      if (curItem) {
        setInternalSourceItem(curItem);
        const maxAvail = curItem.isExpired ? (curItem.onHandQty || 0) : (curItem.availableQty != null ? curItem.availableQty : curItem.onHandQty || 0);
        setTransferQty(maxAvail > 0 ? '1' : '0');
        if (curItem.isExpired) {
          setSelectedReason('QUARANTINE_DISPOSAL');
        } else {
          setSelectedReason('CONSOLIDATION');
        }
      }
      setCustomNotes('');

      // Nạp danh sách ô kệ
      if (availableLocations && availableLocations.length > 0) {
        setLocations(availableLocations);
      } else {
        locationService.getLocations().then((locs) => {
          if (locs && locs.length > 0) {
            setLocations(locs);
          }
        });
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  // Cập nhật locations khi availableLocations thay đổi từ component cha
  useEffect(() => {
    if (availableLocations && availableLocations.length > 0) {
      setLocations(availableLocations);
    }
  }, [availableLocations]);

  // Danh sách ô đích hợp lệ (cùng chi nhánh kho, khác ô nguồn)
  const validTargetLocations = useMemo(() => {
    return locations.filter((l) => {
      const locWhId = l.warehouseId || (
        l.barcode?.startsWith('WH02') ? 2 :
        l.barcode?.startsWith('WH03') ? 3 :
        l.barcode?.startsWith('WH04') ? 4 : 1
      );
      return (
        l.barcode !== effectiveItem?.locationBarcode &&
        l.id !== effectiveItem?.locationId &&
        locWhId === targetWhId
      );
    });
  }, [locations, effectiveItem, targetWhId]);

  // Tự động chọn ô đích đầu tiên khi modal mở và danh sách có dữ liệu
  useEffect(() => {
    if (isOpen && validTargetLocations.length > 0) {
      const currentValid = validTargetLocations.some((l) => l.id === Number(targetLocationId));
      if (!currentValid) {
        if (effectiveItem?.isExpired) {
          const qua = validTargetLocations.find((l) => l.barcode?.includes('QUA') || (l as any).zoneCode?.includes('QUA'));
          setTargetLocationId(qua ? qua.id : validTargetLocations[0].id);
        } else {
          setTargetLocationId(validTargetLocations[0].id);
        }
      }
    }
  }, [isOpen, validTargetLocations, targetLocationId, effectiveItem?.isExpired]);

  if (!isOpen || !effectiveItem) return null;

  const isSourceLocked = lockedBins.includes(effectiveItem.locationBarcode);
  const onHand = effectiveItem.onHandQty != null ? effectiveItem.onHandQty : 0;
  const reserved = effectiveItem.reservedQty != null ? effectiveItem.reservedQty : 0;
  const available = effectiveItem.availableQty != null ? effectiveItem.availableQty : Math.max(0, onHand - reserved);
  const isFullyReserved = !effectiveItem.isExpired && available <= 0 && reserved > 0;
  const maxQty = effectiveItem.isExpired ? onHand : available;
  const unitName = effectiveItem.unit || 'Cái';
  const selectedTargetLoc = locations.find((l) => l.id === Number(targetLocationId));
  const isTargetLocked = selectedTargetLoc ? lockedBins.includes(selectedTargetLoc.barcode) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isSourceLocked) {
      setErrorMsg(`Ô kệ nguồn (${effectiveItem.locationBarcode}) đang bị khóa bảo trì! Không thể thực hiện chuyển hàng ra ngoài.`);
      return;
    }

    if (isFullyReserved) {
      setErrorMsg(`Toàn bộ tồn kho tại ô nguồn đang được giữ cho đơn xuất kho (Reserved: ${reserved} ${unitName}). Không thể điều chuyển hàng đang giữ đơn!`);
      return;
    }

    const qty = parseInt(transferQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Số lượng điều chuyển phải lớn hơn 0!');
      return;
    }
    if (qty > maxQty) {
      setErrorMsg(`Số lượng điều chuyển (${qty}) vượt quá số lượng khả dụng tại ô nguồn (${maxQty} ${unitName})!`);
      return;
    }
    if (!targetLocationId) {
      setErrorMsg('Vui lòng chọn vị trí ô kệ đích để cất hàng!');
      return;
    }

    const targetLoc = locations.find((l) => l.id === Number(targetLocationId));
    if (targetLoc && lockedBins.includes(targetLoc.barcode)) {
      setErrorMsg(`Ô kệ đích (${targetLoc.barcode}) đang bị khóa bảo trì! Vui lòng chọn ô kệ đang hoạt động bình thường.`);
      return;
    }

    // Ràng buộc nghiệp vụ WMS an toàn:
    if (effectiveItem.isExpired) {
      const isQuarantine = targetLoc?.barcode?.includes('QUA') || (targetLoc as any)?.zoneCode?.includes('QUA') || targetLoc?.barcode?.includes('SCRAP');
      if (!isQuarantine) {
        setErrorMsg(`Lô hàng ${effectiveItem.batchNumber} đã quá hạn sử dụng (${effectiveItem.expiryDate})! Vi phạm quy tắc an toàn WMS: Hàng hết hạn chỉ được phép chuyển vào Khu Cách Ly (ZONE_QUA), không được chuyển sang ô lưu trữ thương mại.`);
        return;
      }
    }

    // Kiểm tra tương thích điều kiện bảo quản mát (Cool 2-8°C)
    const isCoolItem = (effectiveItem.name || '').toLowerCase().includes('sữa') || (effectiveItem.sku || '').toLowerCase().includes('milk') || (effectiveItem.sku || '').toLowerCase().includes('yogurt');
    if (isCoolItem && targetLoc) {
      const isTargetCool = targetLoc.barcode?.includes('ZB') || (targetLoc as any)?.zoneCode?.includes('ZONE_B');
      const isTargetQuarantine = targetLoc.barcode?.includes('QUA') || (targetLoc as any)?.zoneCode?.includes('QUA');
      if (!isTargetCool && !isTargetQuarantine) {
        setErrorMsg(`Vi phạm điều kiện bảo quản: Sản phẩm thực phẩm lạnh/mát (${effectiveItem.name}) bắt buộc lưu trữ tại Kho Mát (Zone B 2-8°C). Không được phép điều chuyển sang ${targetLoc.barcode}!`);
        return;
      }
    }

    setLoading(true);
    try {
      const reasonObj = TRANSFER_REASONS.find((r) => r.value === selectedReason);
      const reasonLabel = reasonObj ? reasonObj.label : selectedReason;
      const finalNotes = customNotes.trim() ? `${reasonLabel}: ${customNotes.trim()}` : reasonLabel;

      let fromLocId = effectiveItem.locationId;
      if (!fromLocId) {
        const found = locations.find((l) => l.barcode === effectiveItem.locationBarcode);
        fromLocId = found ? found.id : 1;
      }

      await inventoryService.transferStock({
        productId: effectiveItem.productId,
        fromLocationId: fromLocId,
        toLocationId: Number(targetLocationId),
        batchId: effectiveItem.batchId || 1,
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
              <p className="text-2xs text-slate-500">Di chuyển giữa các ô kệ trong cùng kho bãi</p>
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

          {/* Cảnh báo: Ô kệ đang bị khóa bảo trì */}
          {isSourceLocked && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-2">
              <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Ô kệ nguồn đang khóa bảo trì:</span> Vị trí <strong>{effectiveItem.locationBarcode}</strong> đang tạm dừng hoạt động kỹ thuật. Vui lòng mở khóa ô kệ trên sơ đồ trước khi thực hiện điều chuyển.
              </div>
            </div>
          )}

          {/* Cảnh báo: Tồn kho đang bị giữ cho đơn xuất (Reserved) */}
          {isFullyReserved && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Hàng đang được giữ cho đơn xuất kho (Reserved):</span>
                <p className="mt-0.5 text-slate-700">
                  Toàn bộ <strong>{onHand} {unitName}</strong> tại ô này đã được phân bổ cho đơn hàng xuất kho (Đang giữ đơn: <strong>{reserved}</strong>, Khả dụng: <strong>0</strong>). Theo chuẩn WMS, hàng đã giữ cho đơn xuất không được phép điều chuyển tự do trừ khi đơn hàng được hủy hoặc giải phóng phân bổ.
                </p>
              </div>
            </div>
          )}

          {/* Cảnh báo: Hàng hết hạn */}
          {effectiveItem.isExpired && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Lô hàng đã quá hạn sử dụng:</span> Cho phép điều chuyển toàn bộ tồn vật lý (<strong>{onHand} {unitName}</strong>) từ ô lưu trữ sang ô cách ly (ZONE_QUA) để chờ kiểm định hoặc xử lý tiêu hủy.
              </div>
            </div>
          )}

          {/* Thông tin mặt hàng nguồn */}
          {!sourceItem && availableStocks && availableStocks.length > 0 ? (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 flex items-center gap-1">
                <Package className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chọn Mặt Hàng & Ô Kệ Nguồn Cần Chuyển:</span>
              </label>
              <select
                value={effectiveItem.id}
                onChange={(e) => {
                  const selected = availableStocks.find((s) => String(s.id) === e.target.value);
                  if (selected) {
                    setInternalSourceItem(selected);
                    const curAvail = selected.isExpired ? (selected.onHandQty || 0) : (selected.availableQty != null ? selected.availableQty : selected.onHandQty || 0);
                    setTransferQty(curAvail > 0 ? '1' : '0');
                  }
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-xs font-semibold focus:outline-none focus:border-indigo-600 bg-white"
              >
                {availableStocks.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.sku}) • Lô {s.batchNumber} • Ô: {s.locationBarcode} [Khả dụng: {s.availableQty} {s.unit || 'SP'}]
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-sm">{effectiveItem.name}</span>
                <span className="font-mono text-2xs font-medium px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
                  {effectiveItem.sku}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-2xs pt-1.5 border-t border-slate-200/80">
                <div>Số Lô: <strong className="text-slate-800 font-semibold">{effectiveItem.batchNumber}</strong></div>
                <div>Hạn dùng: <strong className={effectiveItem.isExpired ? "text-rose-600 font-bold" : "text-slate-700 font-semibold"}>{effectiveItem.expiryDate} {effectiveItem.isExpired ? '(Đã hết hạn)' : ''}</strong></div>
                <div className="flex items-center gap-1.5 col-span-2 whitespace-nowrap">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500">Ô nguồn: </span>
                  <strong className="text-slate-800 font-semibold">{effectiveItem.locationBarcode}</strong>
                  <span className="text-slate-500 font-sans ml-1">
                    (Vật lý: <strong>{onHand}</strong> | Giữ đơn: <strong className={reserved > 0 ? 'text-amber-600' : ''}>{reserved}</strong> | Khả dụng: <strong className={available > 0 ? 'text-emerald-700' : 'text-rose-600'}>{available} {unitName}</strong>)
                  </span>
                </div>
              </div>
            </div>
          )}

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
              {validTargetLocations.length === 0 ? (
                <option value="" disabled>-- Không tìm thấy ô kệ đích khả dụng trong chi nhánh --</option>
              ) : (
                validTargetLocations.map((loc) => {
                  const capDesc = loc.status === 'EMPTY' ? 'Ô trống' : loc.qty ? `Đang có ${loc.qty} SP` : 'Sẵn sàng';
                  const isQuarantine = loc.barcode?.includes('QUA') || (loc as any).zoneCode?.includes('QUA');
                  const isZoneB = loc.barcode?.includes('ZB') || (loc as any).zoneCode?.includes('ZONE_B');
                  const isLocLocked = lockedBins.includes(loc.barcode);
                  const isOverloaded = loc.maxWeight != null && loc.currentWeight != null && loc.currentWeight >= loc.maxWeight;
                  const lockTag = isLocLocked ? ' [ĐANG KHÓA BẢO TRÌ]' : isOverloaded ? ' [ĐÃ ĐẦY TẢI]' : '';
                  const tag = isQuarantine ? ' ★ [KHU CÁCH LY TIÊU HỦY]' : isZoneB ? ' [Kho Mát 2°C - 8°C]' : '';
                  return (
                    <option key={loc.id} value={loc.id} disabled={isLocLocked}>
                      {loc.barcode} • {loc.zoneName || (loc as any).zoneCode} (Tầng {loc.shelf}){tag}{lockTag} [{capDesc}]
                    </option>
                  );
                })
              )}
            </select>

            {selectedTargetLoc && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-2xs flex items-center justify-between text-slate-600">
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-slate-700">Tải trọng:</span>
                  <span className="font-bold text-slate-800">{selectedTargetLoc.currentWeight || 0} / {selectedTargetLoc.maxWeight || 500} kg</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${
                    (selectedTargetLoc.currentWeight || 0) >= (selectedTargetLoc.maxWeight || 500)
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {Math.max(0, (selectedTargetLoc.maxWeight || 500) - (selectedTargetLoc.currentWeight || 0)).toFixed(1)} kg còn trống
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Tình trạng:</span>
                  <span className={`font-bold px-1.5 py-0.2 rounded border ${
                    isTargetLocked
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : (selectedTargetLoc.currentWeight || 0) >= (selectedTargetLoc.maxWeight || 500)
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : selectedTargetLoc.status === 'EMPTY'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {isTargetLocked
                      ? 'Đang Khóa Bảo Trì'
                      : (selectedTargetLoc.currentWeight || 0) >= (selectedTargetLoc.maxWeight || 500)
                      ? 'Quá Tải Sức Chứa'
                      : selectedTargetLoc.status === 'EMPTY'
                      ? 'Ô Trống Khả Dụng'
                      : 'Đang Chứa Hàng'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Số lượng điều chuyển */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800">Số Lượng Chuyển ({unitName}):</label>
              {maxQty > 0 && (
                <button
                  type="button"
                  onClick={() => setTransferQty(String(maxQty))}
                  className="text-2xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
                >
                  Chuyển Hết ({maxQty} {unitName})
                </button>
              )}
            </div>
            <input
              type="number"
              min={maxQty > 0 ? "1" : "0"}
              max={maxQty}
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
              disabled={maxQty <= 0}
              required
              className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-indigo-700 focus:outline-none focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-400"
            />
          </div>

          {/* Lý do điều chuyển (Standard Enterprise Reasons) */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800">Lý Do / Mục Đích Điều Chuyển:</label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600 bg-white"
            >
              {TRANSFER_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {selectedReason === 'OTHER' && (
              <input
                type="text"
                placeholder="Nhập ghi chú chi tiết lý do điều chuyển..."
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                className="w-full mt-1.5 p-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-indigo-600"
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
              disabled={loading || maxQty <= 0 || isSourceLocked}
              title={
                isSourceLocked
                  ? 'Ô nguồn đang khóa bảo trì'
                  : maxQty <= 0
                  ? 'Không đủ tồn khả dụng (Hàng đang giữ đơn)'
                  : 'Xác nhận tạo lệnh điều chuyển'
              }
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4" />
              )}
              <span>
                {isFullyReserved ? 'Hàng Đang Giữ Đơn (Khả Dụng: 0)' : 'Xác Nhận Điều Chuyển Ngay'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
