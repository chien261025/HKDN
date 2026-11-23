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
  isCompact?: boolean;
}

export const PickingFefoTab: React.FC<PickingFefoTabProps> = ({
  onOpenScanner,
  scannedCode,
  onClearScannedCode,
  isCompact,
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
        const hasExistingAllocations = order.items.some(
          (it) => it.allocations && it.allocations.length > 0
        );

        if (hasExistingAllocations) {
          order.items.forEach((item) => {
            (item.allocations || []).forEach((alloc: any) => {
              if (alloc.status !== 'CANCELLED') {
                allSteps.push({
                  productId: alloc.productId || item.productId,
                  productSku: alloc.productSku || item.productSku || ('SKU-' + item.productId),
                  productName: alloc.productName || item.productName || 'Sản phẩm',
                  locationId: alloc.locationId,
                  binBarcode: alloc.locationBarcode,
                  zoneCode: alloc.zoneCode || 'ZONE_A',
                  batchId: alloc.batchId,
                  batchNumber: alloc.batchNumber,
                  expiryDate: alloc.expiryDate,
                  daysUntilExpiry: alloc.daysRemaining,
                  pickQty: alloc.allocatedQty,
                  stepOrder: allSteps.length + 1,
                  picked: alloc.status === 'PICKED',
                });
              }
            });
          });
        }
        setPickSteps(allSteps.map((s, idx) => ({ ...s, stepOrder: idx + 1, picked: s.picked || false })));
        if (allSteps.length === 0) {
          setNotice({
            msg: `Kho hiện không đủ tồn kho khả dụng để phân bổ FEFO cho đơn hàng này.`,
            type: 'error',
          });
        } else {
          setNotice(null);
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
      const code = scannedCode;
      onClearScannedCode?.();

      const matchedIdx = pickSteps.findIndex(
        (s) => !s.picked && (s.binBarcode === code || s.productSku === code)
      );

      if (matchedIdx !== -1) {
        soundEffects.playSuccessBeep();
        const updated = [...pickSteps];
        updated[matchedIdx].picked = true;
        setPickSteps(updated);
        setNotice({
          msg: `[PDA] Quét khớp ô ${code}! Đã xác nhận nhặt ${updated[matchedIdx].pickQty} sản phẩm.`,
          type: 'success',
        });
      } else {
        soundEffects.playErrorBuzz();
        setNotice({
          msg: `[PDA] Đã quét mã: ${code}. Không khớp với ô kệ hoặc sản phẩm của bước cần nhặt.`,
          type: 'error',
        });
      }
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
              Nhiệm Vụ Lấy Hàng (FEFO Picking)
            </h2>
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

      {/* Responsive 2-Column Workstation Layout */}
      <div className={`grid grid-cols-1 ${isCompact ? '' : 'lg:grid-cols-12'} gap-4 items-start`}>
        {/* Cột Trái: Chọn Đơn Xuất Kho Chờ Nhặt */}
        <div className="lg:col-span-5 space-y-3">
          <PickingOrderSelector
            orders={orders}
            selectedOrder={selectedOrder}
            onSelectOrder={handleSelectOrder}
          />
        </div>

        {/* Cột Phải: Lộ Trình Nhặt Hàng Chi Tiết (Active Pick Wave Steps) */}
        <div className="lg:col-span-7 space-y-3">
          {selectedOrder ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Lộ Trình Lấy Hàng Ưu Tiên Date: {selectedOrder.orderCode}
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
                  <p className="font-bold text-slate-800">Đang tải vị trí lấy hàng...</p>
                </div>
              ) : pickSteps.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-amber-200 text-center text-xs text-slate-600 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border border-amber-200">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 text-sm">
                      {selectedOrder.status === 'DISPATCHED'
                        ? 'Đơn hàng đã xuất kho & hoàn tất bàn giao vận chuyển!'
                        : 'Đơn Hàng Chưa Có Lệnh Phân Bổ (Reservation Pending)'}
                    </p>
                    <p className="text-slate-500 text-2xs max-w-sm mx-auto leading-relaxed">
                      {selectedOrder.status === 'DISPATCHED'
                        ? 'Hàng hóa đã rời khỏi khu đệm xuất kho và bàn giao cho đơn vị vận tải.'
                        : 'Quy chuẩn WMS: Nhân viên hiện trường chỉ lấy hàng khi Quản lý kho đã phân bổ tồn kho (Reserved Stock). Vui lòng yêu cầu Quản lý kho phân bổ hoặc bổ sung tồn trước khi lấy hàng.'}
                    </p>
                  </div>
                  {selectedOrder.status !== 'DISPATCHED' && (
                    <div className="pt-1 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playSuccessBeep();
                          alert('Đã gửi thông báo đến Quản Lý Kho: Yêu cầu phân bổ tồn kho FEFO cho đơn xuất ' + selectedOrder.orderCode);
                        }}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Yêu Cầu Quản Lý Kho Phân Bổ</span>
                      </button>
                      <button
                        type="button"
                        onClick={loadData}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                      >
                        Kiểm Tra Lại
                      </button>
                    </div>
                  )}
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
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <PackageCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Chọn đơn xuất kho bên trái để hiển thị lộ trình nhặt hàng</p>
              <p className="text-2xs text-slate-400">Hệ thống sẽ tự động tối ưu hóa lộ trình di chuyển qua các ô kệ theo thứ tự Date hết hạn gần nhất (FEFO).</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
