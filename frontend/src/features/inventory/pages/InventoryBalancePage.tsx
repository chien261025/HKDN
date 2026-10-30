import React, { useState, useEffect, useTransition } from 'react';
import { Package, Clock, Layers, ArrowRightLeft, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { StockItem, StockTransferDto } from '../types';
import { OutboundFefoWorkbench } from '../components/OutboundFefoWorkbench';
import { StockBalanceTable } from '../components/balance/StockBalanceTable';
import { StockTransferHistoryTable } from '../components/balance/StockTransferHistoryTable';
import { SafetyStockAlertsPanel } from '../components/SafetyStockAlertsPanel';
import { StockTransferModal } from '../components/StockTransferModal';
import { StockLedgerModal, LedgerEntryData } from '../components/StockLedgerModal';
import { inventoryService, SafetyStockAlert } from '../services/inventoryService';

export const InventoryBalancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'outbound' | 'balance' | 'transfer' | 'alerts'>('balance');
  const [, startTransition] = useTransition();

  const handleTabChange = (tab: 'outbound' | 'balance' | 'transfer' | 'alerts') => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransferDto[]>([]);
  const [alerts, setAlerts] = useState<SafetyStockAlert[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal điều chuyển
  const [transferModalItem, setTransferModalItem] = useState<StockItem | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Modal sổ cái
  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const loadStockData = () => {
    inventoryService.getInventoryBalances().then(setStocks);
  };

  const loadTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const data = await inventoryService.getStockTransfers();
      setTransfers(data);
    } finally {
      setLoadingTransfers(false);
    }
  };

  useEffect(() => {
    loadStockData();
    loadTransfers();
    inventoryService.getSafetyStockAlerts().then(setAlerts);
  }, []);

  // Xử lý giữ hàng từ bảng tồn kho (Tab 2)
  const handleReserveFromTable = async (item: StockItem, qty: number) => {
    if (qty > item.availableQty) {
      setNotification({
        type: 'error',
        message: `Số lượng yêu cầu (${qty}) vượt quá tồn khả dụng (${item.availableQty})!`,
      });
      return;
    }

    await inventoryService.reserveStock(item.productId, item.locationId || 5, item.batchId || 1, qty);

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
      message: `Đã giữ ${qty} sản phẩm cho đơn hàng thành công!`,
    });
  };

  // Mở modal điều chuyển ô kệ
  const handleOpenTransfer = (item: StockItem) => {
    setTransferModalItem(item);
    setShowTransferModal(true);
  };

  // Sau khi điều chuyển thành công
  const handleTransferSuccess = () => {
    loadStockData();
    loadTransfers();
    setNotification({
      type: 'success',
      message: 'Điều chuyển hàng giữa 2 ô kệ thành công! Đã tự động cập nhật số dư và ghi 2 bút toán đối ứng vào Sổ cái.',
    });
  };

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
      performedBy: 'Hệ Thống',
      notes: `Nhập lưu kho và xếp vào ô kệ: ${item.locationBarcode}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' - ' + new Date().toLocaleDateString('vi-VN'),
      hashSignature: `0x${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };
    setActiveLedgerEntry(entry);
    setShowLedgerModal(true);
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản Lý Tồn Kho & Điều Chuyển
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Kiểm soát số dư theo vị trí ô kệ, điều chuyển nội bộ và giám sát định mức tồn an toàn (Safety Stock)
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Tabs - Clean Enterprise Standard */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleTabChange('balance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'balance'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Tồn Kho Thực Tế</span>
          <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-100 text-slate-600 font-mono">
            {stocks.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-rose-600 text-rose-700 bg-rose-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-rose-700 hover:border-rose-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-rose-500" />
          <span>Cảnh Báo Tồn An Toàn</span>
          {alerts.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-rose-600 text-white font-mono font-bold">
              {alerts.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('transfer')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'transfer'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4 text-slate-500" />
          <span>Lịch Sử Điều Chuyển</span>
          {transfers.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-100 text-slate-600 font-mono">
              {transfers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('outbound')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'outbound'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/40 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Điều Phối Xuất (FEFO)</span>
        </button>
      </div>

      {/* Thông Báo */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Hiển thị Tab tương ứng với GPU-Accelerated Transition mượt mà */}
      <div key={activeTab} className="tab-panel-transition">
        {activeTab === 'balance' && (
          <StockBalanceTable
            stocks={stocks}
            onReserveItem={handleReserveFromTable}
            onViewLedger={handleViewLedgerFromTable}
            onTransfer={handleOpenTransfer}
          />
        )}

        {activeTab === 'transfer' && (
          <StockTransferHistoryTable
            transfers={transfers}
            loading={loadingTransfers}
          />
        )}

        {activeTab === 'outbound' && (
          <OutboundFefoWorkbench />
        )}

        {activeTab === 'alerts' && (
          <SafetyStockAlertsPanel alerts={alerts} />
        )}
      </div>

      {/* Modal Lập Lệnh Điều Chuyển Hàng Nội Bộ */}
      <StockTransferModal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setTransferModalItem(null);
        }}
        sourceItem={transferModalItem}
        onSuccess={handleTransferSuccess}
      />

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
