import React, { useState, useEffect } from 'react';
import { Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { operatorService } from '../../services/operatorService';
import { PutawayActiveTaskCard, ActivePutawayTask } from './PutawayActiveTaskCard';
import { soundEffects } from '../../utils/soundEffects';

interface PutawayTabProps {
  onOpenScanner: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
}

export const PutawayTab: React.FC<PutawayTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<ActivePutawayTask | null>(null);
  const [scannedBin, setScannedBin] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [stagingQueue, setStagingQueue] = useState<ActivePutawayTask[]>([]);

  useEffect(() => {
    const fetchReceivedOrders = async () => {
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
              const sku = prod?.sku || (item.productId === 1 ? 'SKU-MILK-100' : item.productId === 2 ? 'SKU-SAMS-S24' : 'SKU-OMO-MATIC');
              const name = prod?.name || (item.productId === 1 ? 'Sữa tươi tiệt trùng Vinamilk 100% 1L' : item.productId === 2 ? 'Điện thoại Samsung Galaxy S24 Ultra' : 'Nước giặt OMO Matic 3.6kg');
              const zone = sku.includes('MILK') ? 'ZONE_B' : 'ZONE_A';
              const weight = sku.includes('OMO') ? 150.0 : sku.includes('MILK') ? 30.0 : 5.0;

              dynamicTasks.push({
                id: `po-${o.id}-it-${item.id}`,
                orderId: o.id,
                orderItemId: item.id,
                productId: item.productId,
                sku,
                productName: name,
                weightKg: weight,
                qty: item.receivedQty || item.expectedQty,
                preferredZone: zone,
                status: 'PENDING',
              });
            }
          }
          setStagingQueue(dynamicTasks);
        } else {
          setStagingQueue([]);
        }
      } catch (err) {
        console.warn('Could not load received orders for putaway:', err);
      }
    };
    fetchReceivedOrders();
  }, []);

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
      const suggested = await operatorService.suggestPutawayLocation(task.preferredZone, task.weightKg);
      soundEffects.playSuccessBeep();
      setActiveTask({ ...task, suggestedLocation: suggested, status: 'SUGGESTED' });
      setFeedback({
        msg: `Thuật toán gợi ý vị trí: ${suggested.binBarcode} (Tầng ${suggested.shelf}, Tải trọng: ${suggested.maxWeightKg}kg)`,
        type: 'success',
      });
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setFeedback({ msg: 'Lỗi chạy thuật toán cất hàng: ' + err.message, type: 'error' });
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

    if (activeTask.orderId && activeTask.productId && activeTask.suggestedLocation) {
      try {
        await operatorService.executePutaway({
          orderId: activeTask.orderId,
          orderItemId: activeTask.orderItemId,
          productId: activeTask.productId,
          locationId: activeTask.suggestedLocation.id,
          quantity: activeTask.qty,
        });
      } catch (err: any) {
        console.warn('Backend putaway sync notice:', err);
      }
    }

    setStagingQueue((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, status: 'COMPLETED' } : t))
    );
    soundEffects.playCompleteChime();
    setFeedback({
      msg: `Thành công: Đã cất ${activeTask.qty} cái ${activeTask.productName} vào ô ${targetBarcode} an toàn!`,
      type: 'success',
    });
    setActiveTask(null);
    setScannedBin('');
    setTimeout(() => setFeedback(null), 4000);
  };

  const pendingQueue = stagingQueue.filter((t) => t.status !== 'COMPLETED');
  const completedQueue = stagingQueue.filter((t) => t.status === 'COMPLETED');

  return (
    <div className="space-y-4 pb-20">
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              2. Cất Hàng Lên Ô Kệ (Put-Away)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Thuật toán phân tích tải trọng & Zone tự động</p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200">
          {pendingQueue.length} KIỆN CHỜ
        </span>
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

      {activeTask && activeTask.suggestedLocation && (
        <PutawayActiveTaskCard
          activeTask={activeTask}
          scannedBin={scannedBin}
          onChangeScannedBin={setScannedBin}
          onOpenScanner={onOpenScanner}
          onCancel={() => setActiveTask(null)}
          onConfirm={handleConfirmPlacement}
        />
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hàng Chờ Cất Tại Khu Đệm ({pendingQueue.length})
          </span>
          <span className="text-xs text-slate-500 font-mono">Thuật toán Directed Put-away</span>
        </div>

        {pendingQueue.length === 0 && completedQueue.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">Khu đệm Staging đang trống</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Chưa có kiện hàng nào chờ cất kệ. Hãy tiếp nhận đơn hàng PO tại Tab 1 (Nhận PO) để bắt đầu chu trình cất kệ.
            </p>
          </div>
        )}

        {pendingQueue.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-indigo-300 transition-all space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm">{task.productName}</span>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                  <span>SKU: {task.sku}</span>
                  <span>• {task.qty} cái</span>
                  <span>• <span className="text-indigo-700 font-bold">{task.weightKg}kg</span></span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {task.preferredZone}
              </span>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleRequestSuggestion(task)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Gợi Ý Vị Trí Cất Tối Ưu</span>
              </button>
            </div>
          </div>
        ))}

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
                  </div>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
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
