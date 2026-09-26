import React, { useState, useEffect } from 'react';
import { OrderItem, LedgerEntryData, InventoryStats } from '../types';
import { FefoStatsHeader } from './outbound/FefoStatsHeader';
import { FefoTable } from './outbound/FefoTable';
import { FefoKanban } from './outbound/FefoKanban';
import { RecentLedgerCard } from './outbound/RecentLedgerCard';
import { OrderDispatchDrawer } from './outbound/OrderDispatchDrawer';
import { StockLedgerModal } from './StockLedgerModal';
import { inventoryService } from '../services/inventoryService';

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: '1',
    code: 'OUT-2026-001',
    customer: 'Siêu thị Co.opmart Cống Quỳnh',
    productSku: 'SKU-MILK-100',
    productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    qty: 20,
    status: 'PENDING',
    locationBarcode: 'ZB-B01-R01-S01-B05',
    batchNumber: 'BATCH-MILK-26A',
    expiryDate: '2026-09-25',
    daysRemaining: 13,
    alternateBatch: {
      batchNumber: 'BATCH-MILK-26B',
      expiryDate: '2026-11-30',
      daysRemaining: 81,
      locationBarcode: 'ZB-B01-R01-S02-B06',
      onHand: 200,
    },
  },
  {
    id: '2',
    code: 'OUT-2026-002',
    customer: 'Chuỗi Bán lẻ FPT Shop',
    productSku: 'SKU-SAMS-S24',
    productName: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
    qty: 5,
    status: 'PENDING',
    locationBarcode: 'ZA-A01-R01-S01-B01',
    batchNumber: 'BATCH-S24-01',
    expiryDate: '2028-01-10',
    daysRemaining: 487,
  },
];

const INITIAL_INVENTORY_STATS: Record<string, InventoryStats> = {
  '1': { onHand: 80, reserved: 0, available: 80 },
  '2': { onHand: 25, reserved: 0, available: 25 },
};

