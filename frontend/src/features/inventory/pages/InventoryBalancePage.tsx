import React, { useState, useEffect, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Package, Clock, Layers, ArrowRightLeft, CheckCircle2, AlertCircle, ShieldAlert, Building2, RefreshCw, Ban, Sparkles } from 'lucide-react';
import { StockItem, StockTransferDto } from '../../labels/types';
import { StockBalanceTable } from '../components/balance/StockBalanceTable';
import { StockTransferHistoryTable } from '../components/balance/StockTransferHistoryTable';
import { SafetyStockAlertsPanel } from '../components/SafetyStockAlertsPanel';
import { StockTransferModal } from '../components/StockTransferModal';
import { StockLedgerModal, LedgerEntryData } from '../components/StockLedgerModal';
import { RecentLedgerCard } from '../components/outbound/RecentLedgerCard';
import { inventoryService, SafetyStockAlert, ExpiringBatchAlert, SlowMovingStockAlert } from '../services/inventoryService';
import { OutboundStock } from '../../outbound/types';
import { WarehouseClosingBalances } from '../components/WarehouseClosingBalances';

import { warehouseService, DEFAULT_WAREHOUSES } from '../../masterdata/services/warehouseService';
import { GeminiAssistantDrawer } from '../../smartquery/components/GeminiAssistantDrawer';

