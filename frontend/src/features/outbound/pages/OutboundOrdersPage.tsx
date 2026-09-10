import React, { useState } from 'react';
import { OutboundHeader } from '../components/OutboundHeader';
import { OutboundOrderTable } from '../components/OutboundOrderTable';
import { CreateOutboundModal } from '../components/CreateOutboundModal';
import { OutboundDetailModal } from '../components/OutboundDetailModal';
import { OutboundOrder } from '../types';

export const OutboundOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<OutboundOrder[]>([
    {
      id: 'so-01',
      soCode: 'SO-2026-888',
      customerName: 'Chuỗi Siêu Thị WinMart+ (Miền Bắc)',
      shippingAddress: 'Kho Tổng VinCommerce, KCN Quang Minh, Mê Linh, Hà Nội',
      orderDate: 'Hôm nay, 08:00',
      requiredDate: '2026-09-11',
      priority: 'HIGH',
      status: 'ALLOCATED',
      lockId: 'LOCK-TX-99824',
      notes: 'Xuất ưu tiên hàng date ngắn theo FEFO. Xe tải lấy hàng lúc 15:00.',
      items: [
        {
          id: 'item-1',
          sku: 'SKU-MILK-100',
          productName: 'Sữa tươi Vinamilk 100% 1L',
          requestedQty: 20,
          allocatedQty: 20,
          pickedQty: 0,
          unit: 'Thùng',
          allocations: [
            {
              batchNumber: 'BATCH-MILK-26A',
              expiryDate: '2026-09-25',
              locationBarcode: 'ZB-B01-R01-S01-B05',
              qtyAllocated: 20,
              isNearestExpiry: true,
            },
          ],
        },
        {
          id: 'item-2',
          sku: 'SKU-OMO-MATIC',
          productName: 'Nước giặt OMO Matic 3.6kg',
          requestedQty: 15,
          allocatedQty: 15,
          pickedQty: 0,
          unit: 'Can',
          allocations: [
            {
              batchNumber: 'BATCH-OMO-01',
              expiryDate: '2026-10-07',
              locationBarcode: 'ZA-A01-R02-S01-B03',
              qtyAllocated: 15,
              isNearestExpiry: true,
            },
          ],
        },
      ],
    },
    {
      id: 'so-02',
      soCode: 'SO-2026-889',
      customerName: 'Hệ Thống Bách Hóa Xanh',
      shippingAddress: 'Trung Tâm Phân Phối Nam An Khánh, Hà Nội',
      orderDate: 'Hôm nay, 10:15',
      requiredDate: '2026-09-12',
      priority: 'URGENT',
      status: 'PENDING',
      notes: 'Đơn hàng hỏa tốc bổ sung kệ cuối tuần.',
      items: [
        {
          id: 'item-3',
          sku: 'SKU-MILK-100',
          productName: 'Sữa tươi Vinamilk 100% 1L',
          requestedQty: 30,
          allocatedQty: 0,
          pickedQty: 0,
          unit: 'Thùng',
          allocations: [],
        },
      ],
    },
    {
      id: 'so-03',
      soCode: 'SO-2026-887',
      customerName: 'Đại Siêu Thị Go! (BigC Thăng Long)',
      shippingAddress: '222 Trần Duy Hưng, Cầu Giấy, Hà Nội',
      orderDate: 'Hôm qua, 14:00',
      requiredDate: '2026-09-10',
      priority: 'NORMAL',
      status: 'DISPATCHED',
      lockId: 'LOCK-TX-99801',
      notes: 'Đã xuất kho bàn giao nhà xe thành công.',
      items: [
        {
          id: 'item-4',
          sku: 'SKU-SAMS-S24',
          productName: 'Samsung Galaxy S24 Ultra',
          requestedQty: 10,
          allocatedQty: 10,
          pickedQty: 10,
          unit: 'Hộp',
          allocations: [
            {
              batchNumber: 'BATCH-S24-01',
              expiryDate: '2028-09-09',
              locationBarcode: 'ZA-A01-R01-S02-B01',
              qtyAllocated: 10,
              isNearestExpiry: true,
            },
          ],
        },
      ],
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(null);

  const handleCreateOrder = (newOrder: OutboundOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
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
