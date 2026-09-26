import React, { useState, useEffect, useTransition } from 'react';
import { Zap, Layers, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { StockItem, StockTransferDto } from '../types';
import { OutboundFefoWorkbench } from '../components/OutboundFefoWorkbench';
import { StockBalanceTable } from '../components/balance/StockBalanceTable';
import { StockTransferHistoryTable } from '../components/balance/StockTransferHistoryTable';
import { StockTransferModal } from '../components/StockTransferModal';
import { StockLedgerModal, LedgerEntryData } from '../components/StockLedgerModal';
import { inventoryService } from '../services/inventoryService';

export const InventoryBalancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'outbound' | 'balance' | 'transfer'>('balance');
  const [, startTransition] = useTransition();

  const handleTabChange = (tab: 'outbound' | 'balance' | 'transfer') => {
    startTransition(() => {
      setActiveTab(tab);
    });
  };
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [transfers, setTransfers] = useState<StockTransferDto[]>([]);
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
      {/* Header & Bộ Chuyển Tab Doanh Nghiệp */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Quản Lý Tồn Kho & Điều Chuyển Nội Bộ
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 pl-13">
            Theo dõi số lượng tồn kho theo vị trí ô kệ, điều phối xuất hàng FEFO và điều chuyển hàng hóa linh hoạt.
          </p>
        </div>

        {/* Tab Gạt Tối Giản, Chuẩn Enterprise */}
        <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex-wrap gap-1">
          <button
            onClick={() => handleTabChange('balance')}
            className={`tab-pill-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm cursor-pointer ${
              activeTab === 'balance'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Tồn Kho Thực Tế</span>
          </button>

          <button
            onClick={() => handleTabChange('transfer')}
            className={`tab-pill-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm cursor-pointer ${
              activeTab === 'transfer'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium border border-transparent'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <span>Lịch Sử Điều Chuyển</span>
            {transfers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-2xs bg-indigo-100 text-indigo-700 font-mono font-semibold">
                {transfers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabChange('outbound')}
            className={`tab-pill-btn flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm cursor-pointer ${
              activeTab === 'outbound'
                ? 'bg-white text-slate-900 font-semibold shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium border border-transparent'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Điều Phối Xuất (FEFO)</span>
          </button>
        </div>
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
