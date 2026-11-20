import React, { useState, useMemo } from 'react';
import {
  X,
  Scale,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ShieldCheck,
  Printer,
  ArrowRight,
  Clock,
  HelpCircle,
  FileCheck2,
  RotateCcw,
  ExternalLink,
  BookOpen,
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

  const [activeTab, setActiveTab] = useState<'ALL' | 'DISCREPANCY' | 'MATCHED' | 'UNCOUNTED'>('ALL');
  const [recountingItemId, setRecountingItemId] = useState<number | null>(null);
  const [recountQty, setRecountQty] = useState<number>(0);
  const [recountNotes, setRecountNotes] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);
  const [recountBusy, setRecountBusy] = useState(false);
  const [recountError, setRecountError] = useState('');

  const isReconciled = session.status === 'RECONCILED';
  const isAllCounted =
    session.items &&
    session.items.length > 0 &&
    session.items.every((i) => i.countedQty !== null && i.countedQty !== undefined);
  const canApprove = (session.status === 'PENDING_REVIEW' || isAllCounted) && !isReconciled;
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
    try {
      await onApproveAdjustment(session.id);
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs print:hidden">
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
        <div className="p-4 md:p-6 space-y-4 overflow-y-auto text-sm">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
            <div className="space-y-1">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <span>Thủ kho phụ trách kiểm đếm:</span>
                <strong className="text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {session.assignedOperator}
                </strong>
              </div>
              {session.reconciledBy ? (
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span>Người phê duyệt cân đối:</span>
                  <strong className="text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {session.reconciledBy}
                  </strong>
                </div>
              ) : (
                <div className="text-2xs text-amber-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Yêu cầu phê duyệt độc lập (Separation of Duties - SoD)</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
                Tiến độ: <strong className="text-slate-900">{session.countedBins}/{session.totalBins} ô ({progressPercent}%)</strong>
              </span>
              <span
                className={`px-3 py-1.5 rounded-lg border font-semibold ${
                  session.discrepanciesCount > 0
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                Sai lệch: <strong>{session.discrepanciesCount} ô</strong>
              </span>

              {session.adjustmentCode && (
                <span className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold flex items-center gap-1.5">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Phiếu: {session.adjustmentCode}</span>
                </span>
              )}
            </div>
          </div>

          {/* Cảnh báo P0 nếu chưa đếm xong */}
          {!isAllCounted && !isReconciled && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đợt kiểm kê chưa hoàn tất kiểm đếm:</span> Mới ghi nhận kết quả tại{' '}
                <strong>{session.countedBins}/{session.totalBins} vị trí</strong>. Theo quy chuẩn an toàn kho Enterprise WMS, chức năng{' '}
                <em>"Duyệt Cân Đối Kho & Ghi Sổ Cái"</em> tạm thời được khóa để ngăn ngừa việc ghi nhận điều chỉnh thiếu sót hoặc nhầm lẫn số lượng chưa đếm thành khớp số dư.
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
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
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-xs text-blue-900 uppercase">
                    Xác Minh Đếm Lại Vòng 2 (Discrepancy Recount Verification)
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
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 uppercase tracking-wider">
                Chi Tiết Từng Dòng Ô Kệ & Đối Soát Bút Toán:
              </span>
              <span className="text-2xs text-slate-500 font-mono">
                Điều chỉnh = Thực Đếm - Chốt Snapshot • Tồn Sau Cân Đối = Thực Đếm
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white shadow-xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Vị Trí Ô Kệ</th>
                    <th className="py-3 px-3">Mặt Hàng & Lô</th>
                    <th className="py-3 px-3 text-center">Chốt Snapshot</th>
                    <th className="py-3 px-3 text-center">Thực Tế Đếm</th>
                    <th className="py-3 px-3 text-center">Chênh Lệch</th>
                    <th className="py-3 px-3 text-center">Điều Chỉnh Ledger</th>
                    <th className="py-3 px-3 text-center">Tồn Sau Cân Đối</th>
                    <th className="py-3 px-3 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
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
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            {item.locationBarcode}
                          </span>
                          {item.zoneCode && (
                            <div className="text-2xs text-slate-500 font-sans mt-0.5">
                              Khu {item.zoneCode}
                            </div>
                          )}
                        </td>

                        {/* Sản phẩm & Lô */}
                        <td className="py-3 px-3">
                          <div className="font-sans font-bold text-slate-900 text-xs">
                            {item.productName}
                          </div>
                          <div className="text-2xs text-slate-500">
                            {item.sku} • Lô: <strong className="text-amber-700">{item.batchNumber}</strong>
                          </div>
                        </td>

                        {/* Chốt Snapshot */}
                        <td className="py-3 px-3 text-center font-bold text-slate-800 tabular-nums">
                          {item.systemQty !== null ? (
                            <span>{item.systemQty} {item.unit}</span>
                          ) : (
                            <span className="text-slate-400 italic">Đếm mù</span>
                          )}
                        </td>

                        {/* Thực tế đếm */}
                        <td className="py-3 px-3 text-center tabular-nums">
                          {isUncounted ? (
                            <span className="text-slate-400 font-sans italic text-2xs font-medium">Chưa đếm</span>
                          ) : (
                            <div>
                              <span className="font-bold text-indigo-700">{item.countedQty} {item.unit}</span>
                              {item.secondCountQty !== null && item.secondCountQty !== undefined && (
                                <div className="text-3xs text-emerald-600 font-sans font-bold">
                                  Vòng 2: {item.secondCountQty} (Đã xác minh)
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Chênh lệch */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isUncounted ? (
                            <span className="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded text-2xs border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" /> Chưa Đếm
                            </span>
                          ) : isMatched ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 0 (Khớp)
                            </span>
                          ) : isShortage ? (
                            <span
                              className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-2xs"
                              title="Phát hiện thiếu hàng so với hệ thống"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {item.differenceQty} {item.unit}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-2xs"
                              title="Phát hiện dôi thừa so với hệ thống"
                            >
                              +{item.differenceQty} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Điều chỉnh Ledger */}
                        <td className="py-3 px-3 text-center font-bold tabular-nums">
                          {isUncounted ? (
                            <span className="text-slate-400">-</span>
                          ) : item.adjustmentQty && item.adjustmentQty !== 0 ? (
                            <span
                              className={
                                item.adjustmentQty > 0
                                  ? 'text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'
                                  : 'text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200'
                              }
                            >
                              {item.adjustmentQty > 0 ? `+${item.adjustmentQty}` : item.adjustmentQty} {item.unit}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0 (Không đổi)</span>
                          )}
                        </td>

                        {/* Tồn sau cân đối */}
                        <td className="py-3 px-3 text-center font-bold text-slate-900 tabular-nums">
                          {isUncounted ? (
                            <span className="text-slate-400">-</span>
                          ) : (
                            <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-800">
                              {item.balanceAfter} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Thao tác đếm lại */}
                        <td className="py-3 px-3 text-center">
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
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Biên Bản Kiểm Kê</span>
          </button>

          <div className="flex items-center gap-3">
            {!isReconciled ? (
              <button
                onClick={handleApprove}
                disabled={!canApprove || isApproving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title={
                  !canApprove
                    ? `Còn ${session.totalBins - session.countedBins} vị trí ô kệ chưa hoàn thành kiểm đếm`
                    : 'Phê duyệt độc lập và tự động ghi sổ cái'
                }
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isApproving ? 'Đang Ghi Sổ Cái...' : 'Duyệt Cân Đối Kho & Ghi Sổ Cái'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Đã ghi nhận bút toán Stock Ledger ADJUSTMENT</span>
              </div>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
