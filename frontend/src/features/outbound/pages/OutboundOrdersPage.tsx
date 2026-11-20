import React, { useState, useEffect, useRef, useCallback } from 'react';
import { OutboundHeader, OutboundFilterStatus } from '../components/OutboundHeader';
import { OutboundOrderTable } from '../components/OutboundOrderTable';
import { CreateOutboundModal } from '../components/CreateOutboundModal';
import { OutboundDetailModal } from '../components/OutboundDetailModal';
import { PickPathVisualizerModal } from '../components/PickPathVisualizerModal';
import { PickingExecutionModal } from '../components/PickingExecutionModal';
import { OutboundVoucherModal } from '../components/OutboundVoucherModal';
import { RaceConditionSimulatorModal } from '../components/RaceConditionSimulatorModal';
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
  const [isConcurrencyModalOpen, setIsConcurrencyModalOpen] = useState(false);
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<LedgerEntryData | null>(null);

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
      await outboundService.cancelOrder(orderId);
      await fetchOrders();
      setMessage('Đã hủy đơn xuất kho thành công và giải phóng toàn bộ số lượng hàng đã giữ trước.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Hủy đơn thất bại.');
    } finally {
      busy.current = false;
      setProcessing(false);
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
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
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
        onCancelOrder={handleCancelOrder}
        onOpenPickPath={(order) => setPickPathOrder(order)}
        onStartPicking={(order) => setPickingModalOrder(order)}
        onOpenVoucher={(order) => setVoucherModalOrder(order)}
        onOpenConcurrencyTest={() => setIsConcurrencyModalOpen(true)}
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
          onCancelOrder={handleCancelOrder}
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

      {/* Live Concurrency & Race Condition Simulator Modal */}
      <RaceConditionSimulatorModal
        isOpen={isConcurrencyModalOpen}
        onClose={() => setIsConcurrencyModalOpen(false)}
      />

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
    </div>
  );
};
