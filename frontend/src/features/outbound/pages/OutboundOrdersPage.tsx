import React, { useState, useEffect } from 'react';
import { OutboundHeader } from '../components/OutboundHeader';
import { OutboundOrderTable } from '../components/OutboundOrderTable';
import { CreateOutboundModal } from '../components/CreateOutboundModal';
import { OutboundDetailModal } from '../components/OutboundDetailModal';
import { OutboundOrder } from '../types';
import { outboundService } from '../services/outboundService';

export const OutboundOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);

  useEffect(() => {
    outboundService.getOutboundOrders().then(setOrders);
  }, []);

  const handleCreateOrder = async (newOrder: OutboundOrder) => {
    const saved = await outboundService.createOutboundOrder(newOrder);
    setOrders((prev) => [saved, ...prev]);
  };

  const handleAllocateAndLock = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        const generatedLockId = `LOCK-TX-${Math.floor(10000 + Math.random() * 90000)}`;

        return {
          ...order,
          status: 'ALLOCATED',
          lockId: generatedLockId,
          items: order.items.map((it) => ({
            ...it,
            allocatedQty: it.requestedQty,
            allocations: [
              {
                batchNumber: 'BATCH-MILK-26A',
                expiryDate: '2026-09-25',
                locationBarcode: 'ZB-B01-R01-S01-B05',
                qtyAllocated: it.requestedQty,
                isNearestExpiry: true,
              },
            ],
          })),
        };
      })
    );
  };

  const handleDispatchOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          status: 'DISPATCHED',
          items: order.items.map((it) => ({
            ...it,
            pickedQty: it.requestedQty,
          })),
        };
      })
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <OutboundHeader
        orders={orders}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Orders Table */}
      <OutboundOrderTable
        orders={orders}
        onSelectOrder={(order) => setSelectedOrder(order)}
        onAllocateAndLock={handleAllocateAndLock}
        onDispatchOrder={handleDispatchOrder}
      />

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateOutboundModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreateOrder={handleCreateOrder}
        />
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <OutboundDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
};
