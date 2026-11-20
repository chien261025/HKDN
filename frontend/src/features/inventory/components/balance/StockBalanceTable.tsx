import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  TrendingDown,
  Lock,
  FileText,
  AlertTriangle,
  ArrowRightLeft,
  Download,
  Package,
  Layers,
  Calendar,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Filter,
  Ban
} from 'lucide-react';
import { StockItem } from '../../types';
import { StockBalanceMobileCards } from './StockBalanceMobileCards';
import { Pagination } from '../../../../components/common';

const PAGE_SIZE = 10;

interface StockBalanceTableProps {
  stocks: StockItem[];
  selectedWarehouse?: string;
  onWarehouseChange?: (whId: string) => void;
  onReserveItem: (
    item: StockItem,
    qty: number,
    details?: { soNumber?: string; reason?: string; duration?: string }
  ) => void;
  onViewLedger?: (item: StockItem) => void;
  onTransfer?: (item: StockItem) => void;
}

type DimensionView = 'product' | 'location' | 'batch';

export const StockBalanceTable: React.FC<StockBalanceTableProps> = ({
  stocks,
  selectedWarehouse: controlledWarehouse,
  onWarehouseChange,
  onReserveItem,
  onViewLedger,
  onTransfer,
}) => {
  const [dimensionView, setDimensionView] = useState<DimensionView>('batch');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [filterReservedOnly, setFilterReservedOnly] = useState(false);
  const [localWarehouse, setLocalWarehouse] = useState<string>('ALL');

  // Quản lý các dòng sản phẩm đang mở rộng chi tiết (drill-down accordion)
  const [expandedProductSkus, setExpandedProductSkus] = useState<Set<string>>(new Set());

  const selectedWarehouse = controlledWarehouse !== undefined ? controlledWarehouse : localWarehouse;
  const handleWarehouseSelect = (val: string) => {
    if (onWarehouseChange) {
      onWarehouseChange(val);
    } else {
      setLocalWarehouse(val);
    }
  };

  const toggleExpandProduct = (sku: string) => {
    setExpandedProductSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) {
        next.delete(sku);
      } else {
        next.add(sku);
      }
      return next;
    });
  };

  const [reserveModalItem, setReserveModalItem] = useState<StockItem | null>(null);
  const [reserveQty, setReserveQty] = useState(5);
  const [reserveSoNumber, setReserveSoNumber] = useState('');
  const [reserveReason, setReserveReason] = useState('Cấp phát xuất kho theo đơn hàng (SO Allocation)');
  const [reserveDuration, setReserveDuration] = useState('24 giờ');
  const [currentPage, setCurrentPage] = useState(1);

  // Danh sách các kho thực tế có dữ liệu
  const warehouseOptions = useMemo(() => {
    const map = new Map<string, string>();
    stocks.forEach((s) => {
      const whName = s.warehouseName || (s.warehouseId === 2 ? 'Kho Phân Phối VSIP Bắc Ninh' : 'Kho Tổng Tân Bình - TP.HCM');
      map.set(String(s.warehouseId || 1), whName);
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [stocks]);

  // Lọc stocks theo tìm kiếm, kho và điều kiện lọc
  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.sku.toLowerCase().includes(q) ||
        s.locationBarcode.toLowerCase().includes(q) ||
        s.batchNumber.toLowerCase().includes(q);

      const matchesExpiring = filterExpiring ? (s.isExpiringSoon || s.isExpired) : true;
      const matchesReserved = filterReservedOnly ? s.reservedQty > 0 : true;
      const matchesWarehouse = selectedWarehouse === 'ALL' || String(s.warehouseId || 1) === String(selectedWarehouse);

      return matchesSearch && matchesExpiring && matchesReserved && matchesWarehouse;
    });
  }, [stocks, searchQuery, filterExpiring, filterReservedOnly, selectedWarehouse]);

  // Gom nhóm Theo Sản Phẩm (Dimension 1) có danh sách các child items để drill-down
  const productAggregated = useMemo(() => {
    const map = new Map<string, {
      sku: string;
      name: string;
      totalOnHand: number;
      totalReserved: number;
      totalAvailable: number;
      locationCount: number;
      locations: Set<string>;
      batches: Set<string>;
      hasExpiring: boolean;
      hasExpired: boolean;
      items: StockItem[];
    }>();

    filteredStocks.forEach((item) => {
      const key = item.sku;
      if (!map.has(key)) {
        map.set(key, {
          sku: item.sku,
          name: item.name,
          totalOnHand: 0,
          totalReserved: 0,
          totalAvailable: 0,
          locationCount: 0,
          locations: new Set(),
          batches: new Set(),
          hasExpiring: false,
          hasExpired: false,
          items: [],
        });
      }
      const entry = map.get(key)!;
      entry.totalOnHand += item.onHandQty;
      entry.totalReserved += item.reservedQty;
      entry.totalAvailable += item.availableQty;
      entry.locations.add(item.locationBarcode);
      entry.batches.add(item.batchNumber);
      entry.items.push(item);
      if (item.isExpired) entry.hasExpired = true;
      else if (item.isExpiringSoon) entry.hasExpiring = true;
    });

    return Array.from(map.values()).map((p) => ({
      ...p,
      locationCount: p.locations.size,
      batchCount: p.batches.size,
    }));
  }, [filteredStocks]);

  // Gom nhóm Theo Vị Trí Ô Kệ (Dimension 2)
  const locationAggregated = useMemo(() => {
    const map = new Map<string, {
      locationBarcode: string;
      totalOnHand: number;
      totalReserved: number;
      totalAvailable: number;
      items: StockItem[];
    }>();

    filteredStocks.forEach((item) => {
      const key = item.locationBarcode;
      if (!map.has(key)) {
        map.set(key, {
          locationBarcode: item.locationBarcode,
          totalOnHand: 0,
          totalReserved: 0,
          totalAvailable: 0,
          items: [],
        });
      }
      const entry = map.get(key)!;
      entry.totalOnHand += item.onHandQty;
      entry.totalReserved += item.reservedQty;
      entry.totalAvailable += item.availableQty;
      entry.items.push(item);
    });

    return Array.from(map.values());
  }, [filteredStocks]);

  // Phân trang tùy theo dimension view hiện tại
  const currentDatasetLength =
    dimensionView === 'product'
      ? productAggregated.length
      : dimensionView === 'location'
      ? locationAggregated.length
      : filteredStocks.length;

  const totalPages = Math.max(1, Math.ceil(currentDatasetLength / PAGE_SIZE));

  useEffect(() => setCurrentPage(1), [dimensionView, searchQuery, filterExpiring, filterReservedOnly, selectedWarehouse]);
  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  const visibleBatchStocks = useMemo(() => {
    return filteredStocks.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredStocks, currentPage]);

  const visibleProducts = useMemo(() => {
    return productAggregated.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [productAggregated, currentPage]);

  const visibleLocations = useMemo(() => {
    return locationAggregated.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [locationAggregated, currentPage]);

  const openReserveModal = (item: StockItem) => {
    setReserveModalItem(item);
    setReserveQty(Math.min(5, Math.max(1, item.availableQty)));
    setReserveSoNumber('');
    setReserveReason('Cấp phát xuất kho theo đơn hàng (SO Allocation)');
    setReserveDuration('24 giờ');
  };

  const handleConfirmReserve = () => {
    if (!reserveModalItem) return;
    onReserveItem(reserveModalItem, reserveQty, {
      soNumber: reserveSoNumber.trim() || undefined,
      reason: reserveReason,
      duration: reserveDuration,
    });
    setReserveModalItem(null);
    setReserveSoNumber('');
  };

  // Xuất CSV Báo Cáo Tồn Kho
  const handleExportCsv = () => {
    const headers = [
      'Mã SKU',
      'Tên Sản Phẩm',
      'Mã Ô Kệ',
      'Số Lô Hàng',
      'Hạn Sử Dụng',
      'Tồn Thực Tế (On-hand)',
      'Đã Giữ Chỗ (Reserved)',
      'Khả Dụng (Available)',
      'Cảnh Báo Cận Hạn'
    ];

    const rows = filteredStocks.map((s) => [
      `"${s.sku}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.locationBarcode}"`,
      `"${s.batchNumber}"`,
      `"${s.expiryDate}"`,
      s.onHandQty,
      s.reservedQty,
      s.availableQty,
      s.isExpiringSoon ? 'CẬN HẠN' : 'BÌNH THƯỜNG'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartWMS_TonKho_${dimensionView}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Toolbar: Bộ lọc 3 Chiều (Dimensions) & Lọc Kho */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Dimension View Tabs (Sản Phẩm - Ô Kệ - Lô Hàng) */}
        <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setDimensionView('batch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              dimensionView === 'batch'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Theo Lô Hàng & HSD ({filteredStocks.length})</span>
          </button>

          <button
            onClick={() => setDimensionView('product')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              dimensionView === 'product'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Theo Sản Phẩm (Drill-down) ({productAggregated.length})</span>
          </button>

          <button
            onClick={() => setDimensionView('location')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              dimensionView === 'location'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Theo Vị Trí Ô Kệ ({locationAggregated.length})</span>
          </button>
        </div>

        {/* Lọc Theo Kho & Xuất CSV */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {warehouseOptions.length > 1 && controlledWarehouse === undefined && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedWarehouse}
                onChange={(e) => handleWarehouseSelect(e.target.value)}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL">Toàn bộ chi nhánh kho</option>
                {warehouseOptions.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-200 shadow-xs transition-colors cursor-pointer shrink-0"
            title="Xuất bảng tồn kho ra Excel/CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Thanh Tìm Kiếm & Quick Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, tên sản phẩm, mã ô kệ, số lô..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-normal"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterExpiring(!filterExpiring)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer w-full sm:w-auto justify-center ${
              filterExpiring
                ? 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <TrendingDown className={`w-3.5 h-3.5 ${filterExpiring ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Chỉ lô cận hạn (FEFO)</span>
          </button>

          <button
            onClick={() => setFilterReservedOnly(!filterReservedOnly)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer w-full sm:w-auto justify-center ${
              filterReservedOnly
                ? 'bg-amber-50 text-amber-700 border-amber-200 ring-2 ring-amber-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Lock className={`w-3.5 h-3.5 ${filterReservedOnly ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Có giữ chỗ (Reserved &gt; 0)</span>
          </button>
        </div>
      </div>

      {/* 3. Render View Tương Ứng Với Dimension Được Chọn */}

      {/* A. VIEW 1: THEO LÔ HÀNG & HSD (Mặc định) */}
      {dimensionView === 'batch' && (
        <>
          {/* Mobile Cards */}
          <div className="block md:hidden">
            <StockBalanceMobileCards
              stocks={visibleBatchStocks}
              onReserveClick={(item) => openReserveModal(item)}
              onViewLedger={onViewLedger}
              onTransfer={onTransfer}
            />
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 min-w-[240px]">Sản Phẩm & SKU</th>
                    <th className="py-3 px-4 min-w-[170px] whitespace-nowrap">Vị Trí Ô Kệ</th>
                    <th className="py-3 px-4 min-w-[210px] whitespace-nowrap">Lô Hàng & Hạn Dùng</th>
                    <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Tồn Cuối (On-Hand)</th>
                    <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Đang Giữ (Reserved)</th>
                    <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Khả Dụng (Available)</th>
                    <th className="py-3 px-4 text-right min-w-[250px] whitespace-nowrap">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {visibleBatchStocks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">Không tìm thấy dòng tồn kho nào</p>
                      </td>
                    </tr>
                  ) : (
                    visibleBatchStocks.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-slate-500 font-mono text-xs mt-0.5 font-medium">
                            {item.sku}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-mono text-xs font-semibold border border-slate-200">
                            {item.locationBarcode}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-slate-800 font-semibold text-xs">
                            {item.batchNumber}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>HSD: <span className="font-medium text-slate-700 tabular-nums">{item.expiryDate}</span></span>
                            {item.isExpired ? (
                              <span className="text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Ban className="w-3 h-3 text-rose-600" /> Đã Hết Hạn
                              </span>
                            ) : item.isExpiringSoon ? (
                              <span className="text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Cận Hạn {item.daysRemaining != null && item.daysRemaining >= 0 ? `(${item.daysRemaining} ngày)` : ''}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-semibold text-slate-900 tabular-nums text-sm">
                          {item.onHandQty.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3.5 px-4 text-center text-sm tabular-nums">
                          {item.reservedQty > 0 ? (
                            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              {item.reservedQty.toLocaleString('vi-VN')}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">0</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center text-sm tabular-nums">
                          <span className={`font-semibold px-2.5 py-0.5 rounded border ${
                            item.isExpired
                              ? 'text-rose-700 bg-rose-50 border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          }`}>
                            {item.availableQty.toLocaleString('vi-VN')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openReserveModal(item)}
                              disabled={item.isExpired || item.availableQty <= 0}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                              title={item.isExpired ? 'Lô hàng đã hết hạn sử dụng - Không thể giữ chỗ xuất bán' : item.availableQty <= 0 ? 'Hết hàng khả dụng' : 'Giữ trước hàng cho đơn xuất'}
                            >
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>Giữ Hàng</span>
                            </button>

                            {onTransfer && (
                              <button
                                onClick={() => onTransfer(item)}
                                disabled={(item.isExpired ? item.onHandQty : item.availableQty) <= 0}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                                title={item.isExpired ? 'Điều chuyển lô hết hạn sang kệ cách ly/hủy' : 'Điều chuyển sang ô kệ khác'}
                              >
                                <ArrowRightLeft className="w-3 h-3 text-blue-600" />
                                <span>Chuyển Ô</span>
                              </button>
                            )}

                            {onViewLedger && (
                              <button
                                onClick={() => onViewLedger(item)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                                title="Xem lịch sử thẻ kho"
                              >
                                <FileText className="w-3 h-3 text-slate-500" />
                                <span>Thẻ Kho</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* B. VIEW 2: THEO SẢN PHẨM CÓ DRILL-DOWN EXPANDABLE ROWS */}
      {dimensionView === 'product' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 w-10 text-center"></th>
                  <th className="py-3 px-4 min-w-[240px]">Sản Phẩm & SKU</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Vị Trí Ô Kệ</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Số Lô Quản Lý</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Tổng Tồn Vật Lý</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Đang Giữ Đơn</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Khả Dụng Xuất</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Trạng Thái Kho</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {visibleProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Không tìm thấy sản phẩm nào</p>
                    </td>
                  </tr>
                ) : (
                  visibleProducts.map((p) => {
                    const isExpanded = expandedProductSkus.has(p.sku);
                    return (
                      <React.Fragment key={p.sku}>
                        <tr
                          onClick={() => toggleExpandProduct(p.sku)}
                          className={`hover:bg-blue-50/40 transition-colors cursor-pointer select-none ${
                            isExpanded ? 'bg-blue-50/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              className="p-1 rounded hover:bg-slate-200 text-slate-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandProduct(p.sku);
                              }}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-blue-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                              <span>{p.name}</span>
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                {p.items.length} chi tiết ô/lô
                              </span>
                            </div>
                            <div className="text-slate-500 font-mono text-xs mt-0.5">{p.sku}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-slate-700">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {p.locationCount} ô kệ
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-xs font-semibold text-slate-700">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {p.batchCount} lô
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-900 tabular-nums">
                            {p.totalOnHand.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-3.5 px-4 text-center tabular-nums">
                            {p.totalReserved > 0 ? (
                              <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {p.totalReserved.toLocaleString('vi-VN')}
                              </span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center tabular-nums">
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                              {p.totalAvailable.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {p.hasExpired ? (
                              <span className="inline-flex items-center gap-1 text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full">
                                <Ban className="w-3 h-3 text-rose-600" /> Có Lô Hết Hạn
                              </span>
                            ) : p.hasExpiring ? (
                              <span className="inline-flex items-center gap-1 text-2xs font-semibold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Có Lô Cận Hạn
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-2xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Tồn Kho Chuẩn
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expandable Drill-Down Sub-Table */}
                        {isExpanded && (
                          <tr className="bg-slate-50/80">
                            <td colSpan={8} className="p-3 sm:p-4">
                              <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Chi tiết phân bổ theo vị trí ô kệ & lô hàng cho SKU: {p.sku}</span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                                      <tr>
                                        <th className="py-2 px-3">Vị Trí Ô Kệ</th>
                                        <th className="py-2 px-3">Số Lô Hàng</th>
                                        <th className="py-2 px-3">Hạn Sử Dụng (HSD)</th>
                                        <th className="py-2 px-3 text-center">Tồn Thực Tế</th>
                                        <th className="py-2 px-3 text-center">Đã Giữ</th>
                                        <th className="py-2 px-3 text-center">Khả Dụng</th>
                                        <th className="py-2 px-3 text-right">Thao Tác</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {p.items.map((subItem) => (
                                        <tr key={subItem.id} className="hover:bg-slate-50/90 transition-colors">
                                          <td className="py-2.5 px-3">
                                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                              {subItem.locationBarcode}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">
                                            {subItem.batchNumber}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            <span className="font-mono text-slate-700 tabular-nums font-medium">
                                              {subItem.expiryDate}
                                            </span>
                                            {subItem.isExpired ? (
                                              <span className="ml-1.5 text-[10px] bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 rounded font-bold inline-flex items-center gap-0.5">
                                                <Ban className="w-2.5 h-2.5 text-rose-600" /> Hết Hạn
                                              </span>
                                            ) : subItem.isExpiringSoon ? (
                                              <span className="ml-1.5 text-[10px] bg-amber-50 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-semibold inline-flex items-center gap-0.5">
                                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Cận Date
                                              </span>
                                            ) : null}
                                          </td>
                                          <td className="py-2.5 px-3 text-center font-bold text-slate-900 tabular-nums">
                                            {subItem.onHandQty}
                                          </td>
                                          <td className="py-2.5 px-3 text-center tabular-nums">
                                            {subItem.reservedQty > 0 ? (
                                              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                                {subItem.reservedQty}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400">0</span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 text-center tabular-nums">
                                            <span className={`font-bold px-2 py-0.2 rounded border ${
                                              subItem.isExpired
                                                ? 'text-rose-700 bg-rose-50 border-rose-200'
                                                : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                            }`}>
                                              {subItem.availableQty}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button
                                                onClick={() => openReserveModal(subItem)}
                                                disabled={subItem.isExpired || subItem.availableQty <= 0}
                                                className="px-2 py-1 rounded text-2xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                title={subItem.isExpired ? 'Lô hàng đã hết hạn sử dụng' : 'Giữ hàng cho đơn xuất'}
                                              >
                                                Giữ Hàng
                                              </button>
                                              {onTransfer && (
                                                <button
                                                  onClick={() => onTransfer(subItem)}
                                                  disabled={(subItem.isExpired ? subItem.onHandQty : subItem.availableQty) <= 0}
                                                  className="px-2 py-1 rounded text-2xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                  title={subItem.isExpired ? 'Điều chuyển lô hết hạn sang kệ cách ly' : 'Điều chuyển sang ô khác'}
                                                >
                                                  Chuyển Ô
                                                </button>
                                              )}
                                              {onViewLedger && (
                                                <button
                                                  onClick={() => onViewLedger(subItem)}
                                                  className="px-2 py-1 rounded text-2xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                                                >
                                                  Thẻ Kho
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. VIEW 3: THEO VỊ TRÍ Ô KỆ (Dimension 2) */}
      {dimensionView === 'location' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[180px] whitespace-nowrap">Mã Vị Trí Ô Kệ</th>
                  <th className="py-3 px-4 min-w-[320px]">Các Sản Phẩm Lưu Trữ Tại Ô</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Tổng Tồn Thực Tế (On-Hand)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Đang Giữ (Reserved)</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Khả Dụng (Available)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {visibleLocations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">Không tìm thấy vị trí ô kệ nào</p>
                    </td>
                  </tr>
                ) : (
                  visibleLocations.map((loc) => (
                    <tr key={loc.locationBarcode} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200">
                          {loc.locationBarcode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {loc.items.map((item) => (
                            <div key={item.id} className="text-xs flex items-center justify-between gap-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                              <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={item.name}>{item.name}</span>
                              <span className="text-slate-500 font-mono">Lô: {item.batchNumber}</span>
                              <span className="font-mono font-bold text-slate-900">{item.onHandQty} SP</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 tabular-nums">
                        {loc.totalOnHand.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums">
                        {loc.totalReserved > 0 ? (
                          <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {loc.totalReserved.toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center tabular-nums">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                          {loc.totalAvailable.toLocaleString('vi-VN')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination chung */}
      {currentDatasetLength > PAGE_SIZE && (
        <Pagination
          currentPage={currentPage}
          totalItems={currentDatasetLength}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal Giữ Hàng (Reserve Stock Modal) */}
      {reserveModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Cấp Phát Giữ Chỗ Tồn Kho (Stock Reservation)</h3>
                <p className="text-xs text-slate-500">Khóa an toàn số dư khả dụng cho đơn hàng và chống vượt tồn</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{reserveModalItem.name}</span>
                <span className="font-mono text-2xs font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {reserveModalItem.sku}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 font-mono text-2xs pt-1 border-t border-slate-200/80">
                <div>Ô lưu trữ: <strong className="text-slate-800">{reserveModalItem.locationBarcode}</strong></div>
                <div>Lô hàng: <strong className="text-slate-800">{reserveModalItem.batchNumber}</strong></div>
                <div>HSD: <strong className="text-slate-700">{reserveModalItem.expiryDate}</strong></div>
                <div>
                  Khả dụng: <strong className="text-emerald-700 font-bold">{reserveModalItem.availableQty} {reserveModalItem.unit || 'SP'}</strong>
                </div>
              </div>
            </div>

            {/* Mã đơn hàng SO tham chiếu */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Mã Đơn Xuất Kho (SO) Tham Chiếu:
              </label>
              <input
                type="text"
                placeholder="Ví dụ: OUT-2026-001 hoặc SO-WINMART-TB01..."
                value={reserveSoNumber}
                onChange={(e) => setReserveSoNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500 bg-white"
              />
            </div>

            {/* Lý do giữ hàng */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Lý Do / Mục Đích Giữ Chỗ:</label>
              <select
                value={reserveReason}
                onChange={(e) => setReserveReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500 bg-white"
              >
                <option value="Cấp phát xuất kho theo đơn hàng (SO Allocation)">Cấp phát xuất kho theo đơn hàng (SO Allocation)</option>
                <option value="Giữ mẫu kiểm định chất lượng (QC / Lab Sample)">Giữ mẫu kiểm định chất lượng (QC / Lab Sample)</option>
                <option value="Dự trữ cho sự kiện / Khuyến mại (Bulk Promo Reserve)">Dự trữ cho sự kiện / Khuyến mại (Bulk Promo Reserve)</option>
                <option value="Bảo lưu xử lý bảo hành / Đổi trả (RMA / Replacement)">Bảo lưu xử lý bảo hành / Đổi trả (RMA / Replacement)</option>
                <option value="Khác">Khác...</option>
              </select>
            </div>

            {/* Thời hạn hiệu lực */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Thời Hạn Hiệu Lực Giữ Chỗ:</label>
              <select
                value={reserveDuration}
                onChange={(e) => setReserveDuration(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-500 bg-white"
              >
                <option value="24 giờ">24 giờ (Mặc định)</option>
                <option value="48 giờ">48 giờ</option>
                <option value="7 ngày">7 ngày</option>
                <option value="Cho đến khi hoàn tất đơn xuất">Cho đến khi hoàn tất đơn xuất</option>
              </select>
            </div>

            {/* Số lượng */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Số lượng muốn giữ chỗ ({reserveModalItem.unit || 'SP'}):
                </label>
                <button
                  type="button"
                  onClick={() => setReserveQty(reserveModalItem.availableQty)}
                  className="text-2xs text-amber-700 hover:text-amber-900 font-bold cursor-pointer"
                >
                  Giữ Tối Đa ({reserveModalItem.availableQty})
                </button>
              </div>
              <input
                type="number"
                min={1}
                max={reserveModalItem.availableQty}
                value={reserveQty}
                onChange={(e) => setReserveQty(Math.max(1, Math.min(reserveModalItem.availableQty, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReserveModalItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReserve}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Xác Nhận Giữ Chỗ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
