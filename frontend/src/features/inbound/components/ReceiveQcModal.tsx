import React, { useState } from 'react';
import {
  X,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Layers,
  PackageCheck,
  AlertOctagon,
  Sparkles,
  Archive,
  ArrowRight,
  Info,
} from 'lucide-react';
import { InboundOrder, ReceiptLine } from '../types';

export const QC_REJECT_REASONS = [
  { code: 'BAO_BI_RACH_MOP', label: 'Bao bì rách, bẹp, móp méo do vận chuyển' },
  { code: 'CAN_DATE_HET_HAN', label: 'Cận hạn sử dụng / Không đạt tiêu chuẩn hạn dùng (FEFO)' },
  { code: 'SAI_QUY_CACH', label: 'Sai tem nhãn, barcode hoặc sai phân loại SKU' },
  { code: 'CHAT_LUONG_KEM', label: 'Biến chất, rò rỉ dung dịch hoặc hư hỏng vật lý' },
  { code: 'THIEU_HO_SO', label: 'Thiếu chứng nhận kiểm định chất lượng (CO/CQ)' },
  { code: 'QUA_TAI_TRONG_KHO', label: 'Từ chối nhận do vượt sức chứa kho / kho không đủ chỗ chứa' },
  { code: 'DAT_NHAM_PO', label: 'Từ chối nhận do đặt nhầm số lượng / sai lệch hợp đồng' },
  { code: 'KHAC', label: 'Lý do khác (ghi chú biên bản giám định)' },
];

interface ReceiveQcModalProps {
  order: Pick<InboundOrder, 'id' | 'items' | 'poCode' | 'supplierName'> & { warehouseId?: number };
  onClose: () => void;
  onConfirmReceive: (orderId: string, itemUpdates: ReceiptLine[]) => Promise<void>;
}

