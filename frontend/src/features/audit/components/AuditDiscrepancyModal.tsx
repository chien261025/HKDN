import React, { useState } from 'react';
import { X, Scale, CheckCircle2, AlertTriangle, MapPin, ShieldCheck, Printer, ArrowRight } from 'lucide-react';
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

  const isReconciled = session.status === 'RECONCILED';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900">Đối Soát Kiểm Kê & Bút Toán Cân Đối: {session.auditCode}</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {session.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{session.title} • Phạm vi: {session.scope}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto text-sm">
          {/* Summary Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
            <div className="space-y-1">
              <span className="text-xs text-slate-500">Kết quả kiểm đếm mù (Blind Count từ PDA):</span>
              <div className="font-semibold text-slate-900">
                Thủ kho thực hiện: <strong className="text-indigo-600">{session.assignedOperator}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs">
                Đã đếm: <strong className="text-slate-900">{session.countedBins}/{session.totalBins} ô</strong>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold">
                Lệch: <strong className="text-rose-700">{session.discrepanciesCount} ô</strong>
              </span>
            </div>
          </div>

          {/* Bảng so khớp đối soát */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                Chi Tiết Từng Vị Trí Ô Kệ So Khớp:
              </span>
              <span className="text-xs text-slate-500 font-mono">
                difference_qty = counted_qty - system_qty
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
                    const isMatched = item.differenceQty === 0;
                    const isShortage = item.differenceQty < 0;
                    const isSurplus = item.differenceQty > 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80">
                        {/* Vị trí */}
                        <td className="py-3 px-3">
                          <span className="flex items-center gap-1.5 text-indigo-700 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
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
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          {item.systemQty} {item.unit}
                        </td>

                        {/* Thực tế đếm */}
                        <td className="py-3 px-3 text-center font-bold text-indigo-700">
                          {item.countedQty} {item.unit}
                        </td>

                        {/* Chênh lệch */}
                        <td className="py-3 px-3 text-center">
                          {isMatched && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 0 (Khớp)
                            </span>
                          )}
                          {isShortage && (
                            <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-xs">
                              <AlertTriangle className="w-3.5 h-3.5" /> {item.differenceQty} {item.unit}
                            </span>
                          )}
                          {isSurplus && (
                            <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-xs">
                              +{item.differenceQty} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Ghi chú */}
                        <td className="py-3 px-3 font-sans text-xs text-slate-500">
                          {item.notes || 'Số liệu khớp hoàn toàn'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Explanation about auto ledger adjustment */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-indigo-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Cơ Chế Bút Toán Điều Chỉnh Sổ Cái (Audit Reconciliation):</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs">
              Khi Quản lý bấm <strong>"Duyệt Cân Đối Kho (Approve Adjustment)"</strong>, hệ thống sẽ tự động sinh bút toán loại <code className="text-amber-700 bg-amber-50 px-1 py-0.5 rounded font-mono font-bold">ADJUSTMENT</code> vào Sổ Cái Bất Biến (stock_ledger) với số lượng chênh lệch để cân bằng số dư tồn kho thực tế, bảo đảm tính minh bạch trước kiểm toán.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => alert(`In biên bản kiểm kê cho đợt: ${session.auditCode}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold border border-slate-300 transition-colors shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>In Biên Bản Kiểm Kê</span>
          </button>

          <div className="flex items-center gap-3">
            {!isReconciled && (
              <button
                onClick={() => onApproveAdjustment(session.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Duyệt Cân Đối Kho & Ghi Sổ Cái</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-sm font-semibold transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
