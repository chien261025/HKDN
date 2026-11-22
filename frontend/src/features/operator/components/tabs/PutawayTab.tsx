import React, { useState, useEffect, useCallback } from 'react';
import { Layers, CheckCircle2, ArrowRight, RefreshCw, Box } from 'lucide-react';
import { operatorService } from '../../services/operatorService';
import { PutawayActiveTaskCard, ActivePutawayTask } from './PutawayActiveTaskCard';
import { soundEffects } from '../../utils/soundEffects';

interface PutawayTabProps {
  onOpenScanner: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
  isCompact?: boolean;
}

export const PutawayTab: React.FC<PutawayTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
  isCompact,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<ActivePutawayTask | null>(null);
  const [scannedBin, setScannedBin] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [stagingQueue, setStagingQueue] = useState<ActivePutawayTask[]>([]);
  const [placedQty, setPlacedQty] = useState<number>(0);

  const fetchReceivedOrders = useCallback(async () => {
    setLoading(true);
    try {
      const [orders, products] = await Promise.all([
        operatorService.getInboundOrders(),
        operatorService.getProducts(),
      ]);
      const receivedOrders = orders.filter((o) => o.status === 'RECEIVED');
      if (receivedOrders.length > 0) {
        const dynamicTasks: ActivePutawayTask[] = [];
        for (const o of receivedOrders) {
          for (const item of o.items || []) {
            const prod = products.find((p) => p.id === item.productId);
            const sku = prod?.sku || `SKU-PROD-${item.productId}`;
            const name = prod?.name || `Sản phẩm #${item.productId}`;
            const unit = prod?.unit || 'kiện';

            const zone = ({ COOL: 'ZONE_B', COLD: 'ZONE_C', SECURE: 'ZONE_D', AMBIENT: 'ZONE_A' } as Record<string,string>)[prod?.storageCondition ?? ''] ?? '';
            const itemQty = item.remainingQty;
            if (itemQty <= 0) continue;
            const totalWeight = itemQty * (prod?.weightKg ?? 0);

            dynamicTasks.push({
              id: `po-${o.id}-it-${item.id}`,
              orderId: o.id,
              warehouseId: o.warehouseId,
              stockedQty: item.stockedQty,
              orderCode: o.orderCode,
              orderItemId: item.id,
              productId: item.productId,
              sku,
              productName: name,
              unit,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              weightKg: totalWeight,
              qty: itemQty,
              preferredZone: zone,
              status: 'PENDING',
            });
          }
        }
        setStagingQueue(dynamicTasks);
      } else {
        setStagingQueue([]);
      }
    } catch (err: any) {
      console.warn('Could not load received orders for putaway:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceivedOrders();
  }, [fetchReceivedOrders]);

  useEffect(() => {
    if (scannedCode) {
      soundEffects.playSuccessBeep();
      setScannedBin(scannedCode);
      setFeedback({ msg: `[PDA] Đã ghi nhận mã ô kệ: ${scannedCode}`, type: 'success' });
      onClearScannedCode?.();
    }
  }, [scannedCode, onClearScannedCode]);

  const handleRequestSuggestion = async (task: ActivePutawayTask) => {
    setLoading(true);
    setFeedback(null);
    try {
      if (!task.preferredZone) throw new Error('Thiếu phân khu lưu trữ trong danh mục sản phẩm.');
      // Chuẩn hóa tải trọng kiểm tra: 1 ô kệ hoặc pallet tiêu chuẩn chứa tối đa 500kg
      const targetWeight = Math.min(task.weightKg || 500, 500);
      const loc = await operatorService.suggestPutawayLocation(task.warehouseId, task.preferredZone, targetWeight);
      soundEffects.playSuccessBeep();
      // Mặc định đề xuất cất đợt 1 pallet / 1 ô (tối đa 50-200 hoặc toàn bộ nếu nhỏ)
      const defaultPlaced = task.qty > 50 ? 50 : task.qty;
      setPlacedQty(defaultPlaced);
      setActiveTask({
        ...task,
        suggestedLocation: loc,
        status: 'SUGGESTED',
      });
      setFeedback({
        msg: `Chỉ định vị trí: Ô ${loc.binBarcode} (${loc.zoneCode} - Tầng ${loc.shelf}) cho đợt cất kiện hàng.`,
        type: 'success',
      });
      // Tự động cuộn lên đầu để thủ kho nhìn thấy ngay ô kệ được chỉ định
      setTimeout(() => {
        const anchor = document.getElementById('putaway-active-card-anchor');
        if (anchor) {
          anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          const mainEl = document.querySelector('main');
          if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 80);
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setFeedback({
        msg: 'Lỗi tìm ô kệ: ' + (err.response?.data?.message || err.message),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAlternate = async () => {
    if (!activeTask) return;
    setLoading(true);
    try {
      const targetWeight = Math.min(activeTask.weightKg || 500, 500);
      const loc = await operatorService.suggestPutawayLocation(
        activeTask.warehouseId,
        activeTask.preferredZone,
        targetWeight
      );
      setActiveTask((prev) => prev ? { ...prev, suggestedLocation: loc } : null);
      soundEffects.playSuccessBeep();
      setFeedback({
        msg: `Đã đổi sang vị trí dự phòng: Ô ${loc.binBarcode} (Tầng ${loc.shelf}).`,
        type: 'success',
      });
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setFeedback({
        msg: 'Không tìm thấy vị trí dự phòng khác: ' + (err.response?.data?.message || err.message),
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPlacement = async () => {
    if (!activeTask || !activeTask.suggestedLocation) return;
    const targetBarcode = activeTask.suggestedLocation.binBarcode;

    if (scannedBin.trim() && scannedBin.trim() !== targetBarcode) {
      soundEffects.playErrorBuzz();
      setFeedback({
        msg: `Cảnh báo: Bạn đang quét ô ${scannedBin}, trong khi thuật toán chỉ định ô ${targetBarcode}!`,
        type: 'error',
      });
      return;
    }

    const quantityToPlace = placedQty > 0 ? Math.min(placedQty, activeTask.qty) : activeTask.qty;
    const isPartial = quantityToPlace < activeTask.qty;

    if (activeTask.orderId && activeTask.productId && activeTask.suggestedLocation) {
      try {
        await operatorService.executePutaway({
          orderId: activeTask.orderId,
          orderItemId: activeTask.orderItemId,
          productId: activeTask.productId,
          locationId: activeTask.suggestedLocation.id,
          quantity: quantityToPlace,
          expectedStockedQty: activeTask.stockedQty,
          batchNumber: activeTask.batchNumber,
          expiryDate: activeTask.expiryDate,
        });
      } catch (err: any) {
        setFeedback({ msg: err.response?.data?.message || 'Chưa ghi nhận cất kệ.', type: 'error' });
        setActiveTask(null);
        await fetchReceivedOrders();
        return;
      }
    } else return;

    soundEffects.playCompleteChime();

    if (isPartial) {
      const remainingQty = activeTask.qty - quantityToPlace;
      const updatedTask: ActivePutawayTask = {
        ...activeTask,
        qty: remainingQty,
        stockedQty: activeTask.stockedQty + quantityToPlace,
        weightKg: Math.round((activeTask.weightKg / activeTask.qty) * remainingQty),
        status: 'PENDING',
        suggestedLocation: undefined,
      };

      setStagingQueue((prev) =>
        prev.map((t) => (t.id === activeTask.id ? updatedTask : t))
      );
      setFeedback({
        msg: `Đã cất ${quantityToPlace} ${activeTask.unit || 'thùng'} vào ô ${targetBarcode}! Còn lại ${remainingQty} ${activeTask.unit || 'thùng'} - Đang tìm ô kệ tiếp theo...`,
        type: 'success',
      });
      setScannedBin('');
      setTimeout(() => handleRequestSuggestion(updatedTask), 800);
    } else {
      setStagingQueue((prev) =>
        prev.map((t) => (t.id === activeTask.id ? { ...t, status: 'COMPLETED' } : t))
      );
      setFeedback({
        msg: `Thành công: Đã hoàn tất cất toàn bộ ${quantityToPlace} ${activeTask.unit || 'thùng'} ${activeTask.productName} vào ô ${targetBarcode}!`,
        type: 'success',
      });
      setActiveTask(null);
      setScannedBin('');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const pendingQueue = stagingQueue.filter((t) => t.status !== 'COMPLETED');
  const completedQueue = stagingQueue.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Cất Hàng Lên Ô Kệ (Put-Away)
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReceivedOrders}
            disabled={loading}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
            {pendingQueue.length} KIỆN
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium shadow-2xs animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <span className="w-4 h-4 flex-shrink-0 text-rose-600 font-bold">!</span>
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Active Putaway Action Card */}
      <div id="putaway-active-card-anchor" className="scroll-mt-4" />
      {activeTask && activeTask.suggestedLocation && (
        <PutawayActiveTaskCard
          activeTask={activeTask}
          scannedBin={scannedBin}
          onChangeScannedBin={setScannedBin}
          placedQty={placedQty}
          onChangePlacedQty={setPlacedQty}
          onOpenScanner={onOpenScanner}
          onRequestAlternate={handleRequestAlternate}
          onCancel={() => setActiveTask(null)}
          onConfirm={handleConfirmPlacement}
        />
      )}

      {/* List of Pending Putaway Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Kiện Hàng Chờ Cất Tại Khu Đệm ({pendingQueue.length})
          </span>
        </div>

        {pendingQueue.length === 0 && completedQueue.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Khu đệm Staging đang trống</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Chưa có kiện hàng nào chờ cất kệ tại khu đệm Staging.
            </p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${isCompact ? '' : 'md:grid-cols-2'} gap-3`}>
            {pendingQueue.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-2xs font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {task.orderCode || 'ĐƠN PO'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {task.preferredZone === 'ZONE_B' ? 'Khu B • Hàng Mát & Đồ Uống' : 'Khu A • Hàng Tiêu Dùng & Hóa Mỹ Phẩm'}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm leading-snug">{task.productName}</div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-mono pt-0.5">
                      <span>SKU: <strong className="text-slate-800">{task.sku}</strong></span>
                      <span>• Số lượng: <strong className="text-indigo-700">{task.qty} {task.unit}</strong></span>
                      <span>• Trọng tải: <strong>{task.weightKg}kg</strong></span>
                      {task.batchNumber && <span>• Lô: <strong>{task.batchNumber}</strong></span>}
                      {task.expiryDate && (
                        <span>• HSD: <strong>{new Date(task.expiryDate).toLocaleDateString('vi-VN')}</strong></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleRequestSuggestion(task)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>Gợi Ý Vị Trí Cất Tối Ưu</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {completedQueue.length > 0 && (
          <div className="pt-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
              Đã Cất Xong ({completedQueue.length})
            </span>
            <div className="mt-2 space-y-2">
              {completedQueue.map((cq) => (
                <div key={cq.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">{cq.productName}</span>
                    <span className="text-slate-500 font-mono">({cq.qty} {cq.unit})</span>
                  </div>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-2xs">
                    ĐÃ LÊN KỆ AN TOÀN
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
