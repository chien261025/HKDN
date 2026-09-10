import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { OrderItem, LedgerEntryData, InventoryStats } from '../types';
import { OrderSelectorCard } from './outbound/OrderSelectorCard';
import { FefoAllocationCard } from './outbound/FefoAllocationCard';
import { LocationStockGauge } from './outbound/LocationStockGauge';
import { RecentLedgerCard } from './outbound/RecentLedgerCard';
import { StockLedgerModal } from './StockLedgerModal';

export const OutboundFefoWorkbench: React.FC = () => {
  // 1. Danh sách đơn xuất mẫu
  const [orders, setOrders] = useState<OrderItem[]>([
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
      daysRemaining: 15,
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
  ]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>('1');
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // 2. Tồn kho thực tế của ô kệ đang thao tác
  const [inventoryStats, setInventoryStats] = useState<Record<string, InventoryStats>>({
    '1': { onHand: 80, reserved: 0, available: 80 },
    '2': { onHand: 25, reserved: 0, available: 25 },
  });

  const currentStats = inventoryStats[selectedOrderId] || { onHand: 80, reserved: 0, available: 80 };

  // 3. Lịch sử Sổ cái Thẻ kho
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
      performedBy: 'Nguyễn Quản Kho',
      notes: 'Nhập số dư đầu kỳ',
      timestamp: '2026-09-08 08:30:00',
      hashSignature: '7d5a8b2c4e1f9a0d3b6c8e5f2a1d4b7c',
    },
  ]);

  // Modal Sổ Cái
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);

  // Thao tác 1: Khóa giữ hàng (Reserve)
  const handleReserve = () => {
    if (selectedOrder.status !== 'PENDING') return;

    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'RESERVED' } : o))
    );

    setInventoryStats((prev) => ({
      ...prev,
      [selectedOrderId]: {
        onHand: currentStats.onHand,
        reserved: currentStats.reserved + selectedOrder.qty,
        available: currentStats.available - selectedOrder.qty,
      },
    }));
  };

  // Thao tác 2: Xuất kho (Ship)
  const handleShip = () => {
    if (selectedOrder.status !== 'RESERVED') return;

    const oldOnHand = currentStats.onHand;
    const newOnHand = oldOnHand - selectedOrder.qty;

    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'SHIPPED' } : o))
    );

    setInventoryStats((prev) => ({
      ...prev,
      [selectedOrderId]: {
        onHand: newOnHand,
        reserved: 0,
        available: newOnHand,
      },
    }));

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');
    const newEntry: LedgerEntryData = {
      id: `LEDGER-OUT-${Math.floor(100 + Math.random() * 900)}`,
      transactionType: 'OUTBOUND',
      referenceCode: selectedOrder.code,
      locationBarcode: selectedOrder.locationBarcode,
      productSku: selectedOrder.productSku,
      productName: selectedOrder.productName,
      batchNumber: selectedOrder.batchNumber,
      expiryDate: selectedOrder.expiryDate,
      qtyChange: -selectedOrder.qty,
      balanceBefore: oldOnHand,
      balanceAfter: newOnHand,
      performedBy: 'Trần Trưởng Kho (CHIEF_OPERATOR)',
      notes: `Xuất kho giao cho ${selectedOrder.customer}`,
      timestamp: timeStr,
      hashSignature: 'e4d8a1f6c3b9e2a5f7d1b8c4e6a0d2f5',
    };

    setActiveLedgerEntry(newEntry);
    setLedgerHistory((prev) => [newEntry, ...prev]);
    setShowLedgerModal(true);
  };

  // Đặt lại dữ liệu demo
  const handleReset = () => {
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'PENDING' } : o))
    );
    setInventoryStats((prev) => ({
      ...prev,
      [selectedOrderId]: selectedOrderId === '1'
        ? { onHand: 80, reserved: 0, available: 80 }
        : { onHand: 25, reserved: 0, available: 25 },
    }));
  };

  return (
    <div className="space-y-5">
      {/* Banner Tiêu Đề Điều Phối Nhỏ Gọn */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Điều Phối Xuất Kho & Phân Bổ FEFO
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Khóa bi quan (SELECT FOR UPDATE)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tự động ưu tiên lô cận date, khóa giữ hàng an toàn chống âm kho và ghi sổ cái bất biến.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Đặt Lại Trạng Thái</span>
        </button>
      </div>

      {/* Grid 2 Cột Cân Đối: Cột Trái (Nghiệp Vụ) & Cột Phải (Tồn Kho & Sổ Cái) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7 COLS): CHỌN ĐƠN & PHÂN TÍCH FEFO */}
        <div className="lg:col-span-7 space-y-4">
          <OrderSelectorCard
            orders={orders}
            selectedOrderId={selectedOrderId}
            onSelectOrder={setSelectedOrderId}
          />

          <FefoAllocationCard
            order={selectedOrder}
            onReserve={handleReserve}
            onShip={handleShip}
            onViewLedger={() => {
              const match = ledgerHistory.find((l) => l.referenceCode === selectedOrder.code) || ledgerHistory[0];
              setActiveLedgerEntry(match);
              setShowLedgerModal(true);
            }}
          />
        </div>

        {/* CỘT PHẢI (5 COLS): ĐỒNG HỒ ĐO TỒN KHO & LỊCH SỬ SỔ CÁI */}
        <div className="lg:col-span-5 space-y-4">
          <LocationStockGauge
            locationBarcode={selectedOrder.locationBarcode}
            stats={currentStats}
          />

          <RecentLedgerCard
            history={ledgerHistory}
            onSelectEntry={(entry) => {
              setActiveLedgerEntry(entry);
              setShowLedgerModal(true);
            }}
          />
        </div>
      </div>

      {/* Modal Chứng Từ Thẻ Kho */}
      {showLedgerModal && activeLedgerEntry && (
        <StockLedgerModal
          entry={activeLedgerEntry}
          onClose={() => setShowLedgerModal(false)}
        />
      )}
    </div>
  );
};
