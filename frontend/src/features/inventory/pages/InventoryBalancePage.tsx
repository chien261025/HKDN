import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, Layers, ArrowRightLeft, CheckCircle2, AlertCircle, ShieldAlert, Building2, RefreshCw } from 'lucide-react';
import { StockItem, StockTransferDto } from '../../labels/types';
import { OutboundFefoWorkbench } from '../components/OutboundFefoWorkbench';
import { StockBalanceTable } from '../components/balance/StockBalanceTable';
import { StockTransferHistoryTable } from '../components/balance/StockTransferHistoryTable';
import { SafetyStockAlertsPanel } from '../components/SafetyStockAlertsPanel';
import { StockTransferModal } from '../components/StockTransferModal';
import { StockLedgerModal, LedgerEntryData } from '../components/StockLedgerModal';
import { RecentLedgerCard } from '../components/outbound/RecentLedgerCard';
import { inventoryService, SafetyStockAlert, ExpiringBatchAlert, SlowMovingStockAlert } from '../services/inventoryService';
import { OutboundStock } from '../../outbound/types';
import { WarehouseClosingBalances } from '../components/WarehouseClosingBalances';

const WAREHOUSE_OPTIONS = [
  { id: 'ALL', name: 'Toàn bộ chi nhánh kho (Hệ Thống)' },
  { id: '1', name: 'Kho Tổng Tân Bình - TP.HCM' },
  { id: '2', name: 'Kho Phân Phối VSIP Bắc Ninh' },
  { id: '3', name: 'Kho Vận Miền Trung - Đà Nẵng' },
  { id: '4', name: 'Kho Trung Chuyển Sóng Thần - Bình Dương' },
];

