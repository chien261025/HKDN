import React, { useState, useEffect } from 'react';
import {
  X,
  Barcode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Save,
  ScanLine,
} from 'lucide-react';
import { AuditSession, AuditItemDiscrepancy } from '../types';
import { AuditLocationList } from './AuditLocationList';

interface AuditCountingModalProps {
  session: AuditSession;
  onClose: () => void;
  onRecordCount: (itemId: number, countedQty: number, notes?: string) => Promise<void>;
  onOpenReconcileModal?: () => void;
}

export const AuditCountingModal: React.FC<AuditCountingModalProps> = ({
  session,
  onClose,
  onRecordCount,
  onOpenReconcileModal,
}) => {
  const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);
  const [countedQty, setCountedQty] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const items = session.items || [];
  const currentItem: AuditItemDiscrepancy | undefined = items[selectedItemIndex];

  useEffect(() => {
    if (currentItem) {
      setCountedQty(currentItem.countedQty ?? currentItem.systemQty ?? 0);
      setNotes(currentItem.notes || '');
    }
  }, [selectedItemIndex, currentItem]);

  const handleSimulateScan = () => {
    if (!currentItem) return;
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 400);
  };

  const handleSaveCount = async () => {
    if (!currentItem?.itemId) return;
    setIsSaving(true);
    try {
      await onRecordCount(currentItem.itemId, countedQty, notes);
      const nextUncounted = items.findIndex((it, idx) => idx > selectedItemIndex && it.countedQty === null);
      if (nextUncounted !== -1) {
        setSelectedItemIndex(nextUncounted);
      } else {
        const anyUncounted = items.findIndex((it) => it.countedQty === null);
        if (anyUncounted !== -1) {
          setSelectedItemIndex(anyUncounted);
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const isAllCounted = items.length > 0 && items.every((i) => i.countedQty !== null);
  const diff = currentItem ? countedQty - currentItem.systemQty : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-800 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ScanLine className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Mô Phỏng Quét PDA Kiểm Đếm Thực Địa</h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {session.auditCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Quét mã vạch vị trí/sản phẩm ➔ Hệ thống tự động tính chênh lệch thừa thiếu theo thời gian thực
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: 2 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <AuditLocationList
            items={items}
            selectedItemIndex={selectedItemIndex}
            countedBins={session.countedBins}
            totalBins={session.totalBins}
            onSelectItem={(idx) => setSelectedItemIndex(idx)}
          />

          {/* Right Column: Simulator Scanner */}
          <div className="md:col-span-7 p-5 overflow-y-auto space-y-4">
            {currentItem ? (
              <>
                <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 relative overflow-hidden">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                        Vị Trí & Mã Vạch Ô Kệ Hiện Tại
                      </span>
                      <div className="text-base font-black font-mono text-white flex items-center gap-2 mt-0.5">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        {currentItem.locationBarcode}
                      </div>
                    </div>
                    <button
                      onClick={handleSimulateScan}
                      disabled={isScanning}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Barcode className="w-4 h-4" />
                      <span>{isScanning ? 'Đang Quét...' : 'Quét Mã Barcode'}</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1">
                    <div className="font-sans font-bold text-slate-100">{currentItem.productName}</div>
                    <div className="font-mono text-slate-400 flex items-center gap-3">
                      <span>SKU: <strong className="text-white">{currentItem.sku}</strong></span>
                      <span>Lô: <strong className="text-amber-400">{currentItem.batchNumber}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Số Lượng Đếm Thực Tế Tại Ô (Counted Qty)
                    </label>
                    <span className="text-xs font-mono text-slate-500">
                      Tồn Hệ Thống: <strong>{currentItem.systemQty} {currentItem.unit}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCountedQty((q) => Math.max(0, q - 1))}
                      className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xl flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      value={countedQty}
                      onChange={(e) => setCountedQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className="flex-1 h-12 text-center text-2xl font-black font-mono border-2 border-slate-200 focus:border-emerald-500 rounded-xl focus:outline-none"
                    />
                    <button
                      onClick={() => setCountedQty((q) => q + 1)}
                      className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xl flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="pt-2">
                    {diff === 0 ? (
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Số lượng kiểm đếm khớp 100% với số dư hệ thống (Chênh lệch: 0 {currentItem.unit})</span>
                      </div>
                    ) : diff < 0 ? (
                      <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-xs font-semibold">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>
                          Phát hiện thiếu hụt: <strong className="font-mono text-rose-900">{Math.abs(diff)} {currentItem.unit}</strong> (Hệ thống sẽ sinh bút toán giảm tồn)
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 text-xs font-semibold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>
                          Phát hiện dôi thừa: <strong className="font-mono text-amber-900">+{diff} {currentItem.unit}</strong> (Hệ thống sẽ sinh bút toán tăng tồn)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Ghi chú hiện trường (PDA Counter Notes)</label>
                    <input
                      type="text"
                      placeholder="VD: Bao bì rách, hàng rơi cạnh pallet..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveCount}
                  disabled={isSaving}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Đang Lưu...' : 'Ghi Nhận Kết Quả & Chuyển Ô Kế Tiếp'}</span>
                </button>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">Không có vị trí ô kệ nào trong đợt kiểm kê này.</div>
            )}

            {isAllCounted && (
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold">Đã hoàn thành kiểm đếm tất cả các ô kệ!</div>
                    <div className="text-slate-600">Tiến hành đối soát và duyệt điều chỉnh cân đối tồn kho.</div>
                  </div>
                </div>
                {onOpenReconcileModal && (
                  <button
                    onClick={onOpenReconcileModal}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                  >
                    <span>Duyệt Cân Đối</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">
            Phiên làm việc: {session.assignedOperator} • Mode: PDA Blind Count
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
