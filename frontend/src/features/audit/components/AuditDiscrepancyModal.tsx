import React, { useState } from 'react';
import { X, Scale, CheckCircle2, AlertTriangle, MapPin, ShieldCheck, Printer, ArrowRight, Clock, HelpCircle, FileCheck2 } from 'lucide-react';
import { AuditSession } from '../types';

interface AuditDiscrepancyModalProps {
  session: AuditSession | null;
  onClose: () => void;
  onApproveAdjustment: (sessionId: string) => void;
}

export const AuditDiscrepancyModal: React.FC<AuditDiscrepancyModalProps> = ({
  session,
  onClose,
  onApproveAdjustment,
}) => {
  if (!session) return null;

  const [isApproving, setIsApproving] = useState(false);
  const isReconciled = session.status === 'RECONCILED';
  const isAllCounted = session.items && session.items.length > 0 && session.items.every((i) => i.countedQty !== null && i.countedQty !== undefined);
  const canApprove = (session.status === 'PENDING_REVIEW' || isAllCounted) && !isReconciled;
  const progressPercent = Math.round((session.countedBins / (session.totalBins || 1)) * 100);

  const handleApprove = async () => {
    if (!canApprove) return;
    setIsApproving(true);
    try {
      await onApproveAdjustment(session.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:w-full">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs print:hidden">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900">Đối Soát Kiểm Kê & Bút Toán Cân Đối: {session.auditCode}</h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                  session.status === 'RECONCILED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : session.status === 'PENDING_REVIEW' || isAllCounted
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {session.status === 'RECONCILED' ? 'ĐÃ CÂN ĐỐI' : session.status === 'PENDING_REVIEW' || isAllCounted ? 'CHỜ DUYỆT ĐỐI SOÁT' : 'ĐANG KIỂM ĐẾM'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{session.title} • Phạm vi: {session.scope}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors print:hidden cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto text-sm">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
            <div className="space-y-1">
              <div className="font-semibold text-slate-900">
                Thủ kho phụ trách kiểm đếm: <strong className="text-indigo-600">{session.assignedOperator}</strong>
              </div>
              {session.reconciledBy && (
                <div className="text-xs text-slate-500">
                  Người phê duyệt cân đối: <strong className="text-emerald-700">{session.reconciledBy}</strong>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
                Tiến độ: <strong className="text-slate-900">{session.countedBins}/{session.totalBins} ô ({progressPercent}%)</strong>
              </span>
              <span className={`px-3 py-1.5 rounded-lg border font-semibold ${
                session.discrepanciesCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                Sai lệch: <strong className={session.discrepanciesCount > 0 ? 'text-rose-700' : 'text-emerald-700'}>{session.discrepanciesCount} ô</strong>
              </span>
            </div>
          </div>

          {/* Cảnh báo P0 nếu chưa đếm xong */}
          {!isAllCounted && !isReconciled && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Đợt kiểm kê chưa hoàn tất kiểm đếm:</span> Mới ghi nhận kết quả tại <strong>{session.countedBins}/{session.totalBins} vị trí</strong>. Theo quy chuẩn an toàn kho Enterprise WMS, chức năng <em>"Duyệt Cân Đối Kho & Ghi Sổ Cái"</em> tạm thời được khóa để ngăn ngừa việc ghi nhận điều chỉnh thiếu sót hoặc nhầm lẫn số lượng chưa đếm thành khớp số dư.
              </div>
            </div>
          )}

          {/* Bảng so khớp đối soát */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Chi Tiết Từng Vị Trí Ô Kệ So Khớp:
              </span>
              <span className="text-2xs text-slate-500 font-mono">
                Công thức: Sai Lệch (Variance) = Thực Đếm (PDA) - Tồn Hệ Thống
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-sm font-mono">
                <thead className="bg-slate-100 text-slate-700 text-xs font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Vị Trí Ô Kệ</th>
                    <th className="py-3 px-3">Mặt Hàng & Lô</th>
                    <th className="py-3 px-3 text-center">Tồn Hệ Thống</th>
                    <th className="py-3 px-3 text-center">Thực Tế Đếm (PDA)</th>
                    <th className="py-3 px-3 text-center">Chênh Lệch</th>
                    <th className="py-3 px-3">Ghi Chú Kiểm Kê</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {session.items.map((item) => {
                    const isUncounted = item.countedQty === null || item.countedQty === undefined;
                    const isMatched = !isUncounted && item.differenceQty === 0;
                    const isShortage = !isUncounted && item.differenceQty !== null && item.differenceQty < 0;
                    const isSurplus = !isUncounted && item.differenceQty !== null && item.differenceQty > 0;

                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isUncounted ? 'bg-slate-50/40 opacity-80' : ''}`}>
                        {/* Vị trí */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            {item.locationBarcode}
                          </span>
                        </td>

                        {/* Sản phẩm & Lô */}
                        <td className="py-3 px-3">
                          <div className="font-sans font-bold text-slate-900 text-sm">{item.productName}</div>
                          <div className="text-xs text-slate-500">
                            {item.sku} • Lô: <strong className="text-amber-700">{item.batchNumber}</strong>
                          </div>
                        </td>

                        {/* Tồn hệ thống */}
                        <td className="py-3 px-3 text-center font-bold text-slate-800 tabular-nums">
                          {item.systemQty} {item.unit}
                        </td>

                        {/* Thực tế đếm */}
                        <td className="py-3 px-3 text-center tabular-nums">
                          {isUncounted ? (
                            <span className="text-slate-400 font-sans italic text-xs font-medium">Chưa đếm</span>
                          ) : (
                            <span className="font-bold text-indigo-700">{item.countedQty} {item.unit}</span>
                          )}
                        </td>

                        {/* Chênh lệch */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isUncounted ? (
                            <span className="inline-flex items-center gap-1 text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" /> Chưa Đếm
                            </span>
                          ) : isMatched ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> 0 (Khớp)
                            </span>
                          ) : isShortage ? (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-xs" title="Phát hiện thiếu hàng so với hệ thống">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> {item.differenceQty} {item.unit} (Thiếu)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-xs" title="Phát hiện thừa hàng so với hệ thống">
                              +{item.differenceQty} {item.unit} (Thừa)
                            </span>
                          )}
                        </td>

                        {/* Ghi chú */}
                        <td className="py-3 px-3 font-sans text-xs">
                          {isUncounted ? (
                            <span className="text-slate-400 italic">Chờ nhân viên quét mã PDA tại ô kệ</span>
                          ) : (
                            <span className="text-slate-600">{item.notes || 'Số liệu khớp hoàn toàn'}</span>
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
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold border border-slate-300 transition-colors shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Biên Bản Kiểm Kê</span>
          </button>

          <div className="flex items-center gap-3">
            {!isReconciled ? (
              <button
                onClick={handleApprove}
                disabled={!canApprove || isApproving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title={!canApprove ? `Còn ${session.totalBins - session.countedBins} vị trí ô kệ chưa hoàn thành kiểm đếm` : 'Phê duyệt và tự động ghi sổ cái'}
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
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
