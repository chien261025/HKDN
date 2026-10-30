import React, { useState, useEffect, useCallback } from 'react';
import { OrderItem, LedgerEntryData, InventoryStats } from '../types';
import { FefoStatsHeader } from './outbound/FefoStatsHeader';
import { FefoTable } from './outbound/FefoTable';
import { FefoKanban } from './outbound/FefoKanban';
import { RecentLedgerCard } from './outbound/RecentLedgerCard';
import { OrderDispatchDrawer } from './outbound/OrderDispatchDrawer';
import { StockLedgerModal } from './StockLedgerModal';
import { inventoryService } from '../services/inventoryService';
import { outboundService } from '../../outbound/services/outboundService';

export const OutboundFefoWorkbench: React.FC = () => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [inventoryStats, setInventoryStats] = useState<Record<string, InventoryStats>>({});
  const [ledgerHistory, setLedgerHistory] = useState<LedgerEntryData[]>([]);

  // Bộ lọc tìm kiếm & trạng thái
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESERVED' | 'SHIPPED'>('ALL');

  // Đơn hàng đang mở Drawer chi tiết cạnh phải
  const [activeDrawerOrder, setActiveDrawerOrder] = useState<OrderItem | null>(null);

  // Modal Phiếu Xuất Kho
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);

  // Hàm tải dữ liệu thực tế từ Backend
  const loadData = useCallback(async () => {
    try {
      const [outboundList, stockList, ledgerEntries] = await Promise.all([
        outboundService.getOutboundOrders(),
        inventoryService.getInventoryBalances(),
        inventoryService.getRecentLedger(),
      ]);

      const workbenchOrders: OrderItem[] = [];
      const statsMap: Record<string, InventoryStats> = {};

      outboundList.forEach((order) => {
        const item = order.items && order.items.length > 0 ? order.items[0] : null;
        const orderId = order.id;

        let status: 'PENDING' | 'RESERVED' | 'SHIPPED' = 'PENDING';
        if (order.status === 'DISPATCHED') {
          status = 'SHIPPED';
        } else if (order.status === 'ALLOCATED' || (item && item.allocatedQty > 0)) {
          status = 'RESERVED';
        }

        const sku = item?.sku || 'SKU-MILK-100';
        const productName = item?.productName || 'Sản phẩm xuất kho';
        const qty = item?.requestedQty || 10;

        // Tìm các tồn kho tương ứng của sản phẩm này trong kho
        const relevantStocks = stockList.filter(
          (s) => s.sku === sku || (item?.productId && s.productId === item.productId)
        );
        relevantStocks.sort((a, b) => (a.expiryDate || '').localeCompare(b.expiryDate || ''));

        let locationBarcode = 'WH01-ZA-A01-R01-S01-B01';
        let batchNumber = 'BATCH-FEFO-01';
        let expiryDate = '2027-01-01';
        let onHand = 50;
        let reserved = 0;
        let available = 50;

        if (item?.allocations && item.allocations.length > 0) {
          const alloc = item.allocations[0];
          locationBarcode = alloc.locationBarcode || locationBarcode;
          batchNumber = alloc.batchNumber || batchNumber;
          expiryDate = alloc.expiryDate || expiryDate;
          const matchingStock = relevantStocks.find(
            (s) => s.locationBarcode === locationBarcode && s.batchNumber === batchNumber
          );
          if (matchingStock) {
            onHand = matchingStock.onHandQty;
            reserved = matchingStock.reservedQty;
            available = matchingStock.availableQty;
          }
        } else if (relevantStocks.length > 0) {
          const bestFefo = relevantStocks[0];
          locationBarcode = bestFefo.locationBarcode;
          batchNumber = bestFefo.batchNumber;
          expiryDate = bestFefo.expiryDate;
          onHand = bestFefo.onHandQty;
          reserved = bestFefo.reservedQty;
          available = bestFefo.availableQty;
        }

        const expTime = new Date(expiryDate).getTime();
        const daysRemaining = !isNaN(expTime)
          ? Math.max(1, Math.ceil((expTime - Date.now()) / (1000 * 3600 * 24)))
          : 90;

        let alternateBatch: OrderItem['alternateBatch'] = undefined;
        if (relevantStocks.length > 1) {
          const alt = relevantStocks[1];
          const altExpTime = new Date(alt.expiryDate).getTime();
          alternateBatch = {
            batchNumber: alt.batchNumber,
            expiryDate: alt.expiryDate,
            locationBarcode: alt.locationBarcode,
            onHand: alt.onHandQty,
            daysRemaining: !isNaN(altExpTime)
              ? Math.max(1, Math.ceil((altExpTime - Date.now()) / (1000 * 3600 * 24)))
              : 180,
          };
        }

        workbenchOrders.push({
          id: orderId,
          code: order.soCode,
          customer: order.customerName,
          productSku: sku,
          productName,
          qty,
          status,
          locationBarcode,
          batchNumber,
          expiryDate,
          daysRemaining,
          alternateBatch,
        });

        statsMap[orderId] = {
          onHand,
          reserved,
          available,
        };
      });

      setOrders(workbenchOrders);
      setInventoryStats(statsMap);
      if (ledgerEntries && ledgerEntries.length > 0) {
        setLedgerHistory(ledgerEntries);
      }
    } catch (err) {
      console.warn('Lỗi khi nạp dữ liệu Outbound FEFO Workbench:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Thao tác 1: Cấp phát lô & Khóa giữ hàng FEFO thực tế qua Backend
  const handleReserveOrder = async (orderId: string) => {
    try {
      const success = await outboundService.allocateOrderFefo(orderId);
      if (success) {
        await loadData();
        if (activeDrawerOrder?.id === orderId) {
          setActiveDrawerOrder((prev) => (prev ? { ...prev, status: 'RESERVED' } : null));
        }
      }
    } catch (err) {
      console.error('Không thể cấp phát FEFO cho đơn hàng:', err);
    }
  };

  // Thao tác 2: Xuất kho thực tế qua Backend (ghi sổ cái bất biến & trừ tồn kho)
  const handleShipOrder = async (orderId: string) => {
    try {
      const success = await outboundService.dispatchOrder(orderId);
      if (success) {
        await loadData();
        if (activeDrawerOrder?.id === orderId) {
          setActiveDrawerOrder((prev) => (prev ? { ...prev, status: 'SHIPPED' } : null));
        }
      }
    } catch (err) {
      console.error('Không thể xuất kho đơn hàng:', err);
    }
  };

  // Làm mới dữ liệu từ server
  const handleReset = async () => {
    await loadData();
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
    if (match) {
      setActiveLedgerEntry(match);
      setShowLedgerModal(true);
    }
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
            ? inventoryStats[activeDrawerOrder.id] || { onHand: 50, reserved: 0, available: 50 }
            : { onHand: 50, reserved: 0, available: 50 }
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
