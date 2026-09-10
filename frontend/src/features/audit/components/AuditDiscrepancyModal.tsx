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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0b101d] rounded-2xl max-w-4xl w-full border border-slate-700 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Đối Soát Kiểm Kê & Bút Toán Cân Đối: {session.auditCode}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                  {session.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{session.title} • Phạm vi: {session.scope}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Summary Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-slate-400">Kết quả kiểm đếm mù (Blind Count từ PDA):</span>
              <div className="font-semibold text-white">
                Thủ kho thực hiện: <strong className="text-cyan-300">{session.assignedOperator}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                Đã đếm: <strong className="text-white">{session.countedBins}/{session.totalBins} ô</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-300">
                Lệch: <strong className="text-rose-400">{session.discrepanciesCount} ô</strong>
              </span>
            </div>
          </div>

          {/* Bảng so khớp đối soát */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Chi Tiết Từng Vị Trí Ô Kệ So Khớp:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                difference_qty = counted_qty - system_qty
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Vị Trí Ô Kệ</th>
                    <th className="py-2.5 px-3">Mặt Hàng & Lô</th>
                    <th className="py-2.5 px-3 text-center">Tồn Hệ Thống</th>
                    <th className="py-2.5 px-3 text-center">Thực Tế Đếm (PDA)</th>
                    <th className="py-2.5 px-3 text-center">Chênh Lệch</th>
                    <th className="py-2.5 px-3">Ghi Chú Kiểm Kê</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {session.items.map((item) => {
                    const isMatched = item.differenceQty === 0;
                    const isShortage = item.differenceQty < 0;
                    const isSurplus = item.differenceQty > 0;

                    return (
                      <tr key={item.id} className="hover:bg-slate-900/40">
                        {/* Vị trí */}
                        <td className="py-2.5 px-3">
                          <span className="flex items-center gap-1 text-cyan-300 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            {item.locationBarcode}
                          </span>
                        </td>

                        {/* Sản phẩm & Lô */}
                        <td className="py-2.5 px-3">
                          <div className="font-sans font-bold text-white text-xs">{item.productName}</div>
                          <div className="text-[10px] text-slate-400">
                            {item.sku} • Lô: <strong className="text-amber-300">{item.batchNumber}</strong>
                          </div>
                        </td>

                        {/* Tồn hệ thống */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-200">
                          {item.systemQty} {item.unit}
                        </td>

                        {/* Thực tế đếm */}
                        <td className="py-2.5 px-3 text-center font-bold text-cyan-300">
                          {item.countedQty} {item.unit}
                        </td>

                        {/* Chênh lệch */}
                        <td className="py-2.5 px-3 text-center">
                          {isMatched && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> 0 (Khớp)
                            </span>
                          )}
                          {isShortage && (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[10px]">
                              <AlertTriangle className="w-3 h-3" /> {item.differenceQty} {item.unit}
                            </span>
                          )}
                          {isSurplus && (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[10px]">
                              +{item.differenceQty} {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Ghi chú */}
                        <td className="py-2.5 px-3 font-sans text-[11px] text-slate-400">
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
          <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-[11px] text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-indigo-300">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Cơ Chế Bút Toán Điều Chỉnh Sổ Cái (Audit Reconciliation):</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Khi Quản lý bấm <strong>"Duyệt Cân Đối Kho (Approve Adjustment)"</strong>, hệ thống sẽ tự động sinh bút toán loại <code className="text-amber-300 font-mono">ADJUSTMENT</code> vào Sổ Cái Bất Biến (stock_ledger) với số lượng chênh lệch để cân bằng số dư tồn kho thực tế, bảo đảm tính minh bạch trước kiểm toán.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={() => alert(`In biên bản kiểm kê cho đợt: ${session.auditCode}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Biên Bản Kiểm Kê</span>
          </button>

          <div className="flex items-center gap-2">
            {!isReconciled && (
              <button
                onClick={() => onApproveAdjustment(session.id)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Duyệt Cân Đối Kho & Ghi Sổ Cái</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
