import React, { useState, useEffect } from 'react';
import { ClipboardCheck, CheckCircle2, ScanLine, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { operatorService, LocationDto, ProductDto, AuditSessionDto } from '../../services/operatorService';
import { soundEffects } from '../../utils/soundEffects';

interface BlindCountTabProps {
  onOpenScanner: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
}

export const BlindCountTab: React.FC<BlindCountTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
}) => {
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [auditSessions, setAuditSessions] = useState<AuditSessionDto[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);

  const [locationBarcode, setLocationBarcode] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
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

      if (locs.length > 0 && !locationBarcode) {
        setLocationBarcode(locs[0].binBarcode);
      }
      if (prods.length > 0 && !selectedProductId) {
        setSelectedProductId(prods[0].id);
      }
      const openAudit = audits.find((a) => a.status === 'IN_PROGRESS' || a.status === 'DRAFT');
      if (openAudit) {
        setSelectedAuditId(openAudit.id);
      } else if (audits.length > 0) {
        setSelectedAuditId(audits[0].id);
      }
    } catch (err: any) {
      console.warn('Lỗi tải dữ liệu kiểm kê:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Xử lý mã quét từ camera / súng quét PDA
  useEffect(() => {
    if (scannedCode) {
      const matchedLoc = locations.find(
        (l) => l.binBarcode.toLowerCase() === scannedCode.toLowerCase()
      );
      if (matchedLoc) {
        soundEffects.playSuccessBeep();
        setLocationBarcode(matchedLoc.binBarcode);
        setNotice({ msg: `[PDA] Đã nhận diện ô kệ: ${matchedLoc.binBarcode}`, type: 'success' });
      } else {
        const matchedProd = products.find((p) => p.barcode === scannedCode || p.sku === scannedCode);
        if (matchedProd) {
          soundEffects.playSuccessBeep();
          setSelectedProductId(matchedProd.id);
          setNotice({ msg: `[PDA] Đã nhận diện sản phẩm: ${matchedProd.name}`, type: 'success' });
        } else {
          soundEffects.playErrorBuzz();
          setNotice({ msg: `[PDA] Không tìm thấy ô kệ/sản phẩm: ${scannedCode}`, type: 'error' });
        }
      }
      onClearScannedCode?.();
    }
  }, [scannedCode, locations, products, onClearScannedCode]);

  const handleSubmitCount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countedQty || isNaN(parseInt(countedQty))) {
      soundEffects.playErrorBuzz();
      setNotice({ msg: 'Vui lòng nhập số lượng kiểm đếm hợp lệ!', type: 'error' });
      return;
    }
    const matchedLoc = locations.find((l) => l.binBarcode === locationBarcode);
    if (!matchedLoc) {
      soundEffects.playErrorBuzz();
      setNotice({ msg: 'Ô kệ không hợp lệ trong hệ thống!', type: 'error' });
      return;
    }

    setSubmitting(true);
    setNotice(null);
    try {
      const qty = parseInt(countedQty);

      if (selectedAuditId) {
        await operatorService.recordAuditCount(
          selectedAuditId,
          matchedLoc.id,
          selectedProductId || 1,
          qty,
          notes
        );
      } else {
        await operatorService.submitBlindCount(locationBarcode, qty, notes);
      }

      soundEffects.playCompleteChime();
      setNotice({
        msg: `Thành công: Đã ghi nhận đếm ${qty} cái tại ô ${locationBarcode} vào đợt kiểm kê!`,
        type: 'success',
      });
      setCountedQty('');
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setNotice({ msg: 'Lỗi ghi nhận kiểm đếm: ' + (err.response?.data?.message || err.message), type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setNotice(null), 5000);
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
              5. Kiểm Đếm Thực Tế (Audit)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Quét ô kệ & nhập số lượng thực tế</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2 text-slate-400 hover:text-slate-700 rounded-xl">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            notice.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Audit Session Select */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
        <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Đợt Kiểm Kê Liên Kết:</span>
        <select
          value={selectedAuditId || ''}
          onChange={(e) => setSelectedAuditId(Number(e.target.value))}
          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold"
        >
          {auditSessions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.auditCode} ({a.status})
            </option>
          ))}
        </select>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmitCount} className="space-y-3">
        {/* Step 1: Location */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Ô Kệ Cần Kiểm Kê:</span>
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              <ScanLine className="w-3.5 h-3.5" /> Quét ô kệ
            </button>
          </div>
          <select
            value={locationBarcode}
            onChange={(e) => setLocationBarcode(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.binBarcode}>
                {loc.binBarcode} ({loc.zoneCode})
              </option>
            ))}
          </select>
        </div>

        {/* Step 2: Product */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Sản Phẩm Đang Đếm:</span>
          <select
            value={selectedProductId || ''}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        {/* Step 3: Count Quantity */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-2xs font-extrabold uppercase text-slate-500 tracking-wider">Số Lượng Thực Tế Đếm Được:</span>
          <input
            type="number"
            value={countedQty}
            onChange={(e) => setCountedQty(e.target.value)}
            placeholder="Nhập số lượng đếm được..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold font-mono text-center focus:border-emerald-600"
            min="0"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !countedQty}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold text-sm shadow-md shadow-emerald-200 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>{submitting ? 'Đang Ghi Nhận...' : 'Lưu Kết Quả Kiểm Đếm'}</span>
        </button>
      </form>
    </div>
  );
};
