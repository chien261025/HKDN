import React, { useState, useEffect } from 'react';
import { PackageCheck, CheckCircle2, ScanLine, MapPin, Calendar, Clock, ArrowRight, RefreshCw, Truck, AlertCircle } from 'lucide-react';
import { operatorService, OutboundOrderDto, PickListItemResponseDto, ProductDto } from '../../services/operatorService';

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
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrderDto | null>(null);
  const [pickSteps, setPickSteps] = useState<PickListItemResponseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [notice, setNotice] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orderList, prodList] = await Promise.all([
        operatorService.getOutboundOrders(),
        operatorService.getProducts(),
      ]);
      setOrders(orderList);
      setProducts(prodList);
      // Nếu chưa chọn đơn, tự động chọn đơn PENDING đầu tiên
      if (!selectedOrder && orderList.length > 0) {
        const firstPending = orderList.find((o) => o.status !== 'DISPATCHED') || orderList[0];
        setSelectedOrder(firstPending);
      }
    } catch (err: any) {
      setNotice({ msg: 'Lỗi tải đơn xuất kho: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Khi chọn một đơn SO, tự động tính lộ trình FEFO cho mặt hàng đầu tiên trong đơn
  const handleSelectOrder = async (order: OutboundOrderDto) => {
    setSelectedOrder(order);
    setPickSteps([]);
    setNotice(null);

    if (order.items && order.items.length > 0) {
      setLoading(true);
      try {
        const item = order.items[0];
        const steps = await operatorService.getFefoPickList(item.productId, item.requestedQty);
        setPickSteps(steps.map((s) => ({ ...s, picked: false })));
        setNotice({
          msg: `Đã kích hoạt thuật toán FEFO: Gợi ý ${steps.length} vị trí lấy hàng ưu tiên date cũ nhất.`,
          type: 'success',
        });
      } catch (err: any) {
        setNotice({ msg: 'Lỗi chạy thuật toán FEFO: ' + err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  // Xử lý khi quét mã vạch bằng camera hoặc máy quét PDA
  useEffect(() => {
    if (scannedCode) {
      // Tìm bước có binBarcode trùng với mã vừa quét
      const matchedIdx = pickSteps.findIndex(
        (s) => !s.picked && (s.binBarcode === scannedCode || s.productSku === scannedCode)
      );

      if (matchedIdx !== -1) {
        const updated = [...pickSteps];
        updated[matchedIdx].picked = true;
        setPickSteps(updated);
        setNotice({
          msg: `[PDA] Quét khớp ô ${scannedCode}! Đã xác nhận nhặt ${updated[matchedIdx].pickQty} sản phẩm.`,
          type: 'success',
        });
      } else {
        setNotice({
          msg: `[PDA] Đã quét mã: ${scannedCode}. Không khớp với ô kệ hoặc sản phẩm cần nhặt hiện tại.`,
          type: 'error',
        });
      }
      onClearScannedCode?.();
    }
  }, [scannedCode, pickSteps, onClearScannedCode]);

  // Xác nhận nhặt từng bước
  const handleConfirmStep = (index: number) => {
    const updated = [...pickSteps];
    updated[index].picked = true;
    setPickSteps(updated);
    setNotice({
      msg: `Đã nhặt thành công ${updated[index].pickQty} cái tại ô ${updated[index].binBarcode} (Lô ${updated[index].batchNumber})!`,
      type: 'success',
    });
    setTimeout(() => setNotice(null), 3000);
  };

  // Xác nhận xuất kho và bàn giao vận chuyển (DISPATCH)
  const handleConfirmDispatch = async () => {
    if (!selectedOrder) return;
    setDispatching(true);
    setNotice(null);
    try {
      await operatorService.confirmDispatchOrder(selectedOrder.id);
      setSelectedOrder({ ...selectedOrder, status: 'DISPATCHED' });
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, status: 'DISPATCHED' } : o))
      );
      setNotice({
        msg: `Thành công: Đơn xuất ${selectedOrder.orderCode} đã hoàn tất kiểm đếm và bàn giao cho đơn vị vận chuyển (DISPATCHED)!`,
        type: 'success',
      });
      setPickSteps([]);
    } catch (err: any) {
      setNotice({ msg: 'Lỗi xuất kho: ' + err.message, type: 'error' });
    } finally {
      setDispatching(false);
    }
  };

  const pendingOrders = orders.filter((o) => o.status !== 'DISPATCHED');
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
            <p className="text-xs text-slate-500 font-medium">Thuật toán ưu tiên lô cận HSD xuất trước</p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          title="Làm mới danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Thông báo phản hồi */}
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

      {/* Chọn đơn hàng xuất SO */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase">Chọn Đơn Xuất Kho (SO)</span>
          <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
            {pendingOrders.length} ĐƠN CHỜ
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {orders.slice(0, 4).map((o) => (
            <button
              key={o.id}
              onClick={() => handleSelectOrder(o)}
              className={`p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                selectedOrder?.id === o.id
                  ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-100'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <div className="font-mono font-bold text-slate-900">{o.orderCode}</div>
              <div className="text-xs text-slate-500 mt-0.5 truncate">{o.customerName || 'Khách hàng'}</div>
              <div className="mt-1 flex items-center justify-between">
                <span className={`text-2xs font-bold px-1.5 py-0.5 rounded ${
                  o.status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {o.status}
                </span>
                <span className="text-2xs text-slate-400 font-mono">
                  {o.items?.length || 0} món
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chi tiết lộ trình FEFO */}
      {selectedOrder && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Lộ Trình Nhặt Hàng FEFO: {selectedOrder.orderCode}
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

          {pickSteps.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-xs text-slate-500 space-y-2">
              <PackageCheck className="w-8 h-8 text-amber-500 mx-auto opacity-70" />
              <p className="font-bold text-slate-800">
                {selectedOrder.status === 'DISPATCHED'
                  ? 'Đơn hàng này đã được xuất kho và bàn giao vận chuyển thành công!'
                  : 'Bấm nút dưới đây để kích hoạt thuật toán sinh danh sách nhặt FEFO:'}
              </p>
              {selectedOrder.status !== 'DISPATCHED' && (
                <button
                  onClick={() => handleSelectOrder(selectedOrder)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
                >
                  Sinh Lộ Trình Nhặt FEFO
                </button>
              )}
            </div>
          ) : (
            pickSteps.map((step, idx) => (
              <div
                key={idx}
                className={`rounded-2xl p-4 border transition-all shadow-xs ${
                  step.picked
                    ? 'bg-slate-50 border-slate-200 opacity-70'
                    : 'bg-white border-amber-300 ring-2 ring-amber-50'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                  <span className="font-mono font-bold text-amber-800">
                    Bước {step.stepOrder || idx + 1}: Di chuyển đến ô kệ
                  </span>
                  <span className="text-xs font-mono text-slate-500 font-medium">
                    Cần lấy: <strong className="text-indigo-700 text-sm font-bold">{step.pickQty}</strong> cái
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-2xs font-mono text-slate-500 uppercase">Vị trí ô kệ:</div>
                    <div className="font-mono text-sm font-black text-indigo-700 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      {step.binBarcode}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xs font-mono text-slate-500 uppercase">Hạn dùng (FEFO):</div>
                    <div className="text-xs font-mono font-bold text-rose-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {step.expiryDate}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5 text-xs">
                  <div className="font-bold text-slate-900">{step.productName || 'Sản phẩm chỉ định'}</div>
                  <div className="text-2xs font-mono text-slate-500 mt-0.5">
                    Lô: <strong className="text-amber-800">{step.batchNumber}</strong>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  {step.picked ? (
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>ĐÃ NHẶT XONG {step.pickQty} CÁI</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleConfirmStep(idx)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <ScanLine className="w-4 h-4" />
                      <span>Xác Nhận Đã Nhặt Bước {idx + 1}</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Nút Xuất Kho Bàn Giao Vận Chuyển khi đã nhặt xong */}
          {allStepsPicked && selectedOrder.status !== 'DISPATCHED' && (
            <div className="pt-2 animate-in fade-in">
              <button
                type="button"
                disabled={dispatching}
                onClick={handleConfirmDispatch}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                {dispatching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Truck className="w-4 h-4" />
                )}
                <span>Xác Nhận Xuất Kho & Bàn Giao Vận Chuyển (Dispatch)</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