export const InventoryBalancePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'balance' | 'ledger' | 'transfer' | 'alerts'>('balance');
  const [, startTransition] = useTransition();

  // Bộ lọc tương tác qua 4 thẻ KPI tổng quan
  const [kpiFilter, setKpiFilter] = useState<'ALL' | 'RESERVED' | 'BLOCKED' | 'AVAILABLE'>('ALL');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(() =>
    new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  );

  const [warehouseList, setWarehouseList] = useState<any[]>([
    { id: 'ALL', code: 'ALL', name: 'Toàn bộ chi nhánh kho (Hệ Thống)' },
    ...DEFAULT_WAREHOUSES.map((w) => ({ id: w.code, code: w.code, name: w.name })),
  ]);

  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const list = await warehouseService.getWarehouses();
        if (list && list.length > 0) {
          setWarehouseList([
            { id: 'ALL', code: 'ALL', name: 'Toàn bộ chi nhánh kho (Hệ Thống)' },
            ...list.map((w) => ({ id: w.code, code: w.code, name: w.name })),
          ]);
        }
      } catch (err) {
        console.warn('Lỗi tải danh sách kho động tại InventoryBalancePage:', err);
      }
    };
    fetchWarehouses();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['balance', 'ledger', 'transfer', 'alerts'].includes(tab)) {
      setActiveTab(tab as any);
    } else if (tab === 'outbound') {
      navigate('/outbound', { replace: true });
    }
    if (searchParams.get('action') === 'transfer') {
      setShowTransferModal(true);
    }
  }, [searchParams, navigate]);

  // Bộ chọn kho dùng chung toàn trang - Khởi tạo từ active warehouse
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(() => {
    return warehouseService.getActiveWarehouseId() || 'ALL';
  });

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

  // Drawer Trợ lý Gemini AI phân tích tồn kho & ngoại lệ
  const [showGeminiDrawer, setShowGeminiDrawer] = useState(false);

  const normalizeWarehouseCode = (wh?: string | number): string => {
    if (!wh || wh === 'ALL') return 'ALL';
    const s = String(wh).trim();
    if (s.startsWith('WH')) return s;
    const num = parseInt(s, 10);
    if (!isNaN(num)) {
      return `WH0${num}`;
    }
    return s;
  };

  const getTargetWhId = (whStr?: string | number): number | null => {
    if (!whStr || whStr === 'ALL') return null;
    const match = String(whStr).match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  const currentWhId = getTargetWhId(selectedWarehouse);
  const resolveWhId = (explicitWhId?: number | null): number | undefined => {
    const resolved = explicitWhId === undefined ? currentWhId : explicitWhId;
    return resolved === null ? undefined : resolved;
  };

  const loadStockData = (explicitWhId?: number | null) => {
    const whId = resolveWhId(explicitWhId);
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

  const loadAlertData = (explicitWhId?: number | null) => {
    const whId = resolveWhId(explicitWhId);
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

  const loadLedgers = (explicitWhId?: number | null) => {
    const whId = resolveWhId(explicitWhId);
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

  // Thay đổi kho toàn hệ thống đồng bộ với Global Header
  const handleWarehouseChange = (whIdStr: string) => {
    const norm = normalizeWarehouseCode(whIdStr);
    setSelectedWarehouse(norm);
    warehouseService.setActiveWarehouseId(norm);
    window.dispatchEvent(new CustomEvent('smart_wms_warehouse_changed', { detail: norm }));
    const targetWhId = getTargetWhId(norm);
    loadStockData(targetWhId);
    loadAlertData(targetWhId);
    loadLedgers(targetWhId);
  };

  // Lắng nghe sự kiện đổi kho từ Global Header
  useEffect(() => {
    const handleWhChange = (e: any) => {
      const raw = e.detail || warehouseService.getActiveWarehouseId() || 'ALL';
      const newWh = normalizeWarehouseCode(raw);
      setSelectedWarehouse(newWh);
      const targetWhId = getTargetWhId(newWh);
      loadStockData(targetWhId);
      loadAlertData(targetWhId);
      loadLedgers(targetWhId);
    };
    window.addEventListener('smart_wms_warehouse_changed', handleWhChange);
    return () => window.removeEventListener('smart_wms_warehouse_changed', handleWhChange);
  }, []);

  const handleSyncAll = () => {
    const targetWhId = getTargetWhId(selectedWarehouse);
    loadStockData(targetWhId);
    loadAlertData(targetWhId);
    loadLedgers(targetWhId);
    loadTransfers();
    setLastUpdatedTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
  };

  const handleKpiCardClick = (filter: 'ALL' | 'RESERVED' | 'BLOCKED' | 'AVAILABLE') => {
    setKpiFilter((prev) => (prev === filter && filter !== 'ALL' ? 'ALL' : filter));
    setActiveTab('balance');
  };

  useEffect(() => {
    const targetWhId = getTargetWhId(selectedWarehouse);
    loadStockData(targetWhId);
    loadAlertData(targetWhId);
    loadLedgers(targetWhId);
    loadTransfers();
  }, []);

  const handleTabChange = (tab: 'balance' | 'ledger' | 'transfer' | 'alerts') => {
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

  // Xem Sổ Cái từ đúng dòng tồn kho thực tế (Targeted Ledger Query với Robust Fallback)
  const handleViewLedgerFromTable = async (item: StockItem) => {
    try {
      let entry: LedgerEntryData | null = null;
      try {
        const targetedEntries = await inventoryService.getRecentLedger({
          warehouseId: item.warehouseId,
          productId: item.productId,
          locationId: item.locationId,
          batchId: item.batchId,
        });
        if (targetedEntries && targetedEntries.length > 0) {
          entry = targetedEntries[0];
        }
      } catch (e) {
        console.warn('Query ledger API fallback sang local ledger:', e);
      }

      if (!entry) {
        // Fallback: Tìm trong danh sách sổ cái đã tải
        entry = ledgers.find(
          (l) => (l.productSku === item.sku && l.locationBarcode === item.locationBarcode) || l.productSku === item.sku
        ) || null;
      }

      if (!entry) {
        entry = {
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
          performedBy: 'Hệ thống kiểm soát tồn kho',
          notes: 'Số dư tồn kho hiện tại tại ô lưu trữ.',
          timestamp: new Date().toLocaleString('vi-VN'),
          hashSignature: `SHA256:SNAPSHOT-${item.id}`,
        };
      }

      setActiveLedgerEntry(entry);
      setShowLedgerModal(true);
    } catch (err) {
      console.error('Lỗi tra cứu thẻ kho theo dòng hàng:', err);
      setNotification({ type: 'error', message: 'Không tải được lịch sử thẻ kho của dòng hàng này.' });
    }
  };

  const totalUnits = stocks.reduce((acc, s) => acc + (s.onHandQty || 0), 0);
  const totalReserved = stocks.reduce((acc, s) => acc + (s.reservedQty || 0), 0);
  const totalUnavailable = stocks.reduce((acc, s) => acc + (s.unavailableQty || (s.isExpired ? s.onHandQty : 0)), 0);
  const totalAvailable = stocks.reduce((acc, s) => acc + (s.availableQty || 0), 0);
  const uniqueLocationsCount = new Set(stocks.map((s) => s.locationBarcode)).size;
  const totalAlertsCount = alerts.length + expiringAlerts.length + slowMovingAlerts.length;

  return (
    <div className="space-y-4 pb-10">
      {/* Header Banner với Bộ Chọn Kho Đồng Bộ & Nút Đồng Bộ Động */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0 ring-4 ring-blue-50">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Quản Lý Tồn Kho &amp; Thẻ Kho
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Theo dõi tồn kho theo vị trí kệ, số lô, hạn sử dụng và lịch sử xuất nhập.
            </p>
          </div>
        </div>

        {/* Bộ Lọc Chi Nhánh Kho & Điều Khiển Đồng Bộ */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-2xs">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0 ml-1" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phạm vi dữ liệu kho:</span>
              <select
                value={normalizeWarehouseCode(selectedWarehouse)}
                onChange={(e) => handleWarehouseChange(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-slate-900 focus:outline-none cursor-pointer pr-4"
              >
                {warehouseList.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nút Đồng Bộ Dữ Liệu Thời Gian Thực */}
          <button
            onClick={handleSyncAll}
            disabled={loadingStocks}
            title="Đồng bộ số dư tồn kho và ma trận cảnh báo mới nhất từ máy chủ"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors text-xs font-bold cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đồng bộ</span>
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStocks ? 'animate-spin' : ''}`} />
          </button>

          {/* Nút Trợ Lý Gemini AI Phân Tích Tồn Kho */}
          <button
            type="button"
            onClick={() => setShowGeminiDrawer(true)}
            title="Hỏi Kora AI giải thích tồn khả dụng, hàng giữ chỗ SO và lô hết hạn/QC Hold"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-400 transition-all text-xs font-bold cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Kora Giải Thích Kho</span>
          </button>

          <div className="hidden lg:flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Cập nhật {lastUpdatedTime}</span>
          </div>
        </div>
      </div>

      {/* 4 Thẻ Chỉ Số Vận Hành Tồn Kho - Bấm trực tiếp để lọc dữ liệu */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Hàng Tồn Vật Lý */}
        <button
          type="button"
          onClick={() => handleKpiCardClick('ALL')}
          className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none group relative ${
            activeTab === 'balance' && kpiFilter === 'ALL'
              ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-sm'
          }`}
          title="Toàn bộ danh mục tồn kho thực tế"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Tổng Tồn Vật Lý</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono mt-1.5 tabular-nums">
                {totalUnits.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-400">SP</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl transition-colors ${activeTab === 'balance' && kpiFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {stocks.length} dòng tồn • {uniqueLocationsCount} vị trí ô kệ
          </div>
        </button>

        {/* Card 2: Hàng Đang Giữ Chỗ Cho Đơn */}
        <button
          type="button"
          onClick={() => handleKpiCardClick('RESERVED')}
          className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none group relative ${
            activeTab === 'balance' && kpiFilter === 'RESERVED'
              ? 'bg-amber-50 border-amber-600 ring-2 ring-amber-600/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-amber-300 hover:shadow-sm'
          }`}
          title="Danh sách hàng đang giữ chỗ"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">Đang Giữ Cho Đơn</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1.5 tabular-nums">
                {totalReserved.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-400">SP</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl transition-colors ${activeTab === 'balance' && kpiFilter === 'RESERVED' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            Cấp phát giữ chỗ theo đơn xuất hàng
          </div>
        </button>

        {/* Card 3: Khóa Xuất & Cách Ly */}
        <button
          type="button"
          onClick={() => handleKpiCardClick('BLOCKED')}
          className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none group relative ${
            activeTab === 'balance' && kpiFilter === 'BLOCKED'
              ? 'bg-rose-50 border-rose-600 ring-2 ring-rose-600/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-rose-300 hover:shadow-sm'
          }`}
          title="Danh sách hàng khóa xuất và cách ly"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Khóa Xuất & Cách Ly</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono mt-1.5 tabular-nums">
                {totalUnavailable.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-400">SP</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl transition-colors ${activeTab === 'balance' && kpiFilter === 'BLOCKED' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              <Ban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-600 font-medium">
            {totalUnavailable > 0 ? 'Lô hết hạn & cách ly chờ xử lý' : 'Không có hàng bị khóa'}
          </div>
        </button>

        {/* Card 4: Tồn Khả Dụng */}
        <button
          type="button"
          onClick={() => handleKpiCardClick('AVAILABLE')}
          className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none group relative ${
            activeTab === 'balance' && kpiFilter === 'AVAILABLE'
              ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-600/30 shadow-md'
              : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-sm'
          }`}
          title="Lọc các mặt hàng có tồn khả dụng sẵn sàng xuất"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Tồn Khả Dụng Xuất</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-1.5 tabular-nums">
                {totalAvailable.toLocaleString('vi-VN')} <span className="text-sm font-bold text-slate-400">SP</span>
              </div>
            </div>
            <div className={`p-2.5 rounded-xl transition-colors ${activeTab === 'balance' && kpiFilter === 'AVAILABLE' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium">
            Sẵn sàng cấp phát cho đơn mới
          </div>
        </button>
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
          <span>Tồn Kho Thực Tế</span>
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
          <span>Thẻ Kho Xuất Nhập</span>
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
          <span>Cảnh Báo Tồn Kho</span>
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
          <StockBalanceTable
            stocks={stocks}
            selectedWarehouse={selectedWarehouse}
            onWarehouseChange={handleWarehouseChange}
            onReserveItem={handleReserveFromTable}
            onViewLedger={handleViewLedgerFromTable}
            onTransfer={handleOpenTransfer}
            activeKpiFilter={kpiFilter}
            onKpiFilterChange={(f) => setKpiFilter(f)}
          />
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
          <RecentLedgerCard
            history={ledgers}
            onSelectEntry={(entry) => {
              setActiveLedgerEntry(entry);
              setShowLedgerModal(true);
            }}
          />
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
            onTransferItem={(item) => {
              const matchedStock = stocks.find(
                (s) => s.sku === item.sku && s.batchNumber === item.batchNumber && s.locationBarcode === item.locationBarcode
              );
              if (matchedStock) {
                handleOpenTransfer(matchedStock);
              } else {
                handleOpenTransfer({
                  id: item.locationId || item.productId,
                  productId: item.productId,
                  sku: item.sku,
                  name: item.productName,
                  unit: item.unit,
                  locationBarcode: item.locationBarcode,
                  batchNumber: item.batchNumber,
                  expiryDate: 'N/A',
                  onHandQty: item.onHandQty,
                  reservedQty: 0,
                  availableQty: item.availableQty || item.onHandQty,
                  warehouseId: item.warehouseId || 1,
                  warehouseName: item.warehouseName || 'Kho Tổng Tân Bình'
                });
              }
            }}
            onViewLedgerItem={(item) => {
              const matchedLedger = ledgers.find((l) => l.productSku === item.sku);
              if (matchedLedger) {
                setActiveLedgerEntry(matchedLedger);
              } else {
                setActiveLedgerEntry({
                  id: `SLOW-${item.productId}-${item.batchId}`,
                  transactionType: 'INBOUND',
                  referenceCode: `SLOW-${item.sku}`,
                  locationBarcode: item.locationBarcode,
                  productSku: item.sku,
                  productName: item.productName,
                  batchNumber: item.batchNumber,
                  expiryDate: 'N/A',
                  qtyChange: item.onHandQty,
                  balanceBefore: 0,
                  balanceAfter: item.onHandQty,
                  performedBy: 'Hệ thống WMS',
                  notes: `Mặt hàng lưu kho ${item.daysInStock} ngày chưa xuất bán. Vốn ứ đọng: ${(item.holdingValue || 0).toLocaleString('vi-VN')} đ`,
                  timestamp: new Date().toLocaleString('vi-VN'),
                  hashSignature: `SHA256:SLOW-${item.batchNumber}`,
                });
              }
              setShowLedgerModal(true);
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
        availableStocks={stocks}
        onSuccess={handleTransferSuccess}
      />

      {/* Modal Chứng Từ Thẻ Kho Bất Biến */}
      {showLedgerModal && activeLedgerEntry && (
        <StockLedgerModal
          entry={activeLedgerEntry}
          onClose={() => setShowLedgerModal(false)}
        />
      )}

      {/* Drawer Trợ Lý Gemini AI Phân Tích Tồn Kho */}
      <GeminiAssistantDrawer
        isOpen={showGeminiDrawer}
        onClose={() => setShowGeminiDrawer(false)}
        context={{
          title: 'Kora AI — Giải Thích Tồn Kho & Ngoại Lệ',
          warehouseCode: normalizeWarehouseCode(selectedWarehouse),
          initialQuestion:
            activeTab === 'alerts'
              ? `Phân tích các lô hàng hết hạn, cận hạn, QC Hold và SKU thiếu tồn tại ${
                  normalizeWarehouseCode(selectedWarehouse) === 'ALL'
                    ? 'các kho được phân quyền'
                    : normalizeWarehouseCode(selectedWarehouse)
                }.`
              : undefined,
        }}
      />
    </div>
  );
};
