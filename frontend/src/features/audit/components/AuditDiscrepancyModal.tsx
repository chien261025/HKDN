import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Printer,
  ArrowRight,
  Clock,
  HelpCircle,
  FileCheck2,
  RotateCcw,
  ExternalLink,
  BookOpen,
  Lock,
} from 'lucide-react';
import { AuditSession, AuditItemDiscrepancy } from '../types';
import { auditService } from '../services/auditService';

interface AuditDiscrepancyModalProps {
  session: AuditSession | null;
  onClose: () => void;
  onApproveAdjustment: (sessionId: string) => void;
  onRefreshSession?: () => void;
}

export const AuditDiscrepancyModal: React.FC<AuditDiscrepancyModalProps> = ({
  session,
  onClose,
  onApproveAdjustment,
  onRefreshSession,
}) => {
  if (!session) return null;

  // Lắng nghe phím ESC để đóng modal thuận tiện
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Kích hoạt chế độ in chứng từ cách ly: chỉ in duy nhất biên bản này, ẩn toàn bộ trang nền
  useEffect(() => {
    document.body.classList.add('has-printable-voucher');
    return () => {
      document.body.classList.remove('has-printable-voucher');
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'ALL' | 'DISCREPANCY' | 'MATCHED' | 'UNCOUNTED'>('ALL');
  const [recountingItemId, setRecountingItemId] = useState<number | null>(null);
  const [recountQty, setRecountQty] = useState<number>(0);
  const [recountNotes, setRecountNotes] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);
  const [recountBusy, setRecountBusy] = useState(false);
  const [recountError, setRecountError] = useState('');
  const [approvalError, setApprovalError] = useState<string | null>(null);

  const isReconciled = session.status === 'RECONCILED';
  const isAllCounted =
    session.items &&
    session.items.length > 0 &&
    session.items.every((i) => i.countedQty !== null && i.countedQty !== undefined);
  const canApprove = (session.status === 'PENDING_REVIEW' || isAllCounted) && isAllCounted && !isReconciled;
  const progressPercent = Math.round((session.countedBins / (session.totalBins || 1)) * 100);

  // Phân loại danh sách
  const discrepancies = useMemo(
    () =>
      session.items.filter(
        (i) => i.countedQty !== null && i.differenceQty !== null && i.differenceQty !== 0
      ),
    [session.items]
  );

  const matched = useMemo(
    () =>
      session.items.filter(
        (i) => i.countedQty !== null && i.differenceQty === 0
      ),
    [session.items]
  );

  const uncounted = useMemo(
    () => session.items.filter((i) => i.countedQty === null),
    [session.items]
  );

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'DISCREPANCY':
        return discrepancies;
      case 'MATCHED':
        return matched;
      case 'UNCOUNTED':
        return uncounted;
      default:
        return session.items;
    }
  }, [activeTab, session.items, discrepancies, matched, uncounted]);

  const handleApprove = async () => {
    if (!canApprove) return;
    setIsApproving(true);
    setApprovalError(null);
    try {
      await onApproveAdjustment(session.id);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Không thể phê duyệt cân đối đợt kiểm kê.';
      setApprovalError(msg);
    } finally {
      setIsApproving(false);
    }
  };

  const handleOpenRecount = (item: AuditItemDiscrepancy) => {
    if (!item.itemId) return;
    setRecountingItemId(item.itemId);
    setRecountQty(item.countedQty ?? item.systemQty ?? 0);
    setRecountNotes(item.notes || 'Xác minh lại số lượng lệch vòng 2');
    setRecountError('');
  };

  const handleSaveRecount = async () => {
    if (!recountingItemId) return;
    setRecountBusy(true);
    setRecountError('');

    try {
      await auditService.recountItem(session.id, recountingItemId, recountQty, recountNotes);
      setRecountingItemId(null);
      if (onRefreshSession) onRefreshSession();
    } catch (err: any) {
      setRecountError(err.response?.data?.message || 'Không thể lưu kết quả đếm lại.');
    } finally {
      setRecountBusy(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="printable-voucher-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:block">
      <div className="printable-voucher bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        
        {/* Enterprise Official Print Header (Chỉ hiển thị khi in ra giấy / PDF) */}
        <div className="hidden print:block mb-2 pb-1.5 border-b-2 border-slate-900">
          <div className="flex justify-between items-start text-xs leading-tight">
            <div>
              <p className="font-extrabold text-xs uppercase tracking-wide text-slate-900">
                TỔNG KHO VẬN SMART LOGISTICS VIỆT NAM
              </p>
              <p className="text-slate-600 text-[10px]">Kho Tổng Tân Bình - Lô A4, KCN Tân Bình, Tây Thạnh, Tân Phú, TP.HCM</p>
              <p className="text-slate-600 text-[10px]">Hotline: 1900-8899 • Ban Kiểm Kê & Quản trị Tồn Kho WMS</p>
            </div>
            <div className="text-right font-mono">
              <p className="font-extrabold text-slate-900 text-xs">MẪU SỐ: 05-VT/WMS</p>
              <p className="text-slate-500 text-[9px]">(Ban hành theo TT 200/2014/TT-BTC)</p>
              <p className="text-indigo-800 font-bold text-[11px]">Mã Đợt: {session.auditCode}</p>
            </div>
          </div>
          <div className="text-center mt-1.5">
            <h1 className="text-base font-black uppercase tracking-tight text-slate-900">
              BIÊN BẢN KIỂM KÊ & CÂN ĐỐI SỔ CÁI TỒN KHO
            </h1>
            <p className="text-[10px] text-slate-600 italic">
              (Đợt kiểm kê: {session.title} • Phạm vi: {session.scope})
            </p>
          </div>
        </div>

        {/* Header trên màn hình máy tính */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900">
                  Đối Soát Kiểm Kê & Cân Đối Sổ Cái: {session.auditCode}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                    session.status === 'RECONCILED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : session.status === 'PENDING_REVIEW' || isAllCounted
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}
                >
                  {session.status === 'RECONCILED'
                    ? 'ĐÃ CÂN ĐỐI'
                    : session.status === 'PENDING_REVIEW' || isAllCounted
                    ? 'CHỜ DUYỆT ĐỐI SOÁT'
                    : 'ĐANG KIỂM ĐẾM'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {session.title} • Phạm vi: <strong className="text-slate-700">{session.scope}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors print:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-scroll p-4 md:p-6 space-y-4 overflow-y-auto text-sm print:max-h-none print:overflow-visible print:p-0">
          {/* Summary Banner */}
          <div className="p-3.5 sm:p-4 print:p-2 print:mb-2 rounded-xl bg-slate-50 print:bg-white border border-slate-200 print:border-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm print:text-xs">
            <div className="space-y-1 print:space-y-0.5">
              <div className="font-semibold text-slate-900 flex items-center gap-2 text-xs sm:text-sm print:text-xs">
                <span>Thủ kho phụ trách kiểm đếm:</span>
                <strong className="text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 print:bg-transparent print:border-none print:px-0">
                  {session.assignedOperator}
                </strong>
              </div>
              {session.reconciledBy ? (
                <div className="text-xs text-slate-600 flex items-center gap-2 print:text-[11px]">
                  <span>Người phê duyệt cân đối:</span>
                  <strong className="text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 print:bg-transparent print:border-none print:px-0">
                    {session.reconciledBy}
                  </strong>
                </div>
              ) : (
                <div className="text-2xs text-amber-700 flex items-center gap-1 print:hidden">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Yêu cầu quản lý phê duyệt đối soát độc lập</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs print:text-[10px]">
              <span className="px-3 py-1.5 print:px-2 print:py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
                Tiến độ: <strong className="text-slate-900">{session.countedBins}/{session.totalBins} ô ({progressPercent}%)</strong>
              </span>
              <span
                className={`px-3 py-1.5 print:px-2 print:py-0.5 rounded-lg border font-semibold ${
                  session.discrepanciesCount > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                Sai lệch: <strong>{session.discrepanciesCount} ô</strong>
              </span>

              {session.adjustmentCode && (
                <span className="px-3 py-1.5 print:px-2 print:py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5 print:hidden" />
                  <span>Phiếu: {session.adjustmentCode}</span>
                </span>
              )}
            </div>
          </div>

          {/* Cảnh báo P0 nếu chưa đếm xong */}
          {!isAllCounted && !isReconciled && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 print:hidden">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đợt kiểm kê chưa hoàn tất kiểm đếm:</span> Mới ghi nhận kết quả tại{' '}
                <strong>{session.countedBins}/{session.totalBins} vị trí</strong>. Chức năng duyệt cân đối bị khóa để đảm bảo an toàn.
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 print:hidden">
            {[
              { id: 'ALL', label: `Tất cả (${session.items.length})` },
              { id: 'DISCREPANCY', label: `Có sai lệch (${discrepancies.length})`, count: discrepancies.length, alert: true },
              { id: 'MATCHED', label: `Khớp 100% (${matched.length})` },
              { id: 'UNCOUNTED', label: `Chưa đếm (${uncounted.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Recount sub-modal inline if active */}
          {recountingItemId && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 animate-in fade-in print:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-blue-900 uppercase">
                    Xác Minh Đếm Lại Lần 2
                  </span>
                </div>
                <button
                  onClick={() => setRecountingItemId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {recountError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                  {recountError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="w-40">
                  <label className="text-2xs font-bold text-slate-600">Số lượng đếm lại:</label>
                  <input
                    type="number"
                    min={0}
                    value={recountQty}
                    onChange={(e) => setRecountQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-1.5 text-center font-mono font-bold text-base bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-2xs font-bold text-slate-600">Ghi chú xác minh giải trình:</label>
                  <input
                    type="text"
                    value={recountNotes}
                    onChange={(e) => setRecountNotes(e.target.value)}
                    placeholder="VD: Đã kiểm đếm lại trực tiếp cùng Trưởng kho, phát hiện bao bì rách..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div className="pt-3.5">
                  <button
                    onClick={handleSaveRecount}
                    disabled={recountBusy}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    {recountBusy ? 'Đang lưu...' : 'Lưu Kết Quả Vòng 2'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bảng so khớp đối soát */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wider">
                Chi Tiết Từng Dòng Ô Kệ & Đối Soát Bút Toán:
              </span>
              <span className="text-2xs text-slate-500 font-mono">
                Điều chỉnh = Thực tế đếm - Tồn sổ sách • Tồn sau cân đối = Thực tế đếm
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 print:border-slate-400 overflow-x-auto bg-white shadow-xs">
              <table className="w-full text-left text-xs font-mono min-w-[700px] sm:min-w-0 print:min-w-0">
                <thead className="bg-slate-100 print:bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 print:border-slate-400 print:text-[9.5px]">
                  <tr>
                    <th className="py-2.5 px-3 print:py-1 print:px-1.5 print:border-r print:border-slate-300">Vị Trí Ô Kệ</th>
                    <th className="py-2.5 px-3 print:py-1 print:px-1.5 print:border-r print:border-slate-300">Mặt Hàng & Lô</th>
                    <th className="py-2.5 px-3 text-center print:py-1 print:px-1.5 print:border-r print:border-slate-300">Tồn Sổ Sách</th>
                    <th className="py-2.5 px-3 text-center print:py-1 print:px-1.5 print:border-r print:border-slate-300">Thực Tế Đếm</th>
                    <th className="py-2.5 px-3 text-center print:py-1 print:px-1.5 print:border-r print:border-slate-300">Chênh Lệch</th>
                    <th className="py-2.5 px-3 text-center print:py-1 print:px-1.5 print:border-r print:border-slate-300">Điều Chỉnh</th>
                    <th className="py-2.5 px-3 text-center print:py-1 print:px-1.5 print:border-r print:border-slate-300">Tồn Sau Cân Đối</th>
                    <th className="py-2.5 px-3 text-center print:hidden">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-slate-300 text-slate-700 print:text-[9.5px]">
                  {filteredItems.map((item) => {
                    const isUncounted = item.countedQty === null || item.countedQty === undefined;
                    const isMatched = !isUncounted && item.differenceQty === 0;
                    const isShortage = !isUncounted && item.differenceQty !== null && item.differenceQty < 0;
                    const isSurplus = !isUncounted && item.differenceQty !== null && item.differenceQty > 0;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isUncounted ? 'bg-slate-50/40 opacity-80' : ''
                        }`}
                      >
                        {/* Vị trí */}
                        <td className="py-2.5 px-3 print:py-1 print:px-1.5 whitespace-nowrap print:border-r print:border-slate-300">
                          <span className="flex items-center gap-1.5 text-indigo-700 font-bold print:text-[10px]">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0 print:hidden" />
                            {item.locationBarcode}
                          </span>
                          {item.zoneCode && (
                            <div className="text-2xs text-slate-500 font-sans mt-0.5 print:text-[8.5px]">
                              Khu {item.zoneCode}
                            </div>
                          )}
                        </td>

                        {/* Sản phẩm & Lô */}
                        <td className="py-2.5 px-3 print:py-1 print:px-1.5 print:border-r print:border-slate-300">
                          <div className="font-sans font-bold text-slate-900 text-xs print:text-[10px] print:leading-tight">
                            {item.productName}
                          </div>
                          <div className="text-2xs text-slate-500 print:text-[9px]">
                            {item.sku} • Lô: <strong className="text-amber-700 print:text-slate-800">{item.batchNumber}</strong>
                          </div>
                          {item.notes && (
                            <div className="text-3xs text-blue-800 bg-blue-50/90 px-1.5 py-0.5 rounded border border-blue-200 mt-1 font-sans font-medium" title={item.notes}>
                              💬 {item.notes}
                            </div>
                          )}
                        </td>

                        {/* Tồn Sổ Sách Lúc Kiểm */}
                        <td className="py-2.5 px-3 print:py-1 print:px-1.5 text-center font-bold text-slate-800 tabular-nums print:border-r print:border-slate-300">
                          {item.systemQty !== null ? (
                            <span>{item.systemQty} {item.unit}</span>
                          ) : (
                            <span className="text-slate-400 italic">Đếm mù</span>
                          )}
                        </td>

                        {/* Thực tế đếm */}
                        <td className="py-2.5 px-3 print:py-1 print:px-1.5 text-center tabular-nums print:border-r print:border-slate-300">
                          {isUncounted ? (
                            <span className="text-slate-400 font-sans italic text-2xs font-medium">Chưa đếm</span>
                          ) : (
                            <div>
                              <span className="font-bold text-indigo-700 print:text-slate-900">{item.countedQty} {item.unit}</span>
                              {item.secondCountQty !== null && item.secondCountQty !== undefined && (
                                <div className="text-3xs text-emerald-600 font-sans font-bold print:hidden">
                                  Vòng 2: {item.secondCountQty} (Đã xác minh)
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Chênh lệch */}
                        <td className="py-2.5 px-3 print:py-1 print:px-1.5 text-center whitespace-nowrap print:border-r print:border-slate-300">
                          {isUncounted ? (
                            <span className="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded text-2xs border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" /> Chưa Đếm
                            </span>
                          ) : isMatched ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-2xs print:border-none print:bg-transparent print:p-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 print:hidden" /> 0 (Khớp)
                            </span>
                          ) : isShortage ? (
                            <span
                              className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-2xs print:border-none print:bg-transparent print:p-0"
                              title="Phát hiện thiếu hàng so với hệ thống"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 print:hidden" /> {item.differenceQty} {item.unit}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-2xs print:border-none print:bg-transparent print:p-0"
                              title="Phát hiện dôi thừa so với hệ thống"
                            >
                              +{item.differenceQty} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Điều chỉnh Ledger */}
                        <td className="py-2.5 px-3 print:py-1 print:px-1.5 text-center font-bold tabular-nums print:border-r print:border-slate-300">
                          {isUncounted ? (
                            <span className="text-slate-400">-</span>
                          ) : item.adjustmentQty && item.adjustmentQty !== 0 ? (
                            <span
                              className={`print:border-none print:bg-transparent print:p-0 ${
                                item.adjustmentQty > 0
                                  ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'
                                  : 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                              }`}
                            >
                              {item.adjustmentQty > 0 ? `+${item.adjustmentQty}` : item.adjustmentQty} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0 (Không đổi)</span>
                          )}
                        </td>

                        {/* Tồn sau cân đối */}
                        <td className="py-2.5 px-3 print:py-1 print:px-1.5 text-center font-bold text-slate-900 tabular-nums print:border-r print:border-slate-300">
                          {isUncounted ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            <span className="bg-slate-100 print:bg-transparent px-2 py-0.5 print:p-0 rounded font-bold text-slate-800">
                              {item.balanceAfter} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Thao tác đếm lại */}
                        <td className="py-2.5 px-3 text-center print:hidden">
                          {!isReconciled && !isUncounted && !isMatched ? (
                            <button
                              onClick={() => handleOpenRecount(item)}
                              className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-2xs font-bold border border-blue-200 flex items-center gap-1 mx-auto cursor-pointer"
                              title="Đếm lại vòng 2 để xác minh trước khi duyệt"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Đếm Lại</span>
                            </button>
                          ) : (
                            <span className="text-2xs text-slate-400 font-sans">
                              {isReconciled ? 'Đã ghi sổ' : isMatched ? 'Đã khớp' : 'Chờ đếm'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chữ Ký 3 Bên Hợp Chuẩn Kiểm Kê (Chỉ in trên giấy / PDF, ẩn trên màn hình) */}
          <div className="hidden print:block pt-3 border-t-2 border-slate-900 print:pt-2 print:mt-2">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wide">Người Kiểm Đếm (Thủ Kho)</span>
                <span className="text-[9px] text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="text-[11px] font-bold text-slate-900 border-t border-dashed border-slate-400 pt-1 w-32 sm:w-36">
                    {session.assignedOperator || 'Thủ Kho Vận Hành'}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wide">Kiểm Soát Viên (KCS / Kế Toán)</span>
                <span className="text-[9px] text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="text-[11px] font-bold text-slate-900 border-t border-dashed border-slate-400 pt-1 w-32 sm:w-36">
                    Ban Kiểm Kê WMS
                  </span>
                </div>
              </div>

              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-slate-900 block uppercase tracking-wide">Trưởng Kho / Phê Duyệt</span>
                <span className="text-[9px] text-slate-500 block italic">(Ký, đóng dấu, ghi rõ họ tên)</span>
                <div className="h-12 print:h-12 flex items-end justify-center">
                  <span className="text-[11px] font-bold text-slate-900 border-t border-dashed border-slate-400 pt-1 w-32 sm:w-36">
                    {session.reconciledBy || 'Quản Lý Kho WMS'}
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden print:block text-center mt-2 pt-1 border-t border-slate-200 text-[8.5px] text-slate-500 italic">
              Biên bản kiểm kê điện tử trích xuất từ Hệ thống Quản trị Kho SMART WMS • Thời gian in: {new Date().toLocaleString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In Biên Bản Kiểm Kê</span>
          </button>

          <div className="flex items-center gap-3">
            {!isReconciled ? (
              canApprove ? (
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  title="Phê duyệt độc lập và tự động ghi sổ cái"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isApproving ? 'Đang Ghi Sổ Cái...' : 'Duyệt Cân Đối Kho & Ghi Sổ Cái'}</span>
                </button>
              ) : (
                <button
                  disabled
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 border border-slate-300 text-slate-400 font-bold rounded-xl text-xs sm:text-sm cursor-not-allowed shadow-none"
                  title={`Đợt kiểm kê chưa hoàn tất kiểm đếm (${session.countedBins}/${session.totalBins} ô). Chức năng phê duyệt cân đối bị khóa để bảo đảm an toàn dữ liệu.`}
                >
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Khóa Duyệt (Chưa Hoàn Tất Đếm)</span>
                </button>
              )
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã ghi nhận bút toán điều chỉnh vào Sổ Cái Kho Hàng</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs sm:text-sm border border-slate-300 transition-colors shadow-xs cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Custom Security & Business Validation Alert Dialog thay cho browser alert() */}
      {approvalError && (
        <div className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95">
            {approvalError.includes('Phân tách nhiệm vụ') || approvalError.includes('Separation of Duties') ? (
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200 shadow-xs">
                <ShieldAlert className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
                <AlertTriangle className="w-7 h-7" />
              </div>
            )}
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {approvalError.includes('Phân tách nhiệm vụ') || approvalError.includes('Separation of Duties')
                  ? 'Quy Tắc Phân Tách Nhiệm Vụ (SoD)'
                  : approvalError.includes('giữ chỗ') || approvalError.includes('thấp hơn số đang giữ')
                  ? 'Xung Đột Tồn Kho & Giữ Chỗ Đơn Hàng'
                  : 'Cảnh Báo Cân Đối Kho Hàng'}
              </h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-medium">
                {approvalError}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setApprovalError(null)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Đã Hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
