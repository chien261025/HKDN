import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  Package,
  Calendar,
  Clock,
  Archive,
  Download,
  Search,
  ExternalLink,
  Flame,
  ArrowRight,
  RefreshCw,
  Ban,
  DollarSign,
  Lock,
  ShieldCheck,
  ArrowRightLeft,
  FileText,
  Tag,
  TrendingDown
} from 'lucide-react';
import {
  SafetyStockAlert,
  ExpiringBatchAlert,
  SlowMovingStockAlert,
  inventoryService
} from '../services/inventoryService';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 10;

interface SafetyStockAlertsPanelProps {
  alerts: SafetyStockAlert[];
  expiringAlerts?: ExpiringBatchAlert[];
  slowMovingAlerts?: SlowMovingStockAlert[];
  onCreatePo?: (alert: SafetyStockAlert) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onBatchQuarantined?: () => void;
  onTransferItem?: (item: SlowMovingStockAlert) => void;
  onViewLedgerItem?: (item: SlowMovingStockAlert) => void;
}

type AlertTab = 'safety' | 'expiring' | 'slow_moving';

export const SafetyStockAlertsPanel: React.FC<SafetyStockAlertsPanelProps> = ({
  alerts,
  expiringAlerts = [],
  slowMovingAlerts = [],
  onCreatePo,
  isLoading = false,
  isError = false,
  onRetry,
  onBatchQuarantined,
  onTransferItem,
  onViewLedgerItem,
}) => {
  const [activeTab, setActiveTab] = useState<AlertTab>('safety');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [quarantiningBatchId, setQuarantiningBatchId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Thống kê nhanh
  const safetyCritical = alerts.filter((a) => a.alertLevel === 'CRITICAL' || a.alertLevel === 'OUT_OF_STOCK').length;
  const safetyWarning = alerts.filter((a) => a.alertLevel === 'WARNING').length;

  const expiredCount = expiringAlerts.filter((e) => e.alertLevel === 'EXPIRED').length;
  const nearExpiryCount = expiringAlerts.filter((e) => e.alertLevel === 'CRITICAL' || e.alertLevel === 'WARNING').length;

  const deadStockCount = slowMovingAlerts.filter((s) => s.alertLevel === 'DEAD_STOCK').length;
  const slowCount = slowMovingAlerts.filter((s) => s.alertLevel === 'SLOW_MOVING').length;

  const totalHoldingValue = slowMovingAlerts.reduce((sum, s) => {
    const val = s.holdingValue ?? (s.onHandQty * (s.purchasePrice ?? 0));
    return sum + val;
  }, 0);

  // Bộ lọc dữ liệu theo activeTab
  const filteredSafetyAlerts = alerts.filter((item) => {
    const matchesFilter =
      filterLevel === 'ALL'
        ? true
        : filterLevel === 'CRITICAL'
        ? item.alertLevel === 'CRITICAL' || item.alertLevel === 'OUT_OF_STOCK'
        : item.alertLevel === 'WARNING';
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || item.sku.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const filteredExpiringAlerts = expiringAlerts.filter((item) => {
    const matchesFilter = filterLevel === 'ALL' || item.alertLevel === filterLevel;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.sku.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.batchNumber.toLowerCase().includes(q) ||
      item.locationBarcode.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const filteredSlowAlerts = slowMovingAlerts.filter((item) => {
    const matchesFilter = filterLevel === 'ALL' || item.alertLevel === filterLevel;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.sku.toLowerCase().includes(q) ||
      item.productName.toLowerCase().includes(q) ||
      item.batchNumber.toLowerCase().includes(q) ||
      item.locationBarcode.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const currentDatasetLength =
    activeTab === 'safety'
      ? filteredSafetyAlerts.length
      : activeTab === 'expiring'
      ? filteredExpiringAlerts.length
      : filteredSlowAlerts.length;

  const totalPages = Math.max(1, Math.ceil(currentDatasetLength / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
    setFilterLevel('ALL');
  }, [activeTab, searchQuery]);

  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const visibleSafety = filteredSafetyAlerts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const visibleExpiring = filteredExpiringAlerts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const visibleSlow = filteredSlowAlerts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Xử lý cách ly lô hàng
  const handleQuarantine = async (batchId: number, batchNumber: string) => {
    if (!confirm(`Bạn có chắc chắn muốn phong tỏa cách ly lô ${batchNumber}? Lô hàng này sẽ bị khóa khỏi luồng xuất FEFO.`)) {
      return;
    }
    setQuarantiningBatchId(batchId);
    try {
      await inventoryService.quarantineBatch(batchId, 'Cách ly theo cảnh báo cận date/hết hạn');
      setActionMessage({ type: 'success', text: `Đã đưa lô ${batchNumber} vào khu vực cách ly kiểm định thành công!` });
      onBatchQuarantined?.();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err?.message || `Không thể cách ly lô ${batchNumber}` });
    } finally {
      setQuarantiningBatchId(null);
    }
  };

  // State: Loading
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs space-y-3">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
        <h4 className="font-bold text-slate-800 text-sm">Đang tải dữ liệu cảnh báo tồn kho...</h4>
        <p className="text-xs text-slate-500">Kiểm tra mức tồn an toàn, hạn sử dụng và tốc độ xuất nhập hàng.</p>
      </div>
    );
  }

  // State: Error
  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-xs space-y-3">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto border border-rose-200">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-rose-800 text-base">Không thể tải dữ liệu cảnh báo từ máy chủ</h4>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Đã xảy ra lỗi kết nối với trung tâm phân tích kho. Để đảm bảo an toàn vận hành, hệ thống không tự động suy đoán tồn kho an toàn khi mất kết nối.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại kết nối</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast thông báo hành động */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* 1. Executive Summary Cards (3 Nhóm Cảnh Báo Cốt Lõi) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Card 1: Sắp Hết Hàng / Min-Max */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('safety')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'safety'
              ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span>Sắp Hết Hàng</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1 tabular-nums">
              {alerts.length} <span className="text-xs font-sans font-normal text-slate-500">mặt hàng</span>
            </div>
            <div className="text-xs text-rose-600 font-medium mt-1">
              {safetyCritical} mặt hàng nguy hiểm / hết hàng
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Hàng Hết Hạn / Cận Date */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('expiring')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'expiring'
              ? 'border-rose-500 ring-2 ring-rose-100 bg-rose-50/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-600" />
              <span>Cận Hạn & Hết Hạn</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono mt-1 tabular-nums">
              {expiringAlerts.length} <span className="text-xs font-sans font-normal text-slate-500">lô hàng</span>
            </div>
            <div className="text-xs text-rose-700 font-medium mt-1">
              {expiredCount > 0 ? `${expiredCount} lô đã quá hạn!` : 'Chưa có lô quá hạn'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Phân Tích Tuổi Tồn Kho / Chậm Luân Chuyển */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveTab('slow_moving')}
          className={`bg-white rounded-2xl p-4 sm:p-5 border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            activeTab === 'slow_moving'
              ? 'border-amber-500 ring-2 ring-amber-100 bg-amber-50/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>Tồn Lâu & Chậm Luân Chuyển</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono mt-1 tabular-nums">
              {slowMovingAlerts.length} <span className="text-xs font-sans font-normal text-slate-500">dòng tồn</span>
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">
              {deadStockCount} dòng bất động &gt; 90 ngày
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Sub-Tabs & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Sub-Tabs Button Group */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('safety')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'safety' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sắp Hết Hàng ({alerts.length})
          </button>
          <button
            onClick={() => setActiveTab('expiring')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'expiring' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cận Hạn & Hết Hạn ({expiringAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('slow_moving')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'slow_moving' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chậm Luân Chuyển ({slowMovingAlerts.length})
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo SKU, tên sản phẩm, mã ô kệ, số lô..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-normal"
          />
        </div>
      </div>

      {/* 3. Panel Content Theo Từng Tab Cảnh Báo */}

      {/* TAB 1: SẮP HẾT HÀNG & ROP */}
      {activeTab === 'safety' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-blue-600" />
                <span>Danh Sách Mặt Hàng Dưới Mức Tồn An Toàn</span>
              </h3>
            </div>

            {/* Filter Level Buttons */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterLevel === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({alerts.length})
              </button>
              <button
                onClick={() => setFilterLevel('CRITICAL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterLevel === 'CRITICAL' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Nguy cấp ({safetyCritical})
              </button>
              <button
                onClick={() => setFilterLevel('WARNING')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterLevel === 'WARNING' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Chạm ROP ({safetyWarning})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4 min-w-[220px]">Mặt Hàng & SKU</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Tồn Thực Tế</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Đang Giữ</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Tồn Khả Dụng</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Tồn An Toàn (Min)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Điểm ROP</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Đề Xuất Nhập</th>
                  <th className="py-3 px-4 whitespace-nowrap">Mức Cảnh Báo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {visibleSafety.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      <p className="font-semibold text-slate-700">Tồn kho khả dụng của các mặt hàng đang rất an toàn</p>
                    </td>
                  </tr>
                ) : (
                  visibleSafety.map((item) => {
                    const isCritical = item.alertLevel === 'CRITICAL' || item.alertLevel === 'OUT_OF_STOCK';
                    return (
                      <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{item.productName}</div>
                          <div className="text-slate-500 font-mono text-xs mt-0.5">{item.sku} • {item.categoryName}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-900 tabular-nums">
                          {item.currentOnHand.toLocaleString('vi-VN')} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center tabular-nums">
                          {item.currentReserved > 0 ? (
                            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {item.currentReserved}
                            </span>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center tabular-nums">
                          <span className={`font-bold px-2 py-0.5 rounded ${
                            isCritical
                              ? 'text-rose-700 bg-rose-50 border border-rose-200'
                              : 'text-amber-700 bg-amber-50 border border-amber-200'
                          }`}>
                            {item.currentAvailable.toLocaleString('vi-VN')} {item.unit}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600 text-xs">
                          {item.safetyStock} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-slate-600 text-xs">
                          {item.reorderPoint} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-blue-700 font-mono">
                          +{item.suggestedReorderQty} {item.unit}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {item.alertLevel === 'OUT_OF_STOCK' ? (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertOctagon className="w-3 h-3 text-rose-600" /> Hết Hàng Hoàn Toàn
                            </span>
                          ) : item.alertLevel === 'CRITICAL' ? (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Dưới Tồn An Toàn
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Chạm Ngưỡng ROP
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CẢNH BÁO CẬN DATE & HẾT HẠN */}
      {activeTab === 'expiring' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-600" />
                <span>Kiểm Soát Hạn Dùng Lô Hàng (FEFO)</span>
              </h3>
            </div>

            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setFilterLevel('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterLevel === 'ALL' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả ({expiringAlerts.length})
              </button>
              <button
                onClick={() => setFilterLevel('EXPIRED')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterLevel === 'EXPIRED' ? 'bg-rose-700 text-white' : 'text-slate-600 hover:text-rose-700'
                }`}
              >
                Đã quá hạn ({expiredCount})
              </button>
              <button
                onClick={() => setFilterLevel('CRITICAL')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterLevel === 'CRITICAL' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                Cận hạn &le; 15 ngày
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 min-w-[180px]">Sản Phẩm & SKU</th>
                  <th className="py-3 px-3 whitespace-nowrap">Lô & Vị Trí Ô Kệ</th>
                  <th className="py-3 px-3 whitespace-nowrap">Hạn Dùng (HSD)</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Thời Hạn</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Tồn Vật Lý</th>
                  <th className="py-3 px-3 whitespace-nowrap">Trạng Thái</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {visibleExpiring.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      <p className="font-semibold text-slate-700">Tất cả các lô hàng đều còn hạn sử dụng rất an toàn</p>
                    </td>
                  </tr>
                ) : (
                  visibleExpiring.map((item) => {
                    const isExpired = item.daysRemaining < 0 || item.alertLevel === 'EXPIRED';
                    const isQuarantined = item.batchStatus === 'QUARANTINE' || item.batchStatus === 'QUARANTINED';

                    return (
                      <tr key={`${item.productId}-${item.batchId}-${item.locationId}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{item.productName}</div>
                          <div className="text-slate-500 font-mono text-xs mt-0.5">{item.sku}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-slate-800">{item.batchNumber}</span>
                            {isQuarantined && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                Cách ly
                              </span>
                            )}
                          </div>
                          <div className="mt-1">
                            <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {item.locationBarcode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-mono font-medium text-xs tabular-nums text-slate-700">
                          {item.expiryDate}
                        </td>
                        <td className="py-3 px-2.5 text-center whitespace-nowrap">
                          {isExpired ? (
                            <span className="font-mono font-extrabold text-xs text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                              Quá hạn {Math.abs(item.daysRemaining)} ngày
                            </span>
                          ) : (
                            <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                              item.daysRemaining <= 15
                                ? 'text-rose-700 bg-rose-50 border border-rose-200'
                                : 'text-amber-700 bg-amber-50 border border-amber-200'
                            }`}>
                              Còn {item.daysRemaining} ngày
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-2.5 text-center font-bold text-slate-900 tabular-nums">
                          {item.onHandQty.toLocaleString('vi-VN')} {item.unit}
                        </td>
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          {isQuarantined ? (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldCheck className="w-3 h-3 text-purple-600" /> ĐÃ CÁCH LY
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 text-2xs font-extrabold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                              <AlertOctagon className="w-3 h-3" /> ĐÃ HẾT HẠN
                            </span>
                          ) : item.daysRemaining <= 15 ? (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-500" /> Cận Hạn Nguy Cấp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-2xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" /> Sắp Hết Hạn
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isQuarantined ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold">
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Đã Phong Tỏa</span>
                            </span>
                          ) : isExpired ? (
                            <button
                              onClick={() => handleQuarantine(item.batchId, item.batchNumber)}
                              disabled={quarantiningBatchId === item.batchId}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                              title="Khóa và cách ly lô hàng này khỏi luồng xuất kho"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{quarantiningBatchId === item.batchId ? 'Đang khóa...' : 'Cách Ly Lô'}</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              Sẵn sàng xuất FEFO
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PHÂN TÍCH TUỔI HÀNG TỒN & CHẬM LUÂN CHUYỂN */}
      {activeTab === 'slow_moving' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-600" />
                <span>Phân Tích Tuổi Hàng Tồn Kho (Inventory Aging Analysis)</span>
              </h3>
            </div>

            {/* Vốn chôn đọng Banner & Lọc phân loại */}
            <div className="flex items-center flex-wrap gap-2.5">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl px-3 py-1.5 shadow-2xs">
                <DollarSign className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="text-left">
                  <span className="text-slate-500 font-semibold block text-[10px] uppercase tracking-wider">Tổng Vốn Lưu Kho Bị Đọng:</span>
                  <span className="font-extrabold text-amber-900 font-mono text-sm leading-tight">
                    {totalHoldingValue.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
                <button
                  onClick={() => setFilterLevel('ALL')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterLevel === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({slowMovingAlerts.length})
                </button>
                <button
                  onClick={() => setFilterLevel('DEAD_STOCK')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterLevel === 'DEAD_STOCK' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  Bất động &gt; 90 ngày ({deadStockCount})
                </button>
                <button
                  onClick={() => setFilterLevel('SLOW_MOVING')}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    filterLevel === 'SLOW_MOVING' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chậm luân chuyển ({slowCount})
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-3 min-w-[180px]">Sản Phẩm & SKU</th>
                  <th className="py-3 px-3 whitespace-nowrap">Lô & Vị Trí Ô Kệ</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Tuổi Tồn Kho</th>
                  <th className="py-3 px-3 text-center whitespace-nowrap">Số Lượng Tồn</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Vốn Ứ Đọng</th>
                  <th className="py-3 px-3 whitespace-nowrap">Phân Loại & Khuyến Nghị</th>
                  <th className="py-3 px-3 text-right whitespace-nowrap">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {visibleSlow.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                      <p className="font-semibold text-slate-700">Hàng hóa trong kho có tốc độ luân chuyển rất tốt</p>
                    </td>
                  </tr>
                ) : (
                  visibleSlow.map((item) => {
                    const isDeadStock = item.alertLevel === 'DEAD_STOCK';
                    const holdingVal = item.holdingValue ?? (item.onHandQty * (item.purchasePrice ?? 0));

                    return (
                      <tr key={`${item.productId}-${item.batchId}-${item.locationId}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{item.productName}</div>
                          <div className="text-slate-500 font-mono text-xs mt-0.5">{item.sku} • {item.categoryName}</div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="font-mono font-bold text-xs text-slate-800">{item.batchNumber}</div>
                          <div className="mt-1">
                            <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                              {item.locationBarcode}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2.5 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-0.5 rounded ${
                            isDeadStock
                              ? 'text-amber-900 bg-amber-50 border border-amber-200'
                              : 'text-slate-700 bg-slate-100 border border-slate-200'
                          }`}>
                            <Clock className="w-3 h-3 text-amber-600" />
                            {item.daysInStock} ngày
                          </span>
                        </td>
                        <td className="py-3 px-2.5 text-center font-bold text-slate-900 tabular-nums">
                          {item.onHandQty.toLocaleString('vi-VN')} {item.unit}
                        </td>
                        <td className="py-3 px-2.5 text-right whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                            {holdingVal > 0 ? `${holdingVal.toLocaleString('vi-VN')} đ` : '0 đ'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Giá vốn: {item.purchasePrice ? `${item.purchasePrice.toLocaleString('vi-VN')} đ` : 'Chưa có'}
                          </div>
                        </td>
                        <td className="py-3 px-2.5 whitespace-nowrap">
                          {isDeadStock ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                <Archive className="w-3 h-3 text-amber-700" /> BẤT ĐỘNG (&gt; 90 NGÀY)
                              </span>
                              <div className="text-[11px] font-semibold text-amber-800 flex items-center gap-1 mt-1">
                                <TrendingDown className="w-3 h-3 text-amber-600" /> Ưu tiên giải phóng hàng
                              </div>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 text-2xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-500" /> CHẬM LUÂN CHUYỂN
                              </span>
                              <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 mt-1">
                                <Tag className="w-3 h-3 text-slate-500" /> Kích cầu / bán combo
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onTransferItem?.(item)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Điều chuyển lô hàng này sang ô kệ hoặc khu vực xả hàng"
                            >
                              <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                              <span>Chuyển Ô</span>
                            </button>
                            <button
                              onClick={() => onViewLedgerItem?.(item)}
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Xem lịch sử xuất nhập thẻ kho"
                            >
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span>Thẻ Kho</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {currentDatasetLength > PAGE_SIZE && (
        <Pagination
          currentPage={currentPage}
          totalItems={currentDatasetLength}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};