export const InventoryBalancePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'outbound' | 'balance' | 'ledger' | 'transfer' | 'alerts'>('balance');
  const [, startTransition] = useTransition();

  // Bộ chọn kho dùng chung toàn trang
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');

  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [closingBalances, setClosingBalances] = useState<OutboundStock[]>([]);
  const [transfers, setTransfers] = useState<StockTransferDto[]>([]);
  const [alerts, setAlerts] = useState<SafetyStockAlert[]>([]);
  const [expiringAlerts, setExpiringAlerts] = useState<ExpiringBatchAlert[]>([]);
  const [slowMovingAlerts, setSlowMovingAlerts] = useState<SlowMovingStockAlert[]>([]);
  const [ledgers, setLedgers] = useState<LedgerEntryData[]>([]);

  // Trạng thái tải dữ liệu
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [errorAlerts, setErrorAlerts] = useState(false);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal điều chuyển
  const [transferModalItem, setTransferModalItem] = useState<StockItem | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Modal sổ cái
  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);
  const [showLedgerModal, setShowLedgerModal] = useState(false);

  const currentWhId = selectedWarehouse === 'ALL' ? undefined : Number(selectedWarehouse);

  const loadStockData = (whId = currentWhId) => {
    setLoadingStocks(true);
    Promise.all([inventoryService.getInventoryBalances(whId), inventoryService.getClosingBalances(whId)])
      .then(([data, balances]) => {
        setStocks(data.filter((s) => s.onHandQty > 0));
        setClosingBalances(balances);
      })
      .catch((err) => {
        console.error('Lỗi tải số dư tồn kho:', err);
        setNotification({ type: 'error', message: 'Không tải được số dư tồn kho từ máy chủ.' });
      })
      .finally(() => setLoadingStocks(false));
  };

  const loadAlertData = (whId = currentWhId) => {
    setLoadingAlerts(true);
    setErrorAlerts(false);
    Promise.all([
      inventoryService.getSafetyStockAlerts(whId),
      inventoryService.getExpiringBatchAlerts(whId),
      inventoryService.getSlowMovingStockAlerts(whId),
    ])
      .then(([sAlerts, expAlerts, slowAlerts]) => {
        setAlerts(sAlerts);
        setExpiringAlerts(expAlerts);
        setSlowMovingAlerts(slowAlerts);
      })
      .catch((err) => {
        console.error('Lỗi tải ma trận cảnh báo:', err);
        setErrorAlerts(true);
      })
      .finally(() => setLoadingAlerts(false));
  };

  const loadLedgers = (whId = currentWhId) => {
    inventoryService
      .getRecentLedger({ warehouseId: whId })
      .then(setLedgers)
      .catch((err) => {
        console.error('Lỗi tải sổ cái:', err);
        setNotification({ type: 'error', message: 'Không tải được dữ liệu sổ cái từ máy chủ.' });
      });
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

  // Thay đổi kho toàn hệ thống
  const handleWarehouseChange = (whIdStr: string) => {
    setSelectedWarehouse(whIdStr);
    const targetWhId = whIdStr === 'ALL' ? undefined : Number(whIdStr);
    loadStockData(targetWhId);
    loadAlertData(targetWhId);
    loadLedgers(targetWhId);
  };

  useEffect(() => {
    loadStockData();
    loadAlertData();
    loadLedgers();
    loadTransfers();
  }, []);

  const handleTabChange = (tab: 'outbound' | 'balance' | 'ledger' | 'transfer' | 'alerts') => {
    if (tab === 'ledger') loadLedgers();
    if (tab === 'balance') loadStockData();
    if (tab === 'alerts') loadAlertData();
    startTransition(() => {
      setActiveTab(tab);
    });
  };

  // Xử lý giữ hàng từ bảng tồn kho (Tab 2) có chứng từ tham chiếu SO & lý do
  const handleReserveFromTable = async (
    item: StockItem,
    qty: number,
    details?: { soNumber?: string; reason?: string; duration?: string }
  ) => {
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
    loadLedgers();

    const soPart = details?.soNumber ? ` cho đơn ${details.soNumber}` : '';
    const reasonPart = details?.reason ? ` [Mục đích: ${details.reason}]` : '';
    setNotification({
      type: 'success',
      message: `Đã cấp phát giữ chỗ ${qty} ${item.unit || 'SP'}${soPart}${reasonPart} thành công! Số dư khả dụng và giữ chỗ đã được đồng bộ tự động.`,
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
    loadLedgers();
    setNotification({
      type: 'success',
      message: 'Điều chuyển hàng giữa 2 ô kệ thành công! Đã tự động cập nhật số dư và ghi 2 bút toán đối ứng vào Sổ cái.',
    });
  };

  // Xem Sổ Cái từ đúng dòng tồn kho thực tế (Targeted Ledger Query)
  const handleViewLedgerFromTable = async (item: StockItem) => {
    try {
      const targetedEntries = await inventoryService.getRecentLedger({
        warehouseId: item.warehouseId,
        productId: item.productId,
        locationId: item.locationId,
        batchId: item.batchId,
      });

      if (targetedEntries && targetedEntries.length > 0) {
        setActiveLedgerEntry(targetedEntries[0]);
        setShowLedgerModal(true);
      } else {
        // Fallback: Tìm trong danh sách hiện có hoặc tạo snapshot chứng từ
        const fallback = ledgers.find(
          (l) => l.productSku === item.sku && l.locationBarcode === item.locationBarcode
        );
        if (fallback) {
          setActiveLedgerEntry(fallback);
          setShowLedgerModal(true);
        } else {
          setActiveLedgerEntry({
            id: `SNAPSHOT-${item.id}`,
            transactionType: 'INITIAL_BALANCE',
            referenceCode: `STOCK-LOC-${item.locationBarcode}`,
            locationBarcode: item.locationBarcode,
            productSku: item.sku,
            productName: item.name,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            qtyChange: 0,
            balanceBefore: item.onHandQty,
            balanceAfter: item.onHandQty,
            performedBy: 'Hệ thống WMS (Audit Snapshot)',
            notes: 'Bản chụp số dư tồn kho tức thời tại ô kệ lưu trữ. Xác nhận trạng thái lưu kho, không phải giao dịch nhập kho mới.',
            timestamp: new Date().toLocaleString('vi-VN'),
            hashSignature: `SHA256:SNAPSHOT-${item.id}`,
          });
          setShowLedgerModal(true);
        }
      }
    } catch (err) {
      console.error('Lỗi tra cứu thẻ kho theo dòng hàng:', err);
      setNotification({ type: 'error', message: 'Không tải được lịch sử thẻ kho của dòng hàng này.' });
    }
  };

  const totalUnits = stocks.reduce((acc, s) => acc + (s.onHandQty || 0), 0);
  const totalReserved = stocks.reduce((acc, s) => acc + (s.reservedQty || 0), 0);
  const totalUnavailable = stocks.reduce((acc, s) => acc + (s.unavailableQty || (s.isExpired ? s.onHandQty : 0)), 0);
  const totalAlertsCount = alerts.length + expiringAlerts.length + slowMovingAlerts.length;

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* Header Banner với Bộ Chọn Kho Đồng Bộ (Unified Warehouse Scope) */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 ring-4 ring-blue-50">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Quản Lý Tồn Kho & Sổ Cái Biến Động (Inventory & Stock Ledger)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Trái tim hệ thống: Kiểm soát số dư theo ô kệ/lô hàng, bóc tách khả dụng, nhật ký bất biến và trung tâm cảnh báo.
            </p>
          </div>
        </div>

        {/* Bộ Lọc Chi Nhánh Kho Toàn Trang */}
        <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-2xs self-stretch md:self-auto">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phạm vi dữ liệu kho:</span>
            <select
              value={selectedWarehouse}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer pr-4"
            >
              {WAREHOUSE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          {loadingStocks && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin mr-1" />}
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Dòng Lưu Kho</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">
                {stocks.length}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Vị trí ô kệ & lô hàng đang lưu</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">Tổng Tồn Vật Lý</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono mt-1.5 tabular-nums">
                {totalUnits.toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">OnHand vật lý trong kho</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Đang Giữ Cho Đơn</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1.5 tabular-nums">
                {totalReserved.toLocaleString('vi-VN')}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {totalUnavailable > 0 ? (
              <span className="text-amber-700 font-semibold">Cấp phát hợp lệ (Khóa {totalUnavailable} SP hết hạn)</span>
            ) : (
              'Số lượng cấp phát chờ xuất hàng'
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">Trung Tâm Cảnh Báo</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono mt-1.5 tabular-nums">
                {totalAlertsCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-600 font-medium">
            {errorAlerts ? (
              'Mất kết nối trung tâm cảnh báo'
            ) : totalAlertsCount > 0 ? (
              `${alerts.length} thiếu hụt • ${expiringAlerts.length} cận date • ${slowMovingAlerts.length} tồn lâu`
            ) : (
              'Tồn kho an toàn, không có cảnh báo'
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleTabChange('balance')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'balance'
              ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Tồn Kho Thực Tế (Inventory)</span>
          <span className="px-1.5 py-0.2 rounded-full text-2xs bg-slate-100 text-slate-600 font-mono">
            {stocks.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('ledger')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'ledger'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Sổ Cái Thẻ Kho (Stock Ledger)</span>
          <span className="px-1.5 py-0.2 rounded-full text-2xs bg-indigo-100 text-indigo-700 font-mono">
            {ledgers.length}
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
          <span>Trung Tâm Cảnh Báo</span>
          {totalAlertsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-2xs bg-rose-600 text-white font-mono font-bold">
              {totalAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('transfer')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'transfer'
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
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'outbound'
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

      {/* Render Nội dung Tab */}
      <div key={activeTab} className="tab-panel-transition">
        {activeTab === 'balance' && (
          <div className="space-y-4">
            <WarehouseClosingBalances
              balances={closingBalances}
              selectedWarehouseId={selectedWarehouse}
              warehouseName={WAREHOUSE_OPTIONS.find((w) => w.id === selectedWarehouse)?.name}
            />
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Bảng Phân Bổ Tồn Kho Theo 3 Góc Nhìn (Ô Kệ, Lô Hàng, Sản Phẩm)</span>
            </h3>
            <StockBalanceTable
              stocks={stocks}
              selectedWarehouse={selectedWarehouse}
              onWarehouseChange={handleWarehouseChange}
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
            onViewLedger={(transfer) => {
              const matchedLedger = ledgers.find((l) => l.referenceCode === transfer.transferCode);
              if (matchedLedger) {
                setActiveLedgerEntry(matchedLedger);
              } else {
                setActiveLedgerEntry({
                  id: `TR-${transfer.id}`,
                  transactionType: 'TRANSFER',
                  referenceCode: transfer.transferCode,
                  locationBarcode: transfer.fromLocationBarcode,
                  productSku: transfer.productSku,
                  productName: transfer.productName,
                  batchNumber: transfer.batchNumber,
                  expiryDate: 'N/A',
                  qtyChange: -transfer.quantity,
                  balanceBefore: transfer.quantity,
                  balanceAfter: 0,
                  performedBy: 'Hệ thống WMS',
                  notes: transfer.notes || 'Điều chuyển nội bộ giữa 2 ô kệ',
                  timestamp: new Date(transfer.createdAt).toLocaleString('vi-VN'),
                  hashSignature: `SHA256:TR-${transfer.transferCode}`,
                });
              }
              setShowLedgerModal(true);
            }}
          />
        )}

        {activeTab === 'ledger' && (
          <div className="space-y-4">
            <WarehouseClosingBalances
              balances={closingBalances}
              selectedWarehouseId={selectedWarehouse}
              warehouseName={WAREHOUSE_OPTIONS.find((w) => w.id === selectedWarehouse)?.name}
            />
            <RecentLedgerCard
              history={ledgers}
              onSelectEntry={(entry) => {
                setActiveLedgerEntry(entry);
                setShowLedgerModal(true);
              }}
            />
          </div>
        )}

        {activeTab === 'outbound' && (
          <OutboundFefoWorkbench />
        )}

        {activeTab === 'alerts' && (
          <SafetyStockAlertsPanel
            alerts={alerts}
            expiringAlerts={expiringAlerts}
            slowMovingAlerts={slowMovingAlerts}
            isLoading={loadingAlerts}
            isError={errorAlerts}
            onRetry={() => loadAlertData()}
            onCreatePo={() => navigate('/inbound')}
            onBatchQuarantined={() => {
              loadStockData();
              loadAlertData();
              loadLedgers();
            }}
          />
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

      {/* Modal Chứng Từ Thẻ Kho Bất Biến */}
      {showLedgerModal && activeLedgerEntry && (
        <StockLedgerModal
          entry={activeLedgerEntry}
          onClose={() => setShowLedgerModal(false)}
        />
      )}
    </div>
  );
};
