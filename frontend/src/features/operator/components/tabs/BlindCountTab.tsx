import React, { useState, useEffect, useMemo } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  ScanLine,
  AlertCircle,
  RefreshCw,
  MapPin,
  Package,
  Layers,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  operatorService,
  LocationDto,
  ProductDto,
  AuditSessionDto,
  AuditItemDto,
} from '../../services/operatorService';
import { soundEffects } from '../../utils/soundEffects';

interface BlindCountTabProps {
  onOpenScanner: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
  isCompact?: boolean;
}

export const BlindCountTab: React.FC<BlindCountTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
  isCompact,
}) => {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [auditSessions, setAuditSessions] = useState<AuditSessionDto[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  const [countedQty, setCountedQty] = useState('');
  const [notes, setNotes] = useState('Đếm thực tế kiểm kê nhanh qua PDA');
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    try {
      const [locs, prods, audits] = await Promise.all([
        operatorService.getLocations(),
        operatorService.getProducts(),
        operatorService.getAuditSessions(),
      ]);
      setLocations(locs);
      setProducts(prods);
      setAuditSessions(audits);

      // Ưu tiên chọn đợt kiểm kê đang IN_PROGRESS
      const inProgressAudit = audits.find((a) => a.status === 'IN_PROGRESS');
      const targetAudit = inProgressAudit || (audits.length > 0 ? audits[0] : null);

      if (targetAudit) {
        setSelectedAuditId(targetAudit.id);
        const pendingItem = targetAudit.items?.find(
          (it) => it.status === 'PENDING' || it.countedQty == null
        );
        if (pendingItem) {
          setSelectedItemId(pendingItem.id);
        } else if (targetAudit.items && targetAudit.items.length > 0) {
          setSelectedItemId(targetAudit.items[0].id);
        }
      }
    } catch (err: any) {
      console.warn('Lỗi tải dữ liệu kiểm kê:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const currentAudit = useMemo(() => {
    return auditSessions.find((a) => a.id === selectedAuditId) || null;
  }, [auditSessions, selectedAuditId]);

  const auditItems: AuditItemDto[] = useMemo(() => {
    return currentAudit?.items || [];
  }, [currentAudit]);

  const activeItem = useMemo(() => {
    if (!selectedItemId) {
      return auditItems.length > 0 ? auditItems[0] : null;
    }
    return auditItems.find((it) => it.id === selectedItemId) || null;
  }, [auditItems, selectedItemId]);

  // Đếm thống kê tiến độ
  const totalItemsCount = auditItems.length;
  const countedItemsCount = auditItems.filter(
    (it) => it.countedQty != null || it.status !== 'PENDING'
  ).length;
  const progressPercent =
    totalItemsCount > 0 ? Math.round((countedItemsCount / totalItemsCount) * 100) : 0;

  // Xử lý mã quét từ camera / súng quét PDA
  useEffect(() => {
    if (!scannedCode) return;

    const codeUpper = scannedCode.trim().toUpperCase();

    // 1. Kiểm tra xem có trùng mã ô kệ hoặc SKU trong danh sách nhiệm vụ kiểm kê không
    const matchedItem = auditItems.find(
      (it) =>
        it.locationBarcode.toUpperCase() === codeUpper ||
        it.sku.toUpperCase() === codeUpper ||
        (it.barcode && it.barcode.toUpperCase() === codeUpper)
    );

    if (matchedItem) {
      soundEffects.playSuccessBeep();
      setSelectedItemId(matchedItem.id);
      setNotice({
        msg: `[PDA] Đã nhận diện ô ${matchedItem.locationBarcode} - ${matchedItem.productName}`,
        type: 'success',
      });
    } else {
      soundEffects.playErrorBuzz();
      setNotice({
        msg: `[PDA] Mã "${scannedCode}" không thuộc đợt kiểm kê hiện tại!`,
        type: 'error',
      });
    }

    onClearScannedCode?.();
  }, [scannedCode, auditItems, onClearScannedCode]);

  const handleQuickQtyAdjust = (delta: number) => {
    const cur = parseInt(countedQty || '0', 10);
    const next = Math.max(0, (isNaN(cur) ? 0 : cur) + delta);
    setCountedQty(String(next));
  };

  const handleSubmitCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditId || !activeItem) {
      soundEffects.playErrorBuzz();
      setNotice({ msg: 'Chưa có vị trí ô kệ nào được chọn để kiểm đếm!', type: 'error' });
      return;
    }

    if (!countedQty || isNaN(parseInt(countedQty, 10)) || parseInt(countedQty, 10) < 0) {
      soundEffects.playErrorBuzz();
      setNotice({ msg: 'Vui lòng nhập số lượng kiểm đếm thực tế hợp lệ (>= 0)!', type: 'error' });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const qty = parseInt(countedQty, 10);

      await operatorService.recordAuditCount(
        selectedAuditId,
        activeItem.locationId,
        activeItem.productId,
        qty,
        notes,
        activeItem.id
      );

      soundEffects.playCompleteChime();
      setNotice({
        msg: `Thành công: Đã ghi nhận ${qty} ${activeItem.unit} tại ô ${activeItem.locationBarcode}!`,
        type: 'success',
      });
      setCountedQty('');

      // Tải lại dữ liệu đợt kiểm kê để cập nhật trạng thái
      const refreshedAudits = await operatorService.getAuditSessions();
      setAuditSessions(refreshedAudits);

      // Tự động chuyển sang ô tiếp theo chưa kiểm
      const refreshedCurrent = refreshedAudits.find((a) => a.id === selectedAuditId);
      const nextPending = refreshedCurrent?.items?.find(
        (it) => it.id !== activeItem.id && (it.status === 'PENDING' || it.countedQty == null)
      );
      if (nextPending) {
        setSelectedItemId(nextPending.id);
      }
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setNotice({
        msg: 'Lỗi ghi nhận kiểm đếm: ' + (err.response?.data?.message || err.message),
        type: 'error',
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotice(null), 6000);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Kiểm Đếm Thực Tế
            </h2>
          </div>
        </div>
        <button
          onClick={loadData}
          title="Tải lại danh sách"
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Layout 2 Cột Chuẩn Trạm Vận Hành & PDA */}
      <div className={`grid grid-cols-1 ${isCompact ? '' : 'lg:grid-cols-2'} gap-4 items-start`}>
        {/* Cột Trái: Đợt Kiểm Kê & Danh Sách Ô Kệ */}
        <div className="space-y-4">
          {/* Đợt Kiểm Kê & Tiến Độ Hoàn Thành */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">
                Đợt Kiểm Kê Được Giao
              </span>
              {currentAudit && (
                <span
                  className={`text-2xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    currentAudit.status === 'COMPLETED' || currentAudit.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {currentAudit.status}
                </span>
              )}
            </div>

            <select
              value={selectedAuditId || ''}
              onChange={(e) => {
                const newAuditId = Number(e.target.value);
                setSelectedAuditId(newAuditId);
                const found = auditSessions.find((a) => a.id === newAuditId);
                if (found && found.items && found.items.length > 0) {
                  const pending = found.items.find(
                    (it) => it.status === 'PENDING' || it.countedQty == null
                  );
                  setSelectedItemId(pending ? pending.id : found.items[0].id);
                } else {
                  setSelectedItemId(null);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {auditSessions.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.auditCode} ({a.status}) — {a.notes || 'Kiểm kê định kỳ'}
                </option>
              ))}
            </select>

            {/* Progress bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-2xs font-bold text-slate-600">
                <span>Tiến độ đếm: {countedItemsCount}/{totalItemsCount} vị trí</span>
                <span className="text-indigo-600 font-extrabold">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Bảng Danh Sách Ô Kệ Phân Công (Worklist) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Danh Sách Ô Kệ Phân Công ({totalItemsCount})
                </h3>
              </div>
              <span className="text-2xs text-slate-400 font-medium">Bấm vào ô để đếm</span>
            </div>

            {auditItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Đợt kiểm kê này chưa có danh mục ô kệ nào được phân công.
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {auditItems.map((item, idx) => {
                  const isSelected = activeItem?.id === item.id;
                  const isCounted = item.countedQty != null || item.status !== 'PENDING';

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedItemId(item.id);
                        setCountedQty(item.countedQty != null ? String(item.countedQty) : '');
                        setTimeout(() => {
                          const el = document.getElementById('blind-count-active-form');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }, 60);
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-200'
                          : isCounted
                          ? 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg text-2xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                            isCounted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-extrabold text-slate-900">
                              {item.locationBarcode}
                            </span>
                            {item.zoneCode && (
                              <span className="text-2xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded font-semibold">
                                {item.zoneCode}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 font-semibold truncate">
                            {item.productName}
                          </p>
                          <p className="text-2xs text-slate-400 font-mono">
                            SKU: {item.sku} • ĐVT: {item.unit}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {isCounted ? (
                          <div>
                            <span className="inline-flex items-center gap-1 text-2xs px-2.5 py-0.5 rounded-full font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" />
                              {item.countedQty === 0 ? `Đếm = 0 ${item.unit}` : `${item.countedQty} ${item.unit}`}
                            </span>
                            <p className="text-3xs text-slate-400 font-medium mt-0.5">
                              Đã lưu kết quả đếm
                            </p>
                          </div>
                        ) : (
                          <span className="text-2xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Chờ kiểm đếm
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cột Phải: Form Kiểm Đếm Cho Vị Trí Đang Chọn (Sticky trên Desktop) */}
        <div className="space-y-4 lg:sticky lg:top-4">
          {activeItem ? (
            <form id="blind-count-active-form" onSubmit={handleSubmitCount} className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-2xs font-extrabold uppercase text-indigo-600 tracking-wider flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Vị Trí Đang Kiểm Đếm
                  </span>
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 cursor-pointer"
                  >
                    <ScanLine className="w-3.5 h-3.5" /> Quét mã vạch
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xs text-slate-400 font-bold uppercase">Mã Ô Kệ (Bin)</span>
                      <p className="text-sm font-mono font-extrabold text-slate-900">
                        {activeItem.locationBarcode}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xs text-slate-400 font-bold uppercase">Khu Vực</span>
                      <p className="text-xs font-bold text-slate-700">
                        {activeItem.zoneCode || 'ZONE_A'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                    <Package className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">
                        {activeItem.productName}
                      </p>
                      <p className="text-2xs text-slate-500 font-mono">
                        Mã SKU: {activeItem.sku} | Quy cách: {activeItem.unit}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input Số Lượng Đếm Được */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-2xs font-extrabold uppercase text-slate-600 tracking-wider block">
                    Số Lượng Thực Tế Đếm Được ({activeItem.unit}):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={countedQty}
                      onChange={(e) => setCountedQty(e.target.value)}
                      placeholder="Nhập số lượng đếm được..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold font-mono text-center text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                      min="0"
                      autoFocus
                    />
                  </div>

                  {/* Phím bấm nhanh điều chỉnh số lượng */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickQtyAdjust(-5)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQtyAdjust(-1)}
                      className="py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQtyAdjust(+1)}
                      className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQtyAdjust(+5)}
                      className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      +5
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQtyAdjust(+10)}
                      className="py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      +10
                    </button>
                  </div>
                </div>

                {/* Ghi chú */}
                <div className="space-y-1">
                  <label className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider block">
                    Ghi Chú Kiểm Đếm (Tùy Chọn):
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="VD: Hộp nguyên seal, không móp méo..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-400"
                  />
                </div>

                {/* Nút Submit */}
                <button
                  type="submit"
                  disabled={submitting || countedQty === ''}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold text-sm shadow-md shadow-emerald-200 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Đang Ghi Nhận Kiểm Đếm...'
                      : activeItem.countedQty != null
                      ? 'Cập Nhật Lại Số Lượng Đếm'
                      : 'Xác Nhận & Lưu Kết Quả'}
                  </span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                Đã hoàn thành toàn bộ nhiệm vụ kiểm đếm!
              </h4>
              <p className="text-xs text-slate-500">
                Tất cả vị trí trong đợt kiểm kê đã được ghi nhận. Số liệu đã được đồng bộ lên máy chủ để
                Trưởng kho xem xét và phê duyệt.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
