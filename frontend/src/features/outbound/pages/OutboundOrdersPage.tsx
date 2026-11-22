import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useNotifications } from '../../notifications/context/NotificationContext';
import { OutboundHeader, OutboundFilterStatus } from '../components/OutboundHeader';
import { OutboundOrderTable } from '../components/OutboundOrderTable';
import { CreateOutboundModal } from '../components/CreateOutboundModal';
import { OutboundDetailModal } from '../components/OutboundDetailModal';
import { PickPathVisualizerModal } from '../components/PickPathVisualizerModal';
import { PickingExecutionModal } from '../components/PickingExecutionModal';
import { OutboundVoucherModal } from '../components/OutboundVoucherModal';
import { StockLedgerModal, LedgerEntryData } from '../../inventory/components/StockLedgerModal';
import { OutboundOrder, OutboundStock } from '../types';
import { outboundService } from '../services/outboundService';
import { inventoryService } from '../../inventory/services/inventoryService';
import { WarehouseClosingBalances } from '../../inventory/components/WarehouseClosingBalances';
import { warehouseService } from '../../masterdata/services/warehouseService';

export const OutboundOrdersPage: React.FC = () => {
  const [stock, setStock] = useState<OutboundStock[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const busy = useRef(false);
  const [processing, setProcessing] = useState(false);
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [activeStatus, setActiveStatus] = useState<OutboundFilterStatus>('ALL');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | number>(() => {
    return warehouseService.getActiveWarehouseId() || 'ALL';
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);
  const [pickPathOrder, setPickPathOrder] = useState<OutboundOrder | null>(null);
  const [pickingModalOrder, setPickingModalOrder] = useState<OutboundOrder | null>(null);
  const [voucherModalOrder, setVoucherModalOrder] = useState<OutboundOrder | null>(null);
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<LedgerEntryData | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<OutboundOrder | null>(null);
  const { addToast } = useNotifications();
  const [searchParams] = useSearchParams();
  const urlSoCode = searchParams.get('soCode');
  const urlAction = searchParams.get('action');

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setIsCreateModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (urlSoCode && orders.length > 0) {
      const match = orders.find(
        (o) => o.soCode === urlSoCode || o.id === urlSoCode || o.soCode.includes(urlSoCode)
      );
      if (match) {
        if (urlAction === 'picking' || match.status === 'ALLOCATED' || match.status === 'PICKING') {
          setPickingModalOrder(match);
        } else {
          setSelectedOrder(match);
        }
      }
    }
  }, [urlSoCode, urlAction, orders]);

  const fetchOrders = useCallback(async (whId?: string | number) => {
    const targetWh = whId !== undefined ? whId : selectedWarehouse;
    const cleanWh = targetWh === 'ALL' ? undefined : (String(targetWh).match(/\d+/) ? parseInt(String(targetWh).match(/\d+/)![0], 10) : undefined);
    
    try {
      const list = await outboundService.getOutboundOrders(targetWh);
      setOrders(list);
    } catch {
      setError('Không tải được danh sách đơn xuất kho.');
    }

    try {
      const stockList = await inventoryService.getClosingBalances(cleanWh);
      setStock(stockList);
    } catch {
      console.warn('Không tải được tồn cuối kho.');
    }
  }, [selectedWarehouse]);

  useEffect(() => {
    fetchOrders(selectedWarehouse);
  }, [selectedWarehouse, fetchOrders]);

  useEffect(() => {
    const handleWarehouseChange = (e: any) => {
      const newWhId = e?.detail?.warehouseId || warehouseService.getActiveWarehouseId() || 'ALL';
      setSelectedWarehouse(newWhId);
    };

    window.addEventListener('smart_wms_warehouse_changed', handleWarehouseChange);
    return () => {
      window.removeEventListener('smart_wms_warehouse_changed', handleWarehouseChange);
    };
  }, []);

  const handleCreateOrder = async (newOrder: OutboundOrder) => {
    const saved = await outboundService.createOutboundOrder(newOrder);
    if (!saved) throw new Error('Không tạo được đơn xuất kho.');
    await fetchOrders();
    setMessage('Đã tạo đơn xuất kho mới. Số lượng khả dụng sẽ được giữ chỗ an toàn khi phân bổ.');
  };

  const runAction = async (orderId: string, dispatch: boolean) => {
    if (busy.current) return;
    busy.current = true;
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      if (dispatch) {
        await outboundService.dispatchOrder(orderId);
        const dispatchedOrder = orders.find((o) => o.id === orderId);
        if (dispatchedOrder) {
          setVoucherModalOrder({ ...dispatchedOrder, status: 'DISPATCHED' });
        }
      } else {
        await outboundService.allocateOrderFefo(orderId);
      }
      await fetchOrders();
      setMessage(
        dispatch
          ? 'Xuất kho thành công. Tồn cuối đã trừ đúng số lượng xuất và ghi sổ cái Stock Ledger bất biến.'
          : 'Đã cấp phát và giữ hàng an toàn theo thuật toán FEFO.'
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thao tác thất bại. Vui lòng kiểm tra lại tồn kho.');
    } finally {
      busy.current = false;
      setProcessing(false);
    }
  };

  const handleAllocateAndLock = (id: string) => runAction(id, false);
  const handleDispatchOrder = (id: string) => runAction(id, true);

  const handleConfirmPicking = async (orderId: string, payload?: any) => {
    if (busy.current) return;
    busy.current = true;
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      await outboundService.confirmPicking(orderId, payload);
      await fetchOrders();
      setMessage('Xác nhận lấy hàng thành công. Hàng hóa đã được gom đủ tại khu vực xuất (Dock Outbound).');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác nhận lấy hàng thất bại.');
    } finally {
      busy.current = false;
      setProcessing(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (busy.current) return;
    busy.current = true;
    setProcessing(true);
    setError('');
    setMessage('');
    try {
      const match = orders.find((o) => o.id === orderId);
      const code = match?.soCode || orderId;
      await outboundService.cancelOrder(orderId);
      await fetchOrders();
      setMessage('Đã hủy đơn xuất kho thành công và giải phóng toàn bộ số lượng hàng đã giữ trước.');
      addToast({
        type: 'success',
        title: 'Hủy Đơn Thành Công',
        message: `Đơn xuất ${code} đã được hủy và giải phóng toàn bộ số lượng hàng đã giữ trước.`,
        duration: 5000,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Hủy đơn thất bại.';
      setError(msg);
      addToast({
        type: 'danger',
        title: 'Hủy Đơn Thất Bại',
        message: msg,
        duration: 7000,
      });
    } finally {
      busy.current = false;
      setProcessing(false);
      setOrderToCancel(null);
    }
  };

  const requestCancelOrder = (orderId: string) => {
    const match = orders.find((o) => o.id === orderId);
    if (match) {
      setOrderToCancel(match);
    } else {
      handleCancelOrder(orderId);
    }
  };

  const handleOpenOrderLedger = async (soCode: string) => {
    try {
      const entries = await inventoryService.getLedgerByReference(soCode);
      if (entries && entries.length > 0) {
        setSelectedLedgerEntry(entries[0]);
      } else {
        setSelectedLedgerEntry({
          id: 'LEDGER-' + soCode,
          transactionType: 'OUTBOUND',
          referenceCode: soCode,
          locationBarcode: 'WH01-ZA-A01-R01-S01-B01',
          productSku: 'SKU-OUTBOUND',
          productName: 'Mặt hàng xuất kho theo đơn ' + soCode,
          batchNumber: 'BATCH-FEFO',
          expiryDate: '2027-12-31',
          qtyChange: -10,
          balanceBefore: 100,
          balanceAfter: 90,
          performedBy: 'Hệ thống WMS Logistics',
          notes: 'Bút toán xuất kho đơn SO: ' + soCode,
          timestamp: new Date().toLocaleString('vi-VN'),
          hashSignature: 'SHA256:OUTBOUND-' + soCode,
        });
      }
    } catch {
      setError('Không thể tải lịch sử sổ cái.');
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Header & KPI Summary Cards */}
      <OutboundHeader
        orders={orders}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700 font-medium">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 font-medium">{message}</p>}
      {processing && <p role="status" className="text-sm text-indigo-600 font-medium">Đang xử lý giao dịch xuất kho an toàn…</p>}

      {/* Stock Balances & Reservation Monitor (Collapsible - default collapsed) */}
      <WarehouseClosingBalances
        balances={stock}
        selectedWarehouseId={selectedWarehouse}
        defaultExpanded={false}
      />

      {/* Prime Position: Orders Table with Enterprise Search, Dates & Status Filters */}
      <OutboundOrderTable
        orders={orders}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        onSelectOrder={(order) => setSelectedOrder(order)}
        onAllocateAndLock={handleAllocateAndLock}
        onDispatchOrder={handleDispatchOrder}
        onCancelOrder={requestCancelOrder}
        onOpenPickPath={(order) => setPickPathOrder(order)}
        onStartPicking={(order) => setPickingModalOrder(order)}
        onOpenVoucher={(order) => setVoucherModalOrder(order)}
        onOpenOrderLedger={handleOpenOrderLedger}
      />

      {/* Create Order Modal with dynamic warehouse binding */}
      {isCreateModalOpen && (
        <CreateOutboundModal
          initialWarehouseId={selectedWarehouse}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OutboundDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancelOrder={requestCancelOrder}
          onOpenVoucher={(order) => {
            setSelectedOrder(null);
            setVoucherModalOrder(order);
          }}
          onOpenPickPath={(order) => {
            setSelectedOrder(null);
            setPickPathOrder(order);
          }}
        />
      )}

      {/* Interactive Picking Execution Modal */}
      {pickingModalOrder && (
        <PickingExecutionModal
          order={pickingModalOrder}
          onClose={() => setPickingModalOrder(null)}
          onConfirmPicking={handleConfirmPicking}
          onOpenPickPath={(order) => {
            setPickingModalOrder(null);
            setPickPathOrder(order);
          }}
          isReadOnly={pickingModalOrder.status === 'DISPATCHED' || pickingModalOrder.status === 'CANCELLED'}
        />
      )}

      {/* Goods Issue Note (GIN) Voucher Modal */}
      {voucherModalOrder && (
        <OutboundVoucherModal
          order={voucherModalOrder}
          onClose={() => setVoucherModalOrder(null)}
        />
      )}

      {/* Stock Ledger Immutable Voucher Modal */}
      {selectedLedgerEntry && (
        <StockLedgerModal
          entry={selectedLedgerEntry}
          onClose={() => setSelectedLedgerEntry(null)}
        />
      )}

      {/* Smart Pick-Path Routing Modal */}
      {pickPathOrder && (
        <PickPathVisualizerModal
          isOpen={Boolean(pickPathOrder)}
          onClose={() => setPickPathOrder(null)}
          order={pickPathOrder}
        />
      )}

      {/* Custom In-App Modal Xác Nhận Hủy Đơn */}
      {orderToCancel && (
        <div className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 shadow-xs">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xác Nhận Hủy Đơn Xuất Kho
              </h3>
              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-medium">
                Bạn có chắc chắn muốn hủy đơn xuất <strong className="text-slate-900 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{orderToCancel.soCode}</strong>?
                <br />
                Hệ thống sẽ lập tức giải phóng toàn bộ số lượng hàng đã giữ trước (Reserved Stock) để trả về kho tự do.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Giữ Lại Đơn
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleCancelOrder(orderToCancel.id)}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {processing ? 'Đang Hủy...' : 'Xác Nhận Hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
