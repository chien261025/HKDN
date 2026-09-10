import React, { useState } from 'react';
import { Zap, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { StockItem } from '../types';
import { OutboundFefoWorkbench } from '../components/OutboundFefoWorkbench';
import { StockBalanceTable } from '../components/balance/StockBalanceTable';
import { StockLedgerModal, LedgerEntryData } from '../components/StockLedgerModal';

export const InventoryBalancePage: React.FC = () => {
  // Tab chuyển đổi: 'outbound' (Xuất kho FEFO) hoặc 'balance' (Bảng tồn kho thực tế)
  const [activeTab, setActiveTab] = useState<'outbound' | 'balance'>('outbound');

  // Dữ liệu mẫu bảng cân đối tồn kho
  const [stocks, setStocks] = useState<StockItem[]>([
    {
      id: 1,
      productId: 1,
      sku: 'SKU-MILK-100',
      name: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      locationBarcode: 'ZB-B01-R01-S01-B05',
      batchNumber: 'BATCH-MILK-26A',
      expiryDate: '2026-09-25',
      onHandQty: 80,
      reservedQty: 0,
      availableQty: 80,
      isExpiringSoon: true,
    },
    {
      id: 2,
      productId: 1,
      sku: 'SKU-MILK-100',
      name: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      locationBarcode: 'ZB-B01-R01-S02-B06',
      batchNumber: 'BATCH-MILK-26B',
      expiryDate: '2026-11-30',
      onHandQty: 200,
      reservedQty: 10,
      availableQty: 190,
      isExpiringSoon: false,
    },
    {
      id: 3,
      productId: 2,
      sku: 'SKU-SAMS-S24',
      name: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
      locationBarcode: 'ZA-A01-R01-S01-B01',
      batchNumber: 'BATCH-S24-01',
      expiryDate: '2028-01-10',
      onHandQty: 25,
      reservedQty: 5,
      availableQty: 20,
      isExpiringSoon: false,
    },
    {
      id: 4,
      productId: 3,
      sku: 'SKU-OMO-MATIC',
      name: 'Nước giặt OMO Matic Cửa Trên 3.6kg',
      locationBarcode: 'ZA-A01-R02-S01-B03',
      batchNumber: 'BATCH-OMO-01',
      expiryDate: '2027-03-01',
      onHandQty: 60,
      reservedQty: 0,
      availableQty: 60,
      isExpiringSoon: false,
    },
  ]);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Xử lý giữ hàng từ bảng tồn kho (Tab 2)
  const handleReserveFromTable = (item: StockItem, qty: number) => {
    if (qty > item.availableQty) {
      setNotification({
        type: 'error',
        message: `Số lượng yêu cầu (${qty}) vượt quá tồn khả dụng (${item.availableQty})!`,
      });
      return;
    }

    setStocks((prev) =>
      prev.map((s) => {
        if (s.id === item.id) {
          const newReserved = s.reservedQty + qty;
          return {
            ...s,
            reservedQty: newReserved,
            availableQty: s.onHandQty - newReserved,
          };
        }
        return s;
      })
    );

    setNotification({
      type: 'success',
      message: `Đã khóa giữ ${qty} sản phẩm an toàn với khóa bi quan (SELECT FOR UPDATE)!`,
    });
  };

  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  // Xem Sổ Cái từ bảng tồn kho thực tế (Tab 2)
  const handleViewLedgerFromTable = (item: StockItem) => {
    const entry: LedgerEntryData = {
      id: `LEDGER-BAL-${item.id}-${Date.now().toString().slice(-4)}`,
      transactionType: 'INBOUND',
      referenceCode: `IN-LOT-${item.batchNumber}`,
      locationBarcode: item.locationBarcode,
      productSku: item.sku,
      productName: item.name,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      qtyChange: item.onHandQty,
      balanceBefore: 0,
      balanceAfter: item.onHandQty,
      performedBy: 'Hệ Thống (Auto Inbound Staging)',
      notes: `Nhập lưu kho và cấp phát mã ô kệ tự động: ${item.locationBarcode}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' - 10/09/2026',
      hashSignature: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };
    setActiveLedgerEntry(entry);
    setShowLedgerModal(true);
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Header Gọn Gàng & Segmented Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Quản Lý Tồn Kho & Xuất Hàng</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cân đối tồn kho ba trạng thái (On-Hand, Reserved, Available) và xuất kho theo chiến lược FEFO.
          </p>
        </div>

        {/* Tab Gạt Tinh Gọn */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('outbound')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'outbound'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Xuất Kho FEFO</span>
          </button>

          <button
            onClick={() => setActiveTab('balance')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'balance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bảng Tồn Kho Thực Tế</span>
          </button>
        </div>
      </div>

      {/* Thông Báo */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Hiển thị Tab tương ứng */}
      {activeTab === 'outbound' ? (
        <OutboundFefoWorkbench />
      ) : (
        <StockBalanceTable
          stocks={stocks}
          onReserveItem={handleReserveFromTable}
          onViewLedger={handleViewLedgerFromTable}
        />
      )}

      {/* Modal Chứng Từ Thẻ Kho (Khi bấm từ Tab Bảng Tồn Kho Thực Tế) */}
      {showLedgerModal && activeLedgerEntry && (
        <StockLedgerModal
          entry={activeLedgerEntry}
          onClose={() => setShowLedgerModal(false)}
        />
      )}
    </div>
  );
};