export const OutboundFefoWorkbench: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [orders, setOrders] = useState<OrderItem[]>(INITIAL_ORDERS);

  // Bộ lọc tìm kiếm & trạng thái
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESERVED' | 'SHIPPED'>('ALL');

  // Đơn hàng đang mở Drawer chi tiết cạnh phải
  const [activeDrawerOrder, setActiveDrawerOrder] = useState<OrderItem | null>(null);

  // Tồn kho thực tế của các ô kệ
  const [inventoryStats, setInventoryStats] = useState<Record<string, InventoryStats>>(INITIAL_INVENTORY_STATS);

  // Lịch sử giao dịch sổ cái
  const [ledgerHistory, setLedgerHistory] = useState<LedgerEntryData[]>([
    {
      id: 'LEDGER-001',
      transactionType: 'INBOUND',
      referenceCode: 'INB-2026-001',
      locationBarcode: 'ZB-B01-R01-S01-B05',
      productSku: 'SKU-MILK-100',
      productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      batchNumber: 'BATCH-MILK-26A',
      expiryDate: '2026-09-25',
      qtyChange: 80,
      balanceBefore: 0,
      balanceAfter: 80,
      performedBy: 'Hệ Thống',
      notes: 'Nhập số dư đầu kỳ từ nhà cung cấp Vinamilk',
      timestamp: '10/09/2026 08:30:00',
      hashSignature: '7d5a8b2c4e1f9a0d3b6c8e5f2a1d4b7c89f0e1a2b3c4d5e6f7a8b9c0d1e2f3a4',
    },
  ]);

  useEffect(() => {
    inventoryService.getRecentLedger().then((entries) => {
      if (entries && entries.length > 0) {
        setLedgerHistory(entries);
      }
    });
  }, []);

  // Modal Phiếu Xuất Kho
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);

  // Thao tác 1: Giữ hàng (Reserve)
  const handleReserveOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status !== 'PENDING') return;

    inventoryService.reserveStock(1, 5, 1, targetOrder.qty);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'RESERVED' } : o))
    );

    setInventoryStats((prev) => {
      const cur = prev[orderId] || { onHand: 80, reserved: 0, available: 80 };
      const newReserved = cur.reserved + targetOrder.qty;
      return {
        ...prev,
        [orderId]: {
          onHand: cur.onHand,
          reserved: newReserved,
          available: cur.onHand - newReserved,
        },
      };
    });

    if (activeDrawerOrder?.id === orderId) {
      setActiveDrawerOrder((prev) => (prev ? { ...prev, status: 'RESERVED' } : null));
    }
  };

  // Thao tác 2: Xuất kho thực tế (Ship)
  const handleShipOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status !== 'RESERVED') return;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'SHIPPED' } : o))
    );

    const cur = inventoryStats[orderId] || { onHand: 80, reserved: 0, available: 80 };
    const balanceBefore = cur.onHand;
    const balanceAfter = cur.onHand - targetOrder.qty;

    setInventoryStats((prev) => ({
      ...prev,
      [orderId]: {
        onHand: balanceAfter,
        reserved: Math.max(0, cur.reserved - targetOrder.qty),
        available: balanceAfter,
      },
    }));

    const newLedgerEntry: LedgerEntryData = {
      id: `PXK-${Math.floor(1000 + Math.random() * 9000)}`,
      transactionType: 'OUTBOUND',
      referenceCode: targetOrder.code,
      locationBarcode: targetOrder.locationBarcode,
      productSku: targetOrder.productSku,
      productName: targetOrder.productName,
      batchNumber: targetOrder.batchNumber,
      expiryDate: targetOrder.expiryDate,
      qtyChange: -targetOrder.qty,
      balanceBefore,
      balanceAfter,
      performedBy: 'Trần Trưởng Kho',
      notes: `Xuất kho hoàn tất cho khách hàng ${targetOrder.customer}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' - 13/09/2026',
      hashSignature: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };

    setLedgerHistory((prev) => [newLedgerEntry, ...prev]);

    if (activeDrawerOrder?.id === orderId) {
      setActiveDrawerOrder((prev) => (prev ? { ...prev, status: 'SHIPPED' } : null));
    }
  };

  // Làm mới dữ liệu
  const handleReset = () => {
    setOrders(INITIAL_ORDERS);
    setInventoryStats(INITIAL_INVENTORY_STATS);
    setActiveDrawerOrder(null);
  };

  // Lọc đơn hàng
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productSku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const reservedOrders = orders.filter((o) => o.status === 'RESERVED').length;
  const shippedOrders = orders.filter((o) => o.status === 'SHIPPED').length;

  const handleOpenLedgerForOrder = (order: OrderItem) => {
    const match = ledgerHistory.find((l) => l.referenceCode === order.code) || ledgerHistory[0];
    setActiveLedgerEntry(match);
    setShowLedgerModal(true);
  };

  return (
    <div className="space-y-5">
      {/* 4 Thẻ chỉ số KPI & Toolbar điều phối */}
      <FefoStatsHeader
        totalOrders={totalOrders}
        pendingOrders={pendingOrders}
        reservedOrders={reservedOrders}
        shippedOrders={shippedOrders}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onReset={handleReset}
      />

      {/* Không gian danh sách: Dạng Bảng hoặc Luồng Kanban */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {viewMode === 'table' ? (
          <FefoTable
            orders={filteredOrders}
            onSelectOrder={(order) => setActiveDrawerOrder(order)}
          />
        ) : (
          <FefoKanban
            orders={orders}
            onSelectOrder={(order) => setActiveDrawerOrder(order)}
            onReserveOrder={handleReserveOrder}
            onShipOrder={handleShipOrder}
            onViewLedger={handleOpenLedgerForOrder}
          />
        )}
      </div>

      {/* Lịch sử xuất nhập kho gần đây */}
      <RecentLedgerCard
        history={ledgerHistory}
        onSelectEntry={(entry) => {
          setActiveLedgerEntry(entry);
          setShowLedgerModal(true);
        }}
      />

      {/* Drawer chi tiết đơn hàng slide-over cạnh phải */}
      <OrderDispatchDrawer
        order={activeDrawerOrder}
        stats={
          activeDrawerOrder
            ? inventoryStats[activeDrawerOrder.id] || { onHand: 80, reserved: 0, available: 80 }
            : { onHand: 80, reserved: 0, available: 80 }
        }
        onClose={() => setActiveDrawerOrder(null)}
        onReserve={handleReserveOrder}
        onShip={handleShipOrder}
        onViewLedger={handleOpenLedgerForOrder}
      />

      {/* Modal Phiếu Xuất Kho */}
      {showLedgerModal && activeLedgerEntry && (
        <StockLedgerModal
          entry={activeLedgerEntry}
          onClose={() => setShowLedgerModal(false)}
        />
      )}
    </div>
  );
};
