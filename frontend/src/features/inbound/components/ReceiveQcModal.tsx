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
  Check,
} from 'lucide-react';
import { InboundOrder, ReceiptLine } from '../types';

export const QC_REJECT_REASONS = [
  { code: 'VUOT_DUNG_SAI_PO', label: 'Vượt dung sai hợp đồng PO (+10%) / Trả lại xe tại cổng' },
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
  onConfirmReceive: (orderId: string, itemUpdates: ReceiptLine[], notes?: string) => Promise<void>;
}

export const ReceiveQcModal: React.FC<ReceiveQcModalProps> = ({ order, onClose, onConfirmReceive }) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPoSuffix = (poCode?: string) => {
    if (!poCode) return 'PO';
    const parts = poCode.split('-');
    const last = parts[parts.length - 1];
    if (last && last.length >= 2) return last.toUpperCase();
    return poCode.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase();
  };

  const generatePoLot = (lineIndex: number, subSuffix?: string) => {
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const poSuffix = getPoSuffix(order.poCode);
    const lineStr = String(lineIndex + 1).padStart(2, '0');
    return `LOT-${datePart}-${poSuffix}-${lineStr}${subSuffix || ''}`;
  };

  const getDefaultExpiry = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  };

  const getNextBatchSuffix = (currentBatchNumber?: string, stockedQty?: number) => {
    if (!stockedQty || stockedQty <= 0) return '-01';
    if (currentBatchNumber) {
      const match = currentBatchNumber.match(/-(\d{2})$/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        return `-${String(nextNum).padStart(2, '0')}`;
      }
    }
    return '-02';
  };

  // Khởi tạo: Mặc định số lượng thực nhận bằng số lượng kế hoạch PO (hoặc số lượng giao bù nếu đơn đã cất 1 phần).
  // Thủ kho chỉ cần điều chỉnh nếu thực tế nhận thiếu hoặc phát hiện hàng lỗi QC.
  const [itemStates, setItemStates] = useState(() =>
    order.items.map((item, index) => {
      const unstockedRemaining = Math.max(0, (item.expectedQty || 0) - (item.stockedQty || 0));
      const initReceived = (item.stockedQty && item.stockedQty > 0)
        ? unstockedRemaining
        : (item.receivedQty > 0 ? item.receivedQty : (item.expectedQty || 0));
      const lotSuffix = getNextBatchSuffix(item.batchNumber, item.stockedQty);
      return {
        id: String(item.id),
        sku: item.sku,
        productName: item.productName,
        unit: item.unit || 'Đơn vị',
        expectedQty: item.expectedQty || 0,
        receivedQty: initReceived,
        batchNumber: (item.stockedQty && item.stockedQty > 0) ? generatePoLot(index, lotSuffix) : (item.batchNumber || generatePoLot(index)),
        expiryDate: item.expiryDate || getDefaultExpiry(),
        rejectedQty: 0,
        rejectReason: 'BAO_BI_RACH_MOP',
        qcNotes: '',
      };
    })
  );

  // Đồng bộ lại chỉ khi người dùng đổi sang một đơn PO hoàn toàn khác
  const orderIdRef = React.useRef(order?.id);
  React.useEffect(() => {
    if (order?.id && order.id !== orderIdRef.current) {
      orderIdRef.current = order.id;
      setItemStates(
        order.items.map((item, index) => {
          const unstockedRemaining = Math.max(0, (item.expectedQty || 0) - (item.stockedQty || 0));
          const initReceived = (item.stockedQty && item.stockedQty > 0)
            ? unstockedRemaining
            : (item.receivedQty > 0 ? item.receivedQty : (item.expectedQty || 0));
          const lotSuffix = getNextBatchSuffix(item.batchNumber, item.stockedQty);
          return {
            id: String(item.id),
            sku: item.sku,
            productName: item.productName,
            unit: item.unit || 'Đơn vị',
            expectedQty: item.expectedQty || 0,
            receivedQty: initReceived,
            batchNumber: (item.stockedQty && item.stockedQty > 0) ? generatePoLot(index, lotSuffix) : (item.batchNumber || generatePoLot(index)),
            expiryDate: item.expiryDate || getDefaultExpiry(),
            rejectedQty: 0,
            rejectReason: 'BAO_BI_RACH_MOP',
            qcNotes: '',
          };
        })
      );
    }
  }, [order?.id]);

  const handleQtyChange = (id: string | number, qty: number) => {
    const validQty = Math.max(0, isNaN(qty) ? 0 : qty);
    setError(null);
    setItemStates((prev) =>
      prev.map((it) => {
        if (String(it.id) === String(id)) {
          const clampedRejected = Math.min(it.rejectedQty, validQty);
          return { ...it, receivedQty: validQty, rejectedQty: clampedRejected };
        }
        return it;
      })
    );
  };

  const handleBatchChange = (id: string | number, batchNumber: string) => {
    setItemStates((prev) =>
      prev.map((it) => (String(it.id) === String(id) ? { ...it, batchNumber } : it))
    );
  };

  const handleExpiryChange = (id: string | number, expiryDate: string) => {
    setItemStates((prev) =>
      prev.map((it) => (String(it.id) === String(id) ? { ...it, expiryDate } : it))
    );
  };

  const handleQcChange = (id: string | number, rejectedQty: number) => {
    const val = Math.max(0, isNaN(rejectedQty) ? 0 : rejectedQty);
    setError(null);
    setItemStates((prev) =>
      prev.map((it) => {
        if (String(it.id) === String(id)) {
          // Nếu số lượng lỗi vượt số thực nhận hiện tại, tự động nâng số thực nhận tương ứng
          const newReceived = Math.max(it.receivedQty, val);
          return {
            ...it,
            receivedQty: newReceived,
            rejectedQty: val,
          };
        }
        return it;
      })
    );
  };

  const handleReasonChange = (id: string | number, rejectReason: string) => {
    setItemStates((prev) =>
      prev.map((it) => (String(it.id) === String(id) ? { ...it, rejectReason } : it))
    );
  };

  const handleNotesChange = (id: string | number, qcNotes: string) => {
    setItemStates((prev) =>
      prev.map((it) => (String(it.id) === String(id) ? { ...it, qcNotes } : it))
    );
  };

  const handleAutoGenerateLot = (id: string | number, lineIndex: number) => {
    setItemStates((prev) =>
      prev.map((it) => {
        if (String(it.id) !== String(id)) return it;
        const base = generatePoLot(lineIndex);
        let nextSuffix = 'A';
        if (it.batchNumber.startsWith(base)) {
          const currentSuffix = it.batchNumber.slice(base.length);
          if (!currentSuffix) {
            nextSuffix = 'A';
          } else {
            const nextCharCode = currentSuffix.charCodeAt(0) + 1;
            nextSuffix = nextCharCode <= 90 ? String.fromCharCode(nextCharCode) : '';
          }
        }
        return { ...it, batchNumber: `${base}${nextSuffix}` };
      })
    );
  };

  const handleAcceptExpected = (id: string | number, expectedQty: number) => {
    setError(null);
    setItemStates((prev) =>
      prev.map((it) =>
        String(it.id) === String(id)
          ? { ...it, receivedQty: expectedQty, rejectedQty: 0 }
          : it
      )
    );
  };

  // Đơn vị tính đồng bộ chuẩn
  const primaryUnit = order.items[0]?.unit || 'sản phẩm';
  const totalExpected = itemStates.reduce((sum, it) => sum + it.expectedQty, 0);
  const totalReceived = itemStates.reduce((sum, it) => sum + it.receivedQty, 0);
  const totalRejected = itemStates.reduce((sum, it) => sum + it.rejectedQty, 0);
  const totalPassed = totalReceived - totalRejected;
  const hasOverTolerance = itemStates.some((it) => (it.receivedQty - it.rejectedQty) > Math.floor(it.expectedQty * 1.10));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalReceived === 0) {
      setError('Vui lòng quét hoặc nhập số lượng thực nhận trước khi xác nhận vào khu đệm.');
      return;
    }

    // 1. Kiểm tra dung sai giao nhận (+10%) theo chuẩn doanh nghiệp
    for (const it of itemStates) {
      const maxAllowed = Math.floor(it.expectedQty * 1.10);
      const netQty = it.receivedQty - it.rejectedQty;
      if (netQty > maxAllowed) {
        setError(
          `Mặt hàng "${it.productName}" có số lượng đạt chuẩn (${netQty} ${it.unit}) vượt quá dung sai giao nhận tối đa cho phép (+10% = tối đa ${maxAllowed} ${it.unit}). Vui lòng điều chỉnh hoặc nhập số lượng từ chối trả lại xe!`
        );
        return;
      }
    }

    // 2. Kiểm tra nếu có mặt hàng chọn "Lý do khác" mà chưa ghi rõ diễn giải/biên bản
    const missingOtherNote = itemStates.find(
      (it) => it.rejectedQty > 0 && it.rejectReason === 'KHAC' && !it.qcNotes.trim()
    );
    if (missingOtherNote) {
      setError(
        `Vui lòng ghi rõ nội dung biên bản giám định hoặc lý do thực tế cho mặt hàng "${missingOtherNote.productName}" khi phân loại "Lý do khác".`
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const qcNotesSummary = itemStates
        .filter((it) => it.rejectedQty > 0)
        .map((it) => {
          const reasonObj = QC_REJECT_REASONS.find((r) => r.code === it.rejectReason);
          const reasonLabel = reasonObj?.label || it.rejectReason;
          return `${it.sku}: ${it.rejectedQty} ${it.unit} lỗi [${reasonLabel}]${it.qcNotes ? ' (Ghi chú: ' + it.qcNotes.trim() + ')' : ''}`;
        })
        .join('; ');

      await onConfirmReceive(
        order.id,
        itemStates.map((it) => ({
          id: it.id,
          receivedQty: it.receivedQty,
          rejectedQty: it.rejectedQty,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
        })),
        qcNotesSummary || undefined
      );
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Lỗi khi tiếp nhận đơn hàng');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-none md:rounded-3xl max-w-5xl w-full border-0 md:border md:border-slate-200 shadow-2xl overflow-hidden text-slate-900 flex flex-col h-full md:max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-200 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                  Tiếp Nhận & Kiểm Định (Receiving & QC)
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
              <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                Nhà cung ứng: <strong className="text-slate-800">{order.supplierName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4 overflow-y-auto text-sm flex-1">
          {error && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick QC Metrics Cards (Đơn vị tính đồng bộ theo SKU) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Kế Hoạch PO
              </span>
              <div className="font-black text-slate-800 text-sm sm:text-base mt-0.5 font-mono">
                {totalExpected} <span className="text-2xs sm:text-xs font-normal text-slate-500">{primaryUnit}</span>
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                Thực Nhận Tại Cổng
              </span>
              <div className="font-black text-blue-900 text-sm sm:text-base mt-0.5 font-mono flex items-center gap-1">
                <span>{totalReceived}</span>
                {totalReceived > 0 && totalReceived !== totalExpected && (
                  <span className="text-[10px] font-bold px-1 rounded bg-white text-blue-800 border border-blue-200">
                    {totalReceived > totalExpected ? `+${totalReceived - totalExpected}` : `-${totalExpected - totalReceived}`}
                  </span>
                )}
              </div>
            </div>

            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Đạt Chuẩn QC
              </span>
              <div className="font-black text-emerald-800 text-sm sm:text-base mt-0.5 font-mono">
                {totalPassed} <span className="text-2xs sm:text-xs font-normal text-emerald-600">đạt chuẩn</span>
              </div>
            </div>

            <div className={`p-2.5 sm:p-3 rounded-xl border ${totalRejected > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider block ${totalRejected > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                Hàng Lỗi Kiểm Định
              </span>
              <div className={`font-black text-sm sm:text-base mt-0.5 font-mono ${totalRejected > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                {totalRejected} <span className="text-2xs sm:text-xs font-normal">{totalRejected > 0 ? 'lỗi' : '0'}</span>
              </div>
            </div>
          </div>

          {/* =========================================================
              MOBILE / PDA CARD VIEW (Tối ưu vuốt chạm cho màn hình nhỏ)
              ========================================================= */}
          <div className="block md:hidden space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600 font-bold px-1">
              <span>DANH SÁCH MẶT HÀNG ({itemStates.length})</span>
              <span className="text-2xs font-normal text-slate-500">Nhập đếm thực tế hoặc nhận đủ</span>
            </div>

            {itemStates.map((it, idx) => {
              const passedQty = it.receivedQty - it.rejectedQty;
              return (
                <div key={it.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                  {/* SKU & Product Name */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">{it.productName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {it.sku}
                        </span>
                        <span className="text-2xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          ĐVT: {it.unit}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-2xs text-slate-400 block font-bold uppercase">Kế hoạch PO</span>
                      <strong className="text-xs font-mono text-slate-800">
                        {it.expectedQty} {it.unit}
                      </strong>
                    </div>
                  </div>

                  {/* Nhập số lượng thực nhận */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-2xs font-extrabold uppercase text-slate-700 tracking-wider">
                        Số Lượng Thực Nhận ({it.unit}):
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAcceptExpected(it.id, it.expectedQty)}
                        className="text-2xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-0.5"
                      >
                        <Check className="w-3 h-3" /> Nhận đủ ({it.expectedQty})
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={it.receivedQty === 0 ? '' : it.receivedQty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          handleQtyChange(it.id, isNaN(val) ? 0 : val);
                        }}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold font-mono text-base text-center text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => handleQtyChange(it.id, it.receivedQty + 1)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        +1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQtyChange(it.id, it.receivedQty + 10)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        +10
                      </button>
                    </div>

                    {it.receivedQty > it.expectedQty && it.receivedQty <= Math.floor(it.expectedQty * 1.10) && (
                      <div className="text-2xs text-emerald-700 font-bold bg-emerald-50 p-1.5 rounded-lg border border-emerald-200 mt-1 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Dôi dư hợp lệ (+{it.receivedQty - it.expectedQty} {it.unit} trong dung sai cho phép +10%)</span>
                      </div>
                    )}

                    {it.receivedQty > Math.floor(it.expectedQty * 1.10) && (
                      (it.receivedQty - it.rejectedQty) > Math.floor(it.expectedQty * 1.10) ? (
                        <div className="text-2xs text-rose-600 font-bold bg-rose-50 p-1.5 rounded-lg border border-rose-200 mt-1">
                          ⚠️ Vượt dung sai giao nhận (+10% = tối đa {Math.floor(it.expectedQty * 1.10)} {it.unit}). Cần từ chối trả xe {it.receivedQty - Math.floor(it.expectedQty * 1.10)} {it.unit} hoặc điều chỉnh lại!
                        </div>
                      ) : (
                        <div className="text-2xs text-blue-700 font-bold bg-blue-50 p-1.5 rounded-lg border border-blue-200 mt-1 flex items-center gap-1">
                          <Check className="w-3 h-3 text-blue-600 shrink-0" />
                          <span>Đã ghi nhận trả lại xe {it.rejectedQty} {it.unit} (Kho thực nhận: {it.receivedQty - it.rejectedQty}/{Math.floor(it.expectedQty * 1.10)} {it.unit} hợp lệ)</span>
                        </div>
                      )
                    )}
                  </div>

                  {/* Khai báo Lô (Batch) & HSD */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-3xs font-extrabold uppercase text-slate-500">Mã Lô (Batch):</label>
                        <button
                          type="button"
                          onClick={() => handleAutoGenerateLot(it.id, idx)}
                          className="text-3xs text-blue-600 font-bold cursor-pointer"
                        >
                          Tạo mã
                        </button>
                      </div>
                      <input
                        type="text"
                        value={it.batchNumber}
                        onChange={(e) => handleBatchChange(it.id, e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-3xs font-extrabold uppercase text-slate-500 block mb-1">Hạn Dùng (FEFO):</label>
                      <input
                        type="date"
                        value={it.expiryDate}
                        onChange={(e) => handleExpiryChange(it.id, e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Kiểm định QC */}
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-3xs font-bold uppercase text-slate-500 block">Đạt Chuẩn QC</span>
                        <strong className="text-sm font-mono text-emerald-700 font-extrabold">{passedQty} {it.unit}</strong>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xs font-bold uppercase text-rose-600">Lỗi QC:</span>
                      <input
                        type="number"
                        min={0}
                        max={Math.max(it.receivedQty, it.expectedQty)}
                        value={it.rejectedQty === 0 ? '' : it.rejectedQty}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                          handleQcChange(it.id, isNaN(val) ? 0 : val);
                        }}
                        placeholder="0"
                        className={`w-16 px-1.5 py-1 text-center font-bold font-mono rounded-lg border text-xs ${
                          it.rejectedQty > 0 ? 'bg-rose-50 border-rose-400 text-rose-700' : 'bg-white border-slate-300 text-slate-700'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Lý do từ chối nếu có hàng lỗi */}
                  {it.rejectedQty > 0 && (
                    <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-bold uppercase text-rose-800 block">
                          Phân loại lỗi {it.rejectedQty} {it.unit}:
                        </span>
                        {it.rejectReason === 'KHAC' && (
                          <span className="text-3xs text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                            Bắt buộc ghi chú
                          </span>
                        )}
                      </div>
                      <select
                        value={it.rejectReason}
                        onChange={(e) => handleReasonChange(it.id, e.target.value)}
                        className="w-full p-2 bg-white border border-rose-300 text-rose-900 rounded-lg text-xs font-semibold focus:outline-none"
                      >
                        {QC_REJECT_REASONS.map((r) => (
                          <option key={r.code} value={r.code}>{r.label}</option>
                        ))}
                      </select>
                      <div>
                        <input
                          type="text"
                          value={it.qcNotes}
                          onChange={(e) => handleNotesChange(it.id, e.target.value)}
                          placeholder={
                            it.rejectReason === 'KHAC'
                              ? 'Ghi rõ lý do khác / Số biên bản giám định...'
                              : 'Ghi chú biên bản / số tem niêm phong (tùy chọn)...'
                          }
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs bg-white border outline-none font-medium transition-colors ${
                            it.rejectReason === 'KHAC' && !it.qcNotes.trim()
                              ? 'border-amber-400 focus:ring-2 focus:ring-amber-200 text-slate-900 placeholder:text-amber-600'
                              : 'border-slate-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* =========================================================
              DESKTOP TABLE VIEW (Giữ nguyên khi thao tác trên máy tính PC)
              ========================================================= */}
          <div className="hidden md:block space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">Danh Sách Mặt Hàng Tiếp Nhận:</span>
            </div>

            <div className="rounded-2xl border border-slate-300 overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-3 px-3">Mặt Hàng (SKU)</th>
                    <th className="py-3 px-2 text-center">SL Đặt (PO)</th>
                    <th className="py-3 px-2 text-center w-36">SL Thực Nhận</th>
                    <th className="py-3 px-3 min-w-[170px]">Mã Lô (Batch/Lot)</th>
                    <th className="py-3 px-3 min-w-[140px]">Hạn Dùng (FEFO)</th>
                    <th className="py-3 px-3 text-center min-w-[130px]">SL Lỗi / Đạt QC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {itemStates.map((it, idx) => {
                    const isDiff = it.receivedQty !== it.expectedQty;
                    const passedQty = it.receivedQty - it.rejectedQty;
                    return (
                      <React.Fragment key={it.id}>
                        <tr className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 text-xs">{it.productName}</div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">{it.sku} • {it.unit}</div>
                          </td>

                          <td className="py-3 px-2 text-center font-bold text-slate-700 font-mono">
                            {it.expectedQty} {it.unit}
                          </td>

                          <td className="py-3 px-2 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                aria-label={`Số lượng thực nhận ${it.sku}`}
                                type="number"
                                min={0}
                                value={it.receivedQty === 0 ? '' : it.receivedQty}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                  handleQtyChange(it.id, isNaN(val) ? 0 : val);
                                }}
                                placeholder="0"
                                className={`w-28 rounded-lg border py-1.5 px-2 text-center font-bold text-xs font-mono focus:ring-2 focus:ring-blue-200 outline-none ${
                                  (it.receivedQty - it.rejectedQty) > Math.floor(it.expectedQty * 1.10)
                                    ? 'border-rose-500 bg-rose-50 text-rose-900'
                                    : isDiff
                                    ? 'border-amber-400 bg-amber-50 text-amber-900'
                                    : 'border-slate-300 bg-white text-slate-900'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleAcceptExpected(it.id, it.expectedQty)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-2xs font-bold transition-colors cursor-pointer shrink-0"
                                title="Nhận đủ theo PO"
                              >
                                Nhận Đủ
                              </button>
                            </div>
                            {it.receivedQty > Math.floor(it.expectedQty * 1.10) && (
                              (it.receivedQty - it.rejectedQty) > Math.floor(it.expectedQty * 1.10) ? (
                                <span className="text-[10px] text-rose-600 font-bold block mt-1">
                                  Vượt dung sai (+10% = tối đa {Math.floor(it.expectedQty * 1.10)}). Cần trả xe {it.receivedQty - Math.floor(it.expectedQty * 1.10)} {it.unit}
                                </span>
                              ) : (
                                <span className="text-[10px] text-blue-700 font-bold block mt-1">
                                  ✓ Đã trừ {it.rejectedQty} {it.unit} trả xe (Kho nhận: {it.receivedQty - it.rejectedQty} {it.unit})
                                </span>
                              )
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1">
                              <input
                                aria-label={`Mã lô ${it.sku}`}
                                type="text"
                                value={it.batchNumber}
                                onChange={(e) => handleBatchChange(it.id, e.target.value)}
                                className="w-full px-2 py-1 text-xs font-mono font-bold text-slate-800 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAutoGenerateLot(it.id, idx)}
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                title="Tự động sinh mã lô"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <input
                              aria-label={`Hạn sử dụng ${it.sku}`}
                              type="date"
                              value={it.expiryDate}
                              onChange={(e) => handleExpiryChange(it.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs text-slate-800 font-medium rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                          </td>

                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">Lỗi QC:</span>
                                <input
                                  aria-label={`Số lượng lỗi ${it.sku}`}
                                  type="number"
                                  min={0}
                                  max={Math.max(it.receivedQty, it.expectedQty)}
                                  value={it.rejectedQty === 0 ? '' : it.rejectedQty}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                    handleQcChange(it.id, isNaN(val) ? 0 : val);
                                  }}
                                  placeholder="0"
                                  className={`w-16 rounded-lg border py-1 px-1.5 text-center font-bold text-xs font-mono outline-none focus:ring-2 focus:ring-rose-200 ${
                                    it.rejectedQty > 0 ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-300 bg-white text-slate-700'
                                  }`}
                                />
                              </div>
                              <div className="text-left pl-2 border-l border-slate-200">
                                <span className="text-[10px] text-emerald-600 font-semibold block mb-0.5">Đạt QC:</span>
                                <span className="font-extrabold text-emerald-700 text-xs font-mono">{passedQty}</span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {it.rejectedQty > 0 && (
                          <tr className="bg-rose-50/50">
                            <td colSpan={6} className="py-2.5 px-3 border-b border-rose-100">
                              <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5 text-rose-700 font-bold shrink-0">
                                  <AlertOctagon className="w-3.5 h-3.5" />
                                  <span>Phân loại lỗi {it.rejectedQty} {it.unit}:</span>
                                </div>
                                <select
                                  value={it.rejectReason}
                                  onChange={(e) => handleReasonChange(it.id, e.target.value)}
                                  className="p-1.5 rounded-lg bg-white border border-rose-300 text-rose-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-200 w-80 shrink-0"
                                >
                                  {QC_REJECT_REASONS.map((r) => (
                                    <option key={r.code} value={r.code}>{r.label}</option>
                                  ))}
                                </select>
                                <div className="flex-1 min-w-[220px]">
                                  <input
                                    type="text"
                                    value={it.qcNotes}
                                    onChange={(e) => handleNotesChange(it.id, e.target.value)}
                                    placeholder={
                                      it.rejectReason === 'KHAC'
                                        ? 'Ghi rõ lý do khác / Số biên bản giám định hiện trường...'
                                        : 'Ghi chú biên bản giám định / số tem niêm phong (tùy chọn)...'
                                    }
                                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs bg-white border outline-none font-medium transition-colors ${
                                      it.rejectReason === 'KHAC' && !it.qcNotes.trim()
                                        ? 'border-amber-400 focus:ring-2 focus:ring-amber-200 text-slate-900 placeholder:text-amber-600 font-semibold'
                                        : 'border-slate-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-200 text-slate-800'
                                    }`}
                                  />
                                </div>
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

          {/* Sticky Bottom Footer (Chiều cao 48-52px chạm 1 tay) */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 pb-1">
            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 font-mono">
              <span>Đạt chuẩn QC:</span>
              <span className="text-emerald-700 font-extrabold text-sm">{totalPassed}</span>
              <span className="text-slate-500 font-normal">{primaryUnit}</span>
              {totalRejected > 0 && (
                <span className="text-rose-600 font-bold text-xs ml-2">
                  • Hàng không đạt: {totalRejected} {primaryUnit}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 sm:flex-none h-12 px-5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={submitting || totalReceived === 0 || hasOverTolerance}
                className="flex-2 sm:flex-none h-12 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-200 cursor-pointer flex items-center justify-center gap-2"
                title={hasOverTolerance ? 'Số thực nhận vượt quá dung sai cho phép (+10%). Vui lòng điều chỉnh lại.' : undefined}
              >
                {submitting ? (
                  <span>Đang xử lý tiếp nhận...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Xác Nhận Tiếp Nhận ({totalPassed} {primaryUnit})</span>
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
