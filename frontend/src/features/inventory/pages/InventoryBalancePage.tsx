import React, { useState, useEffect, useTransition } from 'react';
import { Package, Clock, Layers, ArrowRightLeft, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { StockItem, StockTransferDto } from '../../labels/types';
import { OutboundFefoWorkbench } from '../components/OutboundFefoWorkbench';
import { StockBalanceTable } from '../components/balance/StockBalanceTable';
import { StockTransferHistoryTable } from '../components/balance/StockTransferHistoryTable';
import { SafetyStockAlertsPanel } from '../components/SafetyStockAlertsPanel';
import { StockTransferModal } from '../components/StockTransferModal';
import { StockLedgerModal, LedgerEntryData } from '../components/StockLedgerModal';
import { RecentLedgerCard } from '../components/outbound/RecentLedgerCard';
import { inventoryService, SafetyStockAlert } from '../services/inventoryService';
import { OutboundStock } from '../../outbound/types';
import { WarehouseClosingBalances } from '../components/WarehouseClosingBalances';
import { PRIMARY_WAREHOUSE } from '../../../config/warehouse';

export const InventoryBalancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'outbound' | 'balance' | 'ledger' | 'transfer' | 'alerts'>('balance');
  const [, startTransition] = useTransition();

  const handleTabChange = (tab: 'outbound' | 'balance' | 'ledger' | 'transfer' | 'alerts') => {
    if (tab === 'ledger') inventoryService.getRecentLedger().then(data => setLedgers(data.filter(l => l.warehouseId === PRIMARY_WAREHOUSE.id))).catch(() =>
      setNotification({ type: 'error', message: 'Không tải được sổ cái từ backend.' }));
    if (tab === 'balance' || tab === 'ledger') loadStockData();
    startTransition(() => {
      setActiveTab(tab);
    });
  };
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [closingBalances, setClosingBalances] = useState<OutboundStock[]>([]);
  const [transfers, setTransfers] = useState<StockTransferDto[]>([]);
  const [alerts, setAlerts] = useState<SafetyStockAlert[]>([]);
  const [ledgers, setLedgers] = useState<LedgerEntryData[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal điều chuyển
  const [transferModalItem, setTransferModalItem] = useState<StockItem | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Modal sổ cái
  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const loadStockData = () => {
    Promise.all([inventoryService.getInventoryBalances(), inventoryService.getClosingBalances()]).then(([data, balances]) => {
      setStocks(data.filter(s => s.warehouseId === PRIMARY_WAREHOUSE.id && s.onHandQty > 0));
      setClosingBalances(balances);
    }).catch(() =>
      setNotification({ type: 'error', message: 'Không tải được tồn kho từ backend.' }));
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
    inventoryService.getRecentLedger().then(data => setLedgers(data.filter(l => l.warehouseId === PRIMARY_WAREHOUSE.id))).catch(() =>
      setNotification({ type: 'error', message: 'Không tải được sổ cái từ backend.' }));
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

    const reserved = await inventoryService.reserveStock(item.productId, item.locationId!, item.batchId!, qty);
    if (!reserved) {
      setNotification({ type: 'error', message: 'Không giữ được hàng. Vui lòng kiểm tra tồn kho và thử lại.' });
      return;
    }
    loadStockData();

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
  const handleViewLedgerFromTable = async (item: StockItem) => {
    try {
    const currentLedgers = await inventoryService.getRecentLedger();
    setLedgers(currentLedgers.filter(l => l.warehouseId === PRIMARY_WAREHOUSE.id));
    const entry = currentLedgers.find((ledger) => ledger.productSku === item.sku
      && ledger.locationBarcode === item.locationBarcode && ledger.batchNumber === item.batchNumber);
    if (!entry) {
      setNotification({ type: 'error', message: 'Không tìm thấy bút toán sổ cái gần đây cho dòng tồn kho này.' });
      return;
    }
    setActiveLedgerEntry(entry);
    setShowLedgerModal(true);
    } catch {
      setNotification({ type: 'error', message: 'Không tải được sổ cái từ backend.' });
    }
  };

  const totalUnits = stocks.reduce((acc, s) => acc + (s.onHandQty || 0), 0);
  const totalReserved = stocks.reduce((acc, s) => acc + (s.reservedQty || 0), 0);

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 ring-4 ring-blue-50">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Quản Lý Tồn Kho & Điều Chuyển
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Kiểm soát số dư theo vị trí ô kệ, điều chuyển nội bộ và giám sát định mức an toàn
            </p>
          </div>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Dòng Lưu Kho</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">{stocks.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Vị trí ô kệ đang lưu hàng</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Tổng Tồn Thực Tế</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono mt-1.5 tabular-nums">
                {totalUnits.toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Tổng số lượng sản phẩm lưu trữ</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Đang Khóa Cho Đơn</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1.5 tabular-nums">
                {totalReserved.toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Số lượng đã cấp phát chờ xuất</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">Cảnh Báo Thiếu Hụt</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono mt-1.5 tabular-nums">{alerts.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-600 font-medium">
            {alerts.length > 0 ? 'Mặt hàng dưới mức tồn an toàn' : 'Tồn kho ổn định'}
          </div>
        </div>
      </div>

      {/* Horizontal Tabs - Clean Enterprise Standard */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleTabChange('balance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'balance'
            ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
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
          onClick={() => handleTabChange('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap ${activeTab === 'ledger' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
        >
          <Clock className="w-4 h-4" /> Sổ Cái Nhập Xuất
        </button>

        <button
          onClick={() => handleTabChange('alerts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'alerts'
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
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'transfer'
            ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
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
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === 'outbound'
            ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
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
          className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between transition-all ${notification.type === 'success'
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
          <div className="space-y-4">
            <WarehouseClosingBalances balances={closingBalances} />
            <h3 className="font-semibold text-slate-800">Chi tiết tồn cuối theo lô và ô kệ</h3>
            <StockBalanceTable
              stocks={stocks}
              onReserveItem={handleReserveFromTable}
              onViewLedger={handleViewLedgerFromTable}
              onTransfer={handleOpenTransfer}
            />
          </div>
        )}

        {activeTab === 'transfer' && (
          <StockTransferHistoryTable
            transfers={transfers}
            loading={loadingTransfers}
          />
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <WarehouseClosingBalances balances={closingBalances} />
            <h3 className="font-semibold text-slate-800">Lịch sử biến động · Số dư tại thời điểm giao dịch</h3>
            <RecentLedgerCard history={ledgers} onSelectEntry={(entry) => { setActiveLedgerEntry(entry); setShowLedgerModal(true); }} />
          </div>
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
