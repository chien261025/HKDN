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

  useEffect(() => {
    inboundService.getInboundOrders().then(setOrders);
  }, []);

  const handleCreateOrder = async (newOrder: InboundOrder) => {
    const saved = await inboundService.createInboundOrder(newOrder);
    setOrders((prev) => [saved, ...prev]);
  };

  const handleAdvanceStatus = async (orderId: string) => {
    await inboundService.receiveOrder(orderId);
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;

        if (order.status === 'PENDING') {
          return {
            ...order,
            status: 'RECEIVED',
            items: order.items.map((it) => ({
              ...it,
              receivedQty: it.expectedQty,
              batchNumber: `BATCH-${it.sku.slice(-4)}-${Date.now().toString().slice(-3)}`,
              expiryDate: '2026-12-30',
            })),
          };
        } else if (order.status === 'RECEIVED') {
          return {
            ...order,
            status: 'STOCKED',
            items: order.items.map((it) => ({
              ...it,
              stockedQty: it.receivedQty,
              putawayLocation: 'ZA-A01-R01-S01-B02',
            })),
          };
        }
        return order;
      })
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header with Metrics */}
      <InboundHeader
        orders={orders}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Orders Table */}
      <InboundOrderList
        orders={orders}
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
