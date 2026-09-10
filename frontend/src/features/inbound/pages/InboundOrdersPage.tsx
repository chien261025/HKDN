import React, { useState } from 'react';
import { InboundHeader } from '../components/InboundHeader';
import { InboundOrderList } from '../components/InboundOrderList';
import { CreatePoModal } from '../components/CreatePoModal';
import { InboundDetailModal } from '../components/InboundDetailModal';
import { InboundOrder } from '../types';

export const InboundOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<InboundOrder[]>([
    {
      id: 'po-01',
      poCode: 'PO-2026-001',
      supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
      supplierCode: 'SUP-VNM',
      expectedDeliveryDate: '2026-09-10',
      createdAt: 'Hôm nay, 08:30',
      status: 'RECEIVED',
      notes: 'Hàng đã đến khu đệm Gate 01. Thủ kho đã quét mã kiểm đếm.',
      approvedBy: 'Trần Trưởng Kho',
      items: [
        {
          id: 'item-1',
          sku: 'SKU-MILK-100',
          productName: 'Sữa tươi Vinamilk 100% 1L',
          expectedQty: 100,
          receivedQty: 100,
          stockedQty: 0,
          batchNumber: 'BATCH-MILK-26B',
          expiryDate: '2026-10-15',
          unit: 'Thùng',
        },
      ],
    },
    {
      id: 'po-02',
      poCode: 'PO-2026-002',
      supplierName: 'Unilever Việt Nam Quốc Tế',
      supplierCode: 'SUP-ULV',
      expectedDeliveryDate: '2026-09-11',
      createdAt: 'Hôm nay, 09:15',
      status: 'PENDING',
      notes: 'Xe tải dự kiến cập kho lúc 14:00 chiều.',
      approvedBy: 'Trần Trưởng Kho',
      items: [
        {
          id: 'item-2',
          sku: 'SKU-OMO-MATIC',
          productName: 'Nước giặt OMO Matic 3.6kg',
          expectedQty: 50,
          receivedQty: 0,
          stockedQty: 0,
          unit: 'Can',
        },
      ],
    },
    {
      id: 'po-03',
      poCode: 'PO-2026-003',
      supplierName: 'Samsung Electronics Vietnam Co., Ltd',
      supplierCode: 'SUP-SEC',
      expectedDeliveryDate: '2026-09-09',
      createdAt: 'Hôm qua, 15:45',
      status: 'STOCKED',
      notes: 'Đã hoàn tất cất hàng an toàn lên Kệ R01 Tầng S02.',
      approvedBy: 'Trần Trưởng Kho',
      items: [
        {
          id: 'item-3',
          sku: 'SKU-SAMS-S24',
          productName: 'Samsung Galaxy S24 Ultra',
          expectedQty: 25,
          receivedQty: 25,
          stockedQty: 25,
          batchNumber: 'BATCH-S24-01',
          expiryDate: '2028-09-09',
          putawayLocation: 'ZA-A01-R01-S02-B01',
          unit: 'Hộp',
        },
      ],
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<InboundOrder | null>(null);

  const handleCreateOrder = (newOrder: InboundOrder) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleAdvanceStatus = (orderId: string) => {
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
