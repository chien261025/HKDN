import React, { useState, useEffect } from 'react';
import { InboundHeader, InboundFilterStatus } from '../components/InboundHeader';
import { InboundOrderList } from '../components/InboundOrderList';
import { CreatePoModal } from '../components/CreatePoModal';
import { InboundDetailModal } from '../components/InboundDetailModal';
import { ReceiveQcModal } from '../components/ReceiveQcModal';
import { PutawayExecutionModal } from '../components/PutawayExecutionModal';
import { InboundVoucherModal } from '../components/InboundVoucherModal';
import { InboundOrder, ReceiptLine } from '../types';
import { inboundService } from '../services/inboundService';
import { warehouseService } from '../../masterdata/services/warehouseService';

export const InboundOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<InboundOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InboundOrder | null>(null);
  const [receivingOrder, setReceivingOrder] = useState<InboundOrder | null>(null);
  const [putawayOrder, setPutawayOrder] = useState<InboundOrder | null>(null);
  const [voucherOrder, setVoucherOrder] = useState<InboundOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  // Bộ lọc trạng thái đồng bộ giữa KPI Cards và danh sách đơn PO
  const [activeStatus, setActiveStatus] = useState<InboundFilterStatus>('ALL');

  // Bộ lọc kho đồng bộ
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(() => {
    return warehouseService.getActiveWarehouseId() || 'ALL';
  });

  const getTargetWhId = (whStr?: string | number): number | undefined => {
    if (!whStr || whStr === 'ALL') return undefined;
    const match = String(whStr).match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  };

  const loadOrders = async (explicitWhId?: number | null) => {
    try {
      const whToUse = explicitWhId !== undefined
        ? (explicitWhId === null ? undefined : explicitWhId)
        : getTargetWhId(selectedWarehouse);
      const data = await inboundService.getInboundOrders(whToUse);
      setOrders(data);
    } catch {
      setError('Không tải được danh sách đơn nhập kho từ backend.');
    }
  };

  useEffect(() => {
    const activeWh = warehouseService.getActiveWarehouseId() || 'ALL';
    setSelectedWarehouse(activeWh);
    const targetWh = getTargetWhId(activeWh);
    loadOrders(targetWh === undefined ? null : targetWh);

    const handleWhChange = (e: any) => {
      const newWh = e.detail || warehouseService.getActiveWarehouseId() || 'ALL';
      setSelectedWarehouse(newWh);
      const newTarget = getTargetWhId(newWh);
      loadOrders(newTarget === undefined ? null : newTarget);
    };

    window.addEventListener('smart_wms_warehouse_changed', handleWhChange);
    return () => {
      window.removeEventListener('smart_wms_warehouse_changed', handleWhChange);
    };
  }, []);

  const handleWarehouseChange = (whIdStr: string) => {
    setSelectedWarehouse(whIdStr);
    warehouseService.setActiveWarehouseId(whIdStr);
    const targetWh = getTargetWhId(whIdStr);
    loadOrders(targetWh === undefined ? null : targetWh);
  };

  const handleCreateOrder = async (newOrder: InboundOrder) => {
    try {
      setError(null);
      await inboundService.createInboundOrder(newOrder);
      await loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tạo đơn nhập kho');
      throw err;
    }
  };

  const handleConfirmReceive = async (
    orderId: string,
    itemUpdates: ReceiptLine[]
  ) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await inboundService.receiveOrder(orderId, itemUpdates);
      await loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi tiếp nhận đơn hàng');
      throw err;
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleConfirmPutaway = async (
    orderId: string,
    assign: {
      orderItemId: number;
      productId: number;
      locationId: number;
      quantity: number;
      expectedStockedQty: number;
      batchNumber?: string;
      expiryDate?: string;
    }
  ) => {
    setBusyOrderId(orderId);
    setError(null);
    try {
      await inboundService.executePutaway({ orderId: Number(orderId), ...assign });
      await loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi cất hàng lên kệ');
      throw err;
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleCloseOrder = async (order: InboundOrder) => {
    const confirmed = window.confirm(
      `Xác nhận đóng đơn ${order.poCode} và hủy/từ chối nhận phần hàng thừa chưa cất kệ do vượt sức chứa kho?`
    );
    if (!confirmed) return;
    setBusyOrderId(order.id);
    try {
      await inboundService.closeOrder(order.id, 'Vượt quá sức chứa kho / Đặt nhầm');
      await loadOrders();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Lỗi khi đóng đơn');
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Header with Interactive KPI Filter Cards & Synchronized Warehouse Selector */}
      <InboundHeader
        orders={orders}
        selectedWarehouse={selectedWarehouse}
        activeStatus={activeStatus}
        onStatusChange={(status) => setActiveStatus(status)}
        onWarehouseChange={handleWarehouseChange}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Orders Table with QC badges, Date Filter & Accordion Drill-down */}
      <InboundOrderList
        orders={orders}
        activeStatus={activeStatus}
        onStatusChange={(status) => setActiveStatus(status)}
        busyOrderId={busyOrderId}
        onSelectOrder={(order) => setSelectedOrder(order)}
        onReceiveClick={(order) => setReceivingOrder(order)}
        onPutawayClick={(order) => setPutawayOrder(order)}
        onCloseOrder={handleCloseOrder}
        onPrintVoucher={(order) => setVoucherOrder(order)}
      />

      {/* Create PO Modal */}
      {isCreateModalOpen && (
        <CreatePoModal
          initialWarehouseId={selectedWarehouse}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {/* Receiving & QC Modal (Bước 2, 3, 4) */}
      {receivingOrder && (
        <ReceiveQcModal
          order={receivingOrder}
          onClose={() => setReceivingOrder(null)}
          onConfirmReceive={handleConfirmReceive}
        />
      )}

      {/* Putaway Execution Modal (Bước 5, 6) */}
      {putawayOrder && (
        <PutawayExecutionModal
          order={putawayOrder}
          onClose={() => setPutawayOrder(null)}
          onConfirmPutaway={handleConfirmPutaway}
        />
      )}

      {/* Inbound Detail Modal */}
      {selectedOrder && (
        <InboundDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {/* Inbound Voucher Print Modal */}
      {voucherOrder && (
        <InboundVoucherModal
          order={voucherOrder}
          onClose={() => setVoucherOrder(null)}
        />
      )}
    </div>
  );
};
