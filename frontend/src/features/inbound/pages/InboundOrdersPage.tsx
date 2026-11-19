import React, { useState, useEffect } from 'react';
import { InboundHeader } from '../components/InboundHeader';
import { InboundOrderList } from '../components/InboundOrderList';
import { CreatePoModal } from '../components/CreatePoModal';
import { InboundDetailModal } from '../components/InboundDetailModal';
import { InboundOrder } from '../types';
import { inboundService } from '../services/inboundService';

export const InboundOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<InboundOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InboundOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  useEffect(() => {
    inboundService.getInboundOrders().then(setOrders).catch(() =>
      setError('Không tải được đơn nhập từ backend.'));
  }, []);

  const handleCreateOrder = async (newOrder: InboundOrder) => {
    try {
      setError(null);
      await inboundService.createInboundOrder(newOrder);
      setOrders(await inboundService.getInboundOrders());
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể tạo đơn nhập kho');
      throw err;
    }
  };

  const handleAdvanceStatus = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || busyOrderId) return;

    setBusyOrderId(orderId);
    setError(null);
    try {
      if (targetOrder.status === 'PENDING') {
        await inboundService.receiveOrder(orderId);
      } else if (targetOrder.status === 'RECEIVED') {
        for (const item of targetOrder.items) {
          if (item.productBatchId != null) continue;
          if (!item.productId || !Number.isFinite(Number(item.id))) {
            throw new Error(`Dòng hàng ${item.sku} thiếu mã sản phẩm hoặc mã dòng đơn`);
          }
          await inboundService.executePutaway({
            orderId: Number(targetOrder.id),
            orderItemId: Number(item.id),
            productId: item.productId,
            locationId: item.productId === 1 ? 5 : 1,
            quantity: item.receivedQty || item.expectedQty,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate || undefined,
          });
        }
      }
      setOrders(await inboundService.getInboundOrders());
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể cập nhật đơn nhập kho');
      try {
        setOrders(await inboundService.getInboundOrders());
      } catch {
        // Keep the previous list if refreshing fails after a write error.
      }
    } finally {
      setBusyOrderId(null);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {/* Header with Metrics */}
      <InboundHeader
        orders={orders}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Orders Table */}
      <InboundOrderList
        orders={orders}
        busyOrderId={busyOrderId}
        onSelectOrder={(order) => setSelectedOrder(order)}
        onAdvanceStatus={handleAdvanceStatus}
      />

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreatePoModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <InboundDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