export const ReceiveQcModal: React.FC<ReceiveQcModalProps> = ({ order, onClose, onConfirmReceive }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDefaultLot = (sku: string) => {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const cleanSku = (sku || 'SKU').replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
    return `LOT-${datePart}-${cleanSku || '001'}`;
  };

  const getDefaultExpiry = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const [itemStates, setItemStates] = useState(() =>
    order.items.map((item) => ({
      id: item.id,
      sku: item.sku,
      productName: item.productName,
      unit: item.unit,
      expectedQty: item.expectedQty,
      receivedQty: item.receivedQty > 0 ? item.receivedQty : item.expectedQty,
      batchNumber: item.batchNumber || generateDefaultLot(item.sku),
      expiryDate: item.expiryDate || getDefaultExpiry(),
      rejectedQty: item.rejectedQty || 0,
      rejectReason: 'BAO_BI_RACH_MOP',
      qcNotes: '',
    }))
  );

  const handleQtyChange = (id: string, qty: number) => {
    setItemStates((prev) =>
      prev.map((it) => (it.id === id ? { ...it, receivedQty: Math.max(0, qty) } : it))
    );
  };

  const handleBatchChange = (id: string, batchNumber: string) => {
    setItemStates((prev) =>
      prev.map((it) => (it.id === id ? { ...it, batchNumber } : it))
    );
  };

  const handleExpiryChange = (id: string, expiryDate: string) => {
    setItemStates((prev) =>
      prev.map((it) => (it.id === id ? { ...it, expiryDate } : it))
    );
  };

  const handleQcChange = (id: string, rejectedQty: number) => {
    setItemStates((prev) =>
      prev.map((it) =>
        it.id === id
          ? {
              ...it,
              rejectedQty: Math.max(0, Math.min(it.receivedQty, rejectedQty)),
            }
          : it
      )
    );
  };

  const handleReasonChange = (id: string, rejectReason: string) => {
    setItemStates((prev) =>
      prev.map((it) => (it.id === id ? { ...it, rejectReason } : it))
    );
  };

  const handleAutoGenerateLot = (id: string, sku: string) => {
    const newLot = generateDefaultLot(sku);
    handleBatchChange(id, newLot);
  };

  // Tổng hợp số liệu tức thì
  const totalExpected = itemStates.reduce((sum, it) => sum + it.expectedQty, 0);
  const totalReceived = itemStates.reduce((sum, it) => sum + it.receivedQty, 0);
  const totalRejected = itemStates.reduce((sum, it) => sum + it.rejectedQty, 0);
  const totalPassed = totalReceived - totalRejected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onConfirmReceive(
        order.id,
        itemStates.map((it) => ({
          id: it.id,
          receivedQty: it.receivedQty,
          rejectedQty: it.rejectedQty,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
        }))
      );
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi tiếp nhận đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900">
                  Tiếp Nhận & Kiểm Định Chất Lượng (Receiving & QC)
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                  {order.poCode}
                </span>
                {order.warehouseId === 2 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                    Kho Bắc Ninh
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Nhà cung ứng: <strong className="text-slate-800">{order.supplierName}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-sm flex-1">
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick QC Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Kế Hoạch PO</span>
              <div className="font-black text-slate-800 text-base mt-0.5 font-mono">
                {totalExpected} <span className="text-xs font-normal text-slate-500">kiện</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Thực Nhận Tại Cổng</span>
              <div className="font-black text-blue-900 text-base mt-0.5 font-mono flex items-center gap-1.5">
                <span>{totalReceived}</span>
                {totalReceived !== totalExpected && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white text-blue-800 border border-blue-200">
                    {totalReceived > totalExpected ? `+${totalReceived - totalExpected}` : `-${totalExpected - totalReceived}`}
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Đạt Tiêu Chuẩn QC</span>
              <div className="font-black text-emerald-800 text-base mt-0.5 font-mono">
                {totalPassed} <span className="text-xs font-normal text-emerald-600">vào đệm</span>
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${totalRejected > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${totalRejected > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                Hàng Lỗi / Cách Ly
              </span>
              <div className={`font-black text-base mt-0.5 font-mono ${totalRejected > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                {totalRejected} <span className="text-xs font-normal">{totalRejected > 0 ? 'chờ xử lý' : 'không có'}</span>
              </div>
            </div>
          </div>

          {/* Table Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">Danh Sách Mặt Hàng Tiếp Nhận Tại Khu Đệm:</span>
              <span className="text-xs text-slate-500 font-medium">Đối soát số lượng đặt vs thực nhận & giám định lô</span>
            </div>

            <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-3 px-3">Mặt Hàng (SKU)</th>
                    <th className="py-3 px-2 text-center">SL Đặt (PO)</th>
                    <th className="py-3 px-2 text-center w-28">SL Thực Nhận</th>
                    <th className="py-3 px-3 min-w-[170px]">Mã Lô (Batch/Lot)</th>
                    <th className="py-3 px-3 min-w-[140px]">Hạn Dùng (FEFO)</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">SL Lỗi / Đạt QC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {itemStates.map((it) => {
                    const isDiff = it.receivedQty !== it.expectedQty;
                    const passedQty = it.receivedQty - it.rejectedQty;
                    return (
                      <React.Fragment key={it.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-xs">{it.productName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{it.sku}</div>
                          </td>

                          <td className="py-3 px-2 text-center font-bold text-slate-700">
                            {it.expectedQty} {it.unit}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <input
                              type="number"
                              min="0"
                              value={it.receivedQty}
                              onChange={(e) => handleQtyChange(it.id, Number(e.target.value))}
                              className={`w-22 px-2 py-1 text-center font-bold text-xs rounded-lg border outline-none transition-all ${
                                isDiff
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-300'
                                  : 'border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-200'
                              }`}
                            />
                            {isDiff && (
                              <span className="block text-[10px] text-amber-700 font-medium mt-0.5">
                                {it.receivedQty < it.expectedQty ? `Thiếu ${it.expectedQty - it.receivedQty}` : `Thừa +${it.receivedQty - it.expectedQty}`}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                required={it.receivedQty > it.rejectedQty}
                                maxLength={100}
                                value={it.batchNumber}
                                onChange={(e) => handleBatchChange(it.id, e.target.value)}
                                className="w-full px-2 py-1 font-mono text-xs text-indigo-700 font-bold bg-indigo-50/50 rounded-lg border border-indigo-200 focus:ring-2 focus:ring-indigo-200 outline-none"
                                placeholder="Nhập mã lô..."
                              />
                              <button
                                type="button"
                                onClick={() => handleAutoGenerateLot(it.id, it.sku)}
                                title="Tự động sinh mã lô theo ngày"
                                className="p-1 rounded-md text-indigo-600 hover:bg-indigo-100 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <input
                              type="date"
                              required={it.receivedQty > it.rejectedQty}
                              value={it.expiryDate}
                              onChange={(e) => handleExpiryChange(it.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs text-slate-800 font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 block">Lỗi QC:</span>
                                <input
                                  aria-label={`Số lượng lỗi ${it.sku}`}
                                  type="number"
                                  min={0}
                                  max={it.receivedQty}
                                  value={it.rejectedQty}
                                  onChange={(e) => handleQcChange(it.id, Number(e.target.value))}
                                  className={`w-14 rounded-lg border py-0.5 px-1 text-center font-bold text-xs ${
                                    it.rejectedQty > 0 ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300'
                                  }`}
                                />
                              </div>
                              <div className="text-left pl-1 border-l border-slate-200">
                                <span className="text-[10px] text-slate-400 block">Đạt QC:</span>
                                <span className="font-bold text-emerald-700 text-xs font-mono">{passedQty}</span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Sub-panel for QC rejection reasons when rejectedQty > 0 */}
                        {it.rejectedQty > 0 && (
                          <tr className="bg-rose-50/50">
                            <td colSpan={6} className="py-2 px-3 border-b border-rose-100">
                              <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5 text-rose-700 font-bold shrink-0">
                                  <AlertOctagon className="w-3.5 h-3.5" />
                                  <span>Phân loại lỗi {it.rejectedQty} {it.unit}:</span>
                                </div>
                                <select
                                  value={it.rejectReason}
                                  onChange={(e) => handleReasonChange(it.id, e.target.value)}
                                  className="p-1 rounded-lg bg-white border border-rose-300 text-rose-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-200 flex-1 max-w-md"
                                >
                                  {QC_REJECT_REASONS.map((r) => (
                                    <option key={r.code} value={r.code}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>
                                <span className="text-[11px] text-rose-600 italic">
                                  (Số lượng lỗi sẽ chuyển sang Khu Cách Ly / Trả hàng NCC, không được phép cất lên kệ)
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              Tổng số lượng sẽ vào Khu Đệm: <strong className="text-emerald-700 font-bold font-mono">{totalPassed}</strong> kiện hàng đạt chuẩn
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={submitting || totalReceived === 0}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200 cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <span>Đang xử lý tiếp nhận...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Tiếp Nhận Vào Khu Đệm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
