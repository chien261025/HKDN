import React, { useState, useEffect } from 'react';
import { OutboundHeader } from '../components/OutboundHeader';
import { OutboundOrderTable } from '../components/OutboundOrderTable';
import { CreateOutboundModal } from '../components/CreateOutboundModal';
import { OutboundDetailModal } from '../components/OutboundDetailModal';
import { PickPathVisualizerModal } from '../components/PickPathVisualizerModal';
import { OutboundOrder } from '../types';
import { outboundService } from '../services/outboundService';

export const OutboundOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);
  const [pickPathOrder, setPickPathOrder] = useState<OutboundOrder | null>(null);

  const fetchOrders = async () => {
    const list = await outboundService.getOutboundOrders();
    setOrders(list);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (newOrder: OutboundOrder) => {
    const saved = await outboundService.createOutboundOrder(newOrder);
    if (saved) {
      setOrders((prev) => [saved, ...prev]);
    }
  };

  const handleAllocateAndLock = async (orderId: string) => {
    const success = await outboundService.allocateOrderFefo(orderId);
    if (success) {
      await fetchOrders();
    }
  };

  const handleDispatchOrder = async (orderId: string) => {
    const success = await outboundService.dispatchOrder(orderId);
    if (success) {
      await fetchOrders();
    }
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
        onOpenPickPath={(order) => setPickPathOrder(order)}
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
          onOpenPickPath={(order) => {
            setSelectedOrder(null);
            setPickPathOrder(order);
          }}
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
