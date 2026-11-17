import React, { useState, useEffect, useCallback } from 'react';
import { PackageCheck, CheckCircle2, ScanLine, RefreshCw, Truck, AlertCircle } from 'lucide-react';
import { operatorService, OutboundOrderDto, PickListItemResponseDto } from '../../services/operatorService';
import { PickingOrderSelector } from './PickingOrderSelector';
import { PickingStepCard } from './PickingStepCard';
import { soundEffects } from '../../utils/soundEffects';

interface PickingFefoTabProps {
  onOpenScanner: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
}

export const PickingFefoTab: React.FC<PickingFefoTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
}) => {
  const [orders, setOrders] = useState<OutboundOrderDto[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrderDto | null>(null);
  const [pickSteps, setPickSteps] = useState<PickListItemResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const handleSelectOrder = async (order: OutboundOrderDto) => {
    setSelectedOrder(order);
    setPickSteps([]);
    setNotice(null);

    if (order.items && order.items.length > 0) {
      setLoading(true);
      try {
        const allSteps: PickListItemResponseDto[] = [];
        for (const item of order.items) {
          const qty = item.requestedQty || 1;
          const steps = await operatorService.getFefoPickList(item.productId, qty);
          allSteps.push(...steps);
        }
        setPickSteps(allSteps.map((s, idx) => ({ ...s, stepOrder: idx + 1, picked: false })));
        if (allSteps.length > 0) {
          setNotice({
            msg: `FEFO đã chỉ định ${allSteps.length} bước lấy hàng ưu tiên date cận hạn nhất.`,
            type: 'success',
          });
        } else {
          setNotice({
            msg: `Kho hiện không đủ tồn kho khả dụng để phân bổ FEFO cho đơn hàng này.`,
            type: 'error',
          });
        }
      } catch (err: any) {
        setNotice({
          msg: 'Lỗi phân bổ FEFO: ' + (err.response?.data?.message || err.message),
          type: 'error',
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const orderList = await operatorService.getOutboundOrders();
      setOrders(orderList);

      const pendingList = orderList.filter((o) => o.status !== 'DISPATCHED' && o.status !== 'SHIPPED');
      if (pendingList.length > 0) {
        const target =
          selectedOrder && pendingList.some((o) => o.id === selectedOrder.id)
            ? pendingList.find((o) => o.id === selectedOrder.id)!
            : pendingList[0];
        await handleSelectOrder(target);
      } else {
        setSelectedOrder(null);
        setPickSteps([]);
      }
    } catch (err: any) {
      setNotice({ msg: 'Lỗi tải đơn xuất kho: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (scannedCode) {
      const matchedIdx = pickSteps.findIndex(
        (s) => !s.picked && (s.binBarcode === scannedCode || s.productSku === scannedCode)
      );

      if (matchedIdx !== -1) {
        soundEffects.playSuccessBeep();
        const updated = [...pickSteps];
        updated[matchedIdx].picked = true;
        setPickSteps(updated);
        setNotice({
          msg: `[PDA] Quét khớp ô ${scannedCode}! Đã xác nhận nhặt ${updated[matchedIdx].pickQty} sản phẩm.`,
          type: 'success',
        });
      } else {
        soundEffects.playErrorBuzz();
        setNotice({
          msg: `[PDA] Đã quét mã: ${scannedCode}. Không khớp với ô kệ hoặc sản phẩm của bước cần nhặt.`,
          type: 'error',
        });
      }
      onClearScannedCode?.();
    }
  }, [scannedCode, pickSteps, onClearScannedCode]);

  const handleConfirmStep = (index: number) => {
    soundEffects.playSuccessBeep();
    const updated = [...pickSteps];
    updated[index].picked = true;
    setPickSteps(updated);
    setNotice({
      msg: `Đã nhặt xong ${updated[index].pickQty} cái tại ô ${updated[index].binBarcode} (Lô ${updated[index].batchNumber})!`,
      type: 'success',
    });
    setTimeout(() => setNotice(null), 3000);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedOrder) return;
    setDispatching(true);
    setNotice(null);
    try {
      await operatorService.confirmDispatchOrder(selectedOrder.id);
      soundEffects.playCompleteChime();
      setSelectedOrder({ ...selectedOrder, status: 'DISPATCHED' });
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: 'DISPATCHED' } : o))
      );
      setNotice({
        msg: `Thành công: Đơn xuất ${selectedOrder.orderCode} đã hoàn tất kiểm đếm và bàn giao vận chuyển (DISPATCHED)!`,
        type: 'success',
      });
      setPickSteps([]);
      // Reload remaining orders
      setTimeout(() => loadData(), 2000);
    } catch (err: any) {
      soundEffects.playErrorBuzz();
      setNotice({ msg: 'Lỗi xuất kho: ' + (err.response?.data?.message || err.message), type: 'error' });
    } finally {
      setDispatching(false);
    }
  };

  const allStepsPicked = pickSteps.length > 0 && pickSteps.every((s) => s.picked);

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              3. Nhặt Hàng Xuất Kho (FEFO Picking)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Lấy hàng theo lộ trình ô kệ tối ưu & date cũ nhất</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          title="Làm mới danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2 font-medium shadow-2xs animate-in fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          )}
          <span>{notice.msg}</span>
        </div>
      )}

      {/* Selector of Active Pending Orders Only */}
      <PickingOrderSelector
        orders={orders}
        selectedOrder={selectedOrder}
        onSelectOrder={handleSelectOrder}
      />

      {/* Active Pick Wave Steps */}
      {selectedOrder && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lộ Trình Nhặt FEFO: {selectedOrder.orderCode}
            </span>
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5" />
              <span>Quét Barcode</span>
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <RefreshCw className="w-8 h-8 text-indigo-500 mx-auto animate-spin" />
              <p className="font-bold text-slate-800">Đang phân tích tồn kho FEFO theo date cận hạn...</p>
              <p className="text-slate-400">Tự động sinh các bước lấy hàng tại các ô kệ</p>
            </div>
          ) : pickSteps.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <PackageCheck className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
              <p className="font-bold text-slate-800">
                {selectedOrder.status === 'DISPATCHED'
                  ? 'Đơn hàng này đã hoàn tất xuất kho và bàn giao vận chuyển!'
                  : 'Không có vị trí nhặt hàng. Kho không đủ tồn kho khả dụng để phân bổ FEFO cho đơn này.'}
              </p>
            </div>
          ) : (
            pickSteps.map((step, idx) => (
              <PickingStepCard
                key={idx}
                step={step}
                index={idx}
                onConfirmStep={handleConfirmStep}
              />
            ))
          )}

          {allStepsPicked && selectedOrder.status !== 'DISPATCHED' && (
            <div className="pt-2 animate-in fade-in">
              <button
                type="button"
                disabled={dispatching}
                onClick={handleConfirmDispatch}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                {dispatching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                <span>Xác Nhận Xuất Kho & Bàn Giao Vận Chuyển (Dispatch)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
