import React, { useEffect, useState, useMemo } from 'react';
import {
  PackagePlus,
  Clock,
  Truck,
  CheckCircle2,
  Eye,
  Layers,
  Search,
  Download,
  Filter,
  ChevronDown,
  ChevronRight,
  Printer,
  AlertTriangle,
  AlertOctagon,
  Calendar,
  Building2,
  X
} from 'lucide-react';
import { InboundOrder } from '../types';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 10;

export type InboundListFilterStatus = 'ALL' | 'PENDING' | 'RECEIVED' | 'STOCKED' | 'QC_ISSUE';

interface InboundOrderListProps {
  orders: InboundOrder[];
  activeStatus?: InboundListFilterStatus;
  onStatusChange?: (status: InboundListFilterStatus) => void;
  busyOrderId?: string | null;
  onSelectOrder: (order: InboundOrder) => void;
  onReceiveClick: (order: InboundOrder) => void;
  onPutawayClick: (order: InboundOrder) => void;
  onPrintVoucher?: (order: InboundOrder) => void;
}

type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'CUSTOM';

// Helper trích xuất chuỗi YYYY-MM-DD địa phương chuẩn xác
export const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getOrderDateString = (o: InboundOrder): string => {
  if (o.expectedDeliveryDate) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(o.expectedDeliveryDate)) {
      return o.expectedDeliveryDate;
    }
    const d = new Date(o.expectedDeliveryDate);
    if (!isNaN(d.getTime())) return getLocalDateString(d);
  }
  return '';
};

export const InboundOrderList: React.FC<InboundOrderListProps> = ({
  orders,
  activeStatus,
  onStatusChange,
  busyOrderId,
  onSelectOrder,
  onReceiveClick,
  onPutawayClick,
  onPrintVoucher,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [internalStatus, setInternalStatus] = useState<InboundListFilterStatus>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customDate, setCustomDate] = useState<string>('');

  const currentStatus = activeStatus !== undefined ? activeStatus : internalStatus;
  const setStatus = (status: InboundListFilterStatus) => {
    if (onStatusChange) {
      onStatusChange(status);
    } else {
      setInternalStatus(status);
    }
  };

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return getLocalDateString(y);
  }, []);

  // Tính số lượng đơn theo từng khoảng ngày để hiển thị huy hiệu (badge)
  const dateCounts = useMemo(() => {
    let today = 0;
    let yesterday = 0;
    let week = 0;

    orders.forEach((o) => {
      const dt = getOrderDateString(o);
      if (dt === todayStr) today++;
      if (dt === yesterdayStr) yesterday++;

      if (dt) {
        const diffTime = new Date(todayStr).getTime() - new Date(dt).getTime();
        const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
        if (diffDays >= 0 && diffDays <= 7) {
          week++;
        }
      }
    });

    return { today, yesterday, week };
  }, [orders, todayStr, yesterdayStr]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFilter('ALL');
    setCustomDate('');
    setStatus('ALL');
    setCurrentPage(1);
  };

  // Quản lý các dòng PO đang mở rộng xem chi tiết mặt hàng (Accordion Drill-Down)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper tính QC
  const getOrderQcMetrics = (o: InboundOrder) => {
    const totalExpected = o.items.reduce((sum, it) => sum + (it.expectedQty || 0), 0);
    const totalReceived = o.items.reduce((sum, it) => sum + (it.receivedQty || 0), 0);
    const totalRejected = o.items.reduce((sum, it) => sum + (it.rejectedQty || 0), 0);
    const totalStocked = o.items.reduce((sum, it) => sum + (it.stockedQty || 0), 0);
    const hasDiscrepancy = (o.status !== 'PENDING') && (totalRejected > 0 || totalReceived !== totalExpected);
    return { totalExpected, totalReceived, totalRejected, totalStocked, hasDiscrepancy };
  };

  // Helper lấy ĐVT đại diện
  const getOrderUnitLabel = (o: InboundOrder) => {
    if (!o.items || o.items.length === 0) return 'kiện';
    const units = Array.from(new Set(o.items.map((it) => it.unit).filter(Boolean)));
    if (units.length === 1) return units[0];
    return 'kiện';
  };

  // Helper tính tiến độ quy trình động theo số lượng thực tế
  const calculateOrderProgress = (order: InboundOrder) => {
    const isPending = order.status === 'PENDING';
    const isReceived = order.status === 'RECEIVED';
    const isStocked = order.status === 'STOCKED';
    const isClosedNoStock = order.status === 'CLOSED_NO_STOCK';
    const unitLabel = getOrderUnitLabel(order);

    if (isClosedNoStock) {
      return {
        stage: 'Đóng đơn',
        subText: 'Không có hàng đạt QC',
        percent: 100,
        barColor: 'bg-slate-400',
        textColor: 'text-slate-600',
      };
    }

    if (isPending) {
      return {
        stage: '1. Chờ tiếp nhận',
        subText: 'Chờ xe tải đến',
        percent: 0,
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700',
      };
    }

    const qc = getOrderQcMetrics(order);
    const targetStock = Math.max(0, qc.totalReceived - qc.totalRejected);

    if (isStocked) {
      return {
        stage: '3. Đã cất kệ & ghi sổ',
        subText: `${qc.totalStocked}/${qc.totalStocked} ${unitLabel} (100%)`,
        percent: 100,
        barColor: 'bg-emerald-500',
        textColor: 'text-emerald-700',
      };
    }

    // isReceived (Tại khu đệm)
    if (targetStock > 0 && qc.totalStocked > 0) {
      const putawayPct = Math.min(100, Math.round((qc.totalStocked / targetStock) * 100));
      return {
        stage: '2. Đang cất lên kệ',
        subText: `${qc.totalStocked}/${targetStock} ${unitLabel} (${putawayPct}%)`,
        percent: Math.min(95, Math.round(50 + putawayPct * 0.45)),
        barColor: 'bg-blue-600',
        textColor: 'text-blue-700',
      };
    }

    const receivePct = qc.totalExpected > 0 ? Math.min(100, Math.round((qc.totalReceived / qc.totalExpected) * 100)) : 100;
    return {
      stage: '2. Tại khu đệm & QC',
      subText: `${qc.totalReceived}/${qc.totalExpected} ${unitLabel} (${receivePct}%)`,
      percent: 50,
      barColor: 'bg-blue-500',
      textColor: 'text-blue-600',
    };
  };

  const qcIssueCount = useMemo(() => {
    return orders.filter((o) => getOrderQcMetrics(o).hasDiscrepancy).length;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        o.poCode.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.items.some(
          (it) =>
            it.productName.toLowerCase().includes(q) ||
            it.sku.toLowerCase().includes(q) ||
            (it.batchNumber && it.batchNumber.toLowerCase().includes(q))
        );

      let matchStatus = true;
      if (currentStatus === 'QC_ISSUE') {
        matchStatus = getOrderQcMetrics(o).hasDiscrepancy;
      } else if (currentStatus !== 'ALL') {
        matchStatus = o.status === currentStatus;
      }

      let matchDate = true;
      const orderDateStr = getOrderDateString(o);
      if (dateFilter === 'TODAY') {
        matchDate = orderDateStr === todayStr;
      } else if (dateFilter === 'YESTERDAY') {
        matchDate = orderDateStr === yesterdayStr;
      } else if (dateFilter === 'WEEK') {
        if (orderDateStr) {
          const diffTime = new Date(todayStr).getTime() - new Date(orderDateStr).getTime();
          const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
          matchDate = diffDays >= 0 && diffDays <= 7;
        } else {
          matchDate = false;
        }
      } else if (dateFilter === 'CUSTOM' && customDate) {
        matchDate = orderDateStr === customDate;
      }

      return matchSearch && matchStatus && matchDate;
    });
  }, [orders, searchTerm, currentStatus, dateFilter, customDate, todayStr, yesterdayStr]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const visibleOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, currentStatus, dateFilter, customDate]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const handleExportCsv = () => {
    const headers = [
      'Mã Đơn PO',
      'Nhà Cung Cấp',
      'Kho Lưu Trữ',
      'Trạng Thái',
      'Ngày Giao Hàng',
      'Số Lượng SKU',
      'Số Lượng Đặt',
      'Thực Nhận',
      'Lỗi QC',
      'Đã Cất Kệ',
      'Tổng Giá Trị (VNĐ)',
      'Ghi Chú',
    ];

    const rows = filteredOrders.map((o) => {
      const qc = getOrderQcMetrics(o);
      const whName = o.warehouseId === 2 ? 'Kho VSIP Bắc Ninh' : 'Kho Tân Bình';
      return [
        `"${o.poCode}"`,
        `"${o.supplierName}"`,
        `"${whName}"`,
        `"${o.status}"`,
        `"${o.expectedDeliveryDate}"`,
        o.items.length,
        qc.totalExpected,
        qc.totalReceived,
        qc.totalRejected,
        qc.totalStocked,
        o.totalValue || 0,
        `"${(o.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WMS_Danh_Sach_Don_Nhap_PO_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Table Title Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <PackagePlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Danh Sách Đơn Nhập Kho (PO)
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Theo dõi tiến độ từ tiếp nhận xe tải, kiểm đếm QC đến cất kệ ô kho và ghi sổ cái Stock Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Xuất dữ liệu đơn nhập kho ra file CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất CSV</span>
          </button>
          <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
            {filteredOrders.length} / {orders.length} Đơn PO
          </span>
        </div>
      </div>

      {/* Search, Status & Date Filters Toolbar */}
      <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-100 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã PO, nhà cung cấp, tên sản phẩm hoặc SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
          />
        </div>

        {/* Date Filter & Status Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lọc Ngày với Preset + Custom Datepicker */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
            
            <button
              type="button"
              onClick={() => { setDateFilter('ALL'); setCustomDate(''); }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ngày
            </button>

            <button
              type="button"
              onClick={() => { setDateFilter('TODAY'); setCustomDate(''); }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                dateFilter === 'TODAY'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold ring-1 ring-blue-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Lọc đơn ngày hôm nay (${todayStr})`}
            >
              <span>Hôm nay</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                dateFilter === 'TODAY' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {dateCounts.today}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setDateFilter('YESTERDAY'); setCustomDate(''); }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                dateFilter === 'YESTERDAY'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold ring-1 ring-blue-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={`Lọc đơn ngày hôm qua (${yesterdayStr})`}
            >
              <span>Hôm qua</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                dateFilter === 'YESTERDAY' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {dateCounts.yesterday}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { setDateFilter('WEEK'); setCustomDate(''); }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                dateFilter === 'WEEK'
                  ? 'bg-white text-blue-700 shadow-2xs font-bold ring-1 ring-blue-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Lọc đơn trong 7 ngày gần đây"
            >
              <span>7 ngày</span>
              <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                dateFilter === 'WEEK' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {dateCounts.week}
              </span>
            </button>

            {/* Custom Date Input */}
            <div className="relative flex items-center ml-0.5 border-l border-slate-200 pl-1">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDate(val);
                  if (val) {
                    setDateFilter('CUSTOM');
                  } else {
                    setDateFilter('ALL');
                  }
                }}
                className={`px-1.5 py-0.5 text-[11px] rounded-lg border outline-none cursor-pointer font-medium ${
                  dateFilter === 'CUSTOM'
                    ? 'bg-white border-blue-500 text-blue-700 ring-1 ring-blue-200'
                    : 'bg-slate-50/80 border-slate-200 text-slate-600 hover:bg-white'
                }`}
                title="Chọn ngày cụ thể từ lịch"
              />
              {dateFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setDateFilter('ALL');
                    setCustomDate('');
                  }}
                  className="ml-1 p-0.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Xóa bộ lọc ngày"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatus('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                currentStatus === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              onClick={() => setStatus('PENDING')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                currentStatus === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Chờ tiếp nhận ({orders.filter((o) => o.status === 'PENDING').length})
            </button>
            <button
              onClick={() => setStatus('RECEIVED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                currentStatus === 'RECEIVED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              Tại khu đệm ({orders.filter((o) => o.status === 'RECEIVED').length})
            </button>
            <button
              onClick={() => setStatus('STOCKED')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                currentStatus === 'STOCKED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Đã cất kệ ({orders.filter((o) => o.status === 'STOCKED').length})
            </button>
            {qcIssueCount > 0 && (
              <button
                onClick={() => setStatus('QC_ISSUE')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  currentStatus === 'QC_ISSUE'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                Có lỗi / Thiếu ({qcIssueCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 w-8 text-center"></th>
              <th className="py-3 px-4 min-w-[200px]">Mã Đơn PO / Nhà Cung Cấp</th>
              <th className="py-3 px-4 whitespace-nowrap">Ngày Giao Hàng</th>
              <th className="py-3 px-4 whitespace-nowrap">Quy Mô & Giá Trị PO</th>
              <th className="py-3 px-4 whitespace-nowrap">Kiểm Đếm & QC</th>
              <th className="py-3 px-4 min-w-[170px]">Tiến Độ Quy Trình</th>
              <th className="py-3 px-4 whitespace-nowrap">Trạng Thái</th>
              <th className="py-3 px-4 text-right whitespace-nowrap min-w-[240px]">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <Filter className="w-7 h-7 text-slate-300" />
                    <span className="font-bold text-slate-800 text-sm">Không tìm thấy đơn nhập kho nào</span>
                    <p className="text-slate-500 text-xs text-center">
                      Không có đơn PO nào thỏa mãn bộ lọc hiện tại
                      {currentStatus !== 'ALL' && ` (Trạng thái: ${currentStatus})`}
                      {dateFilter !== 'ALL' && ` (Ngày: ${dateFilter})`}
                      {searchTerm && ` (Tìm kiếm: "${searchTerm}")`}.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-2 px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      Đặt lại toàn bộ bộ lọc
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              visibleOrders.map((order) => {
                const isPending = order.status === 'PENDING';
                const isReceived = order.status === 'RECEIVED';
                const isStocked = order.status === 'STOCKED';
                const qc = getOrderQcMetrics(order);
                const isExpanded = expandedOrderIds.has(order.id);

                const progress = calculateOrderProgress(order);
                const unitLabel = getOrderUnitLabel(order);

                return (
                  <React.Fragment key={order.id}>
                    <tr
                      onClick={() => toggleExpand(order.id)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer select-none ${
                        isExpanded ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-slate-200 text-slate-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(order.id);
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
                        <div className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                          <span>{order.poCode}</span>
                          {order.warehouseId === 2 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                              Bắc Ninh
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{order.supplierName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="text-slate-900 font-semibold tabular-nums">{order.expectedDeliveryDate}</div>
                        <div className="text-xs text-slate-400 mt-0.5 tabular-nums">Tạo: {order.createdAt}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <div className="text-slate-900 font-semibold">
                          {order.items.length} mặt hàng • <strong className="text-blue-700 font-bold">{qc.totalExpected}</strong> {unitLabel}
                        </div>
                        <div className="text-xs font-bold text-emerald-700 mt-0.5 tabular-nums">
                          {order.totalValue ? `${order.totalValue.toLocaleString('vi-VN')} đ` : '-'}
                        </div>
                      </td>

                      {/* Tình trạng kiểm định QC (Ưu tiên 2) */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {isPending ? (
                          <span className="text-slate-400 italic text-[11px]">Chờ xe tải đến</span>
                        ) : qc.totalRejected > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertOctagon className="w-3 h-3 text-rose-600" /> QC: Lỗi {qc.totalRejected} {unitLabel}
                          </span>
                        ) : qc.totalReceived < qc.totalExpected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Giao thiếu: -{qc.totalExpected - qc.totalReceived} {unitLabel}
                          </span>
                        ) : qc.totalReceived > qc.totalExpected ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Giao thừa: +{qc.totalReceived - qc.totalExpected} {unitLabel}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đạt QC 100%
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-44 space-y-1">
                          <div className="flex justify-between items-center text-xs text-slate-600 font-medium whitespace-nowrap">
                            <span className="font-semibold text-slate-800">{progress.stage}</span>
                            <span className={`font-bold tabular-nums text-xs ${progress.textColor}`}>
                              {progress.percent}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${progress.barColor}`}
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-mono tracking-tight">
                            {progress.subText}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        {order.status === 'CLOSED_NO_STOCK' && <span className="text-amber-700">Đóng · Không có hàng đạt QC</span>}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> CHỜ TIẾP NHẬN
                          </span>
                        )}
                        {isReceived && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <Truck className="w-3.5 h-3.5 text-blue-600" /> TẠI KHU ĐỆM
                          </span>
                        )}
                        {isStocked && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐÃ CẤT KỆ
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {isPending && (
                            <button
                              onClick={() => onReceiveClick(order)}
                              disabled={busyOrderId === order.id}
                              className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs whitespace-nowrap shrink-0"
                            >
                              <Truck className="w-3.5 h-3.5 shrink-0" />
                              <span>Nhận Vào Đệm</span>
                            </button>
                          )}
                          {isReceived && (
                            <button
                              onClick={() => onPutawayClick(order)}
                              disabled={busyOrderId === order.id}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shadow-xs whitespace-nowrap shrink-0"
                            >
                              <Layers className="w-3.5 h-3.5 shrink-0" />
                              <span>Cất Lên Kệ</span>
                            </button>
                          )}

                          {onPrintVoucher && (
                            <button
                              onClick={() => onPrintVoucher(order)}
                              className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                              title="In phiếu nhập kho A4"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" />
                            </button>
                          )}

                          <button
                            onClick={() => onSelectOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Chi Tiết</span>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Drill-Down Accordion Sub-Table (Ưu tiên 3) */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={8} className="p-3 sm:p-4">
                          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                            <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                              <span className="flex items-center gap-1.5 uppercase tracking-wide">
                                <PackagePlus className="w-3.5 h-3.5 text-blue-600" />
                                <span>Chi tiết các mặt hàng trong đơn: {order.poCode}</span>
                              </span>
                              <span className="text-[11px] text-slate-500 font-normal">
                                Nhà cung ứng: <strong>{order.supplierName}</strong>
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                                  <tr>
                                    <th className="py-2 px-3">Mã SKU</th>
                                    <th className="py-2 px-3">Tên Mặt Hàng</th>
                                    <th className="py-2 px-3 text-center">ĐVT</th>
                                    <th className="py-2 px-3 text-center">Số Lượng Đặt</th>
                                    <th className="py-2 px-3 text-center">Thực Nhận</th>
                                    <th className="py-2 px-3 text-center">Lỗi QC</th>
                                    <th className="py-2 px-3 text-center">Đã Cất Kệ</th>
                                    <th className="py-2 px-3">Lô & Hạn Dùng</th>
                                    <th className="py-2 px-3 text-right">Đơn Giá Nhập</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-800">
                                  {order.items.map((it, idx) => (
                                    <tr key={it.id || idx} className="hover:bg-slate-50/90">
                                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{it.sku}</td>
                                      <td className="py-2 px-3 font-semibold text-slate-900">{it.productName}</td>
                                      <td className="py-2 px-3 text-center text-slate-600">{it.unit}</td>
                                      <td className="py-2 px-3 text-center font-bold text-slate-900">{it.expectedQty}</td>
                                      <td className="py-2 px-3 text-center font-bold text-blue-700">{it.receivedQty || 0}</td>
                                      <td className="py-2 px-3 text-center">
                                        {(it.rejectedQty || 0) > 0 ? (
                                          <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                            {it.rejectedQty}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">0</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-center font-bold text-emerald-700">{it.stockedQty || 0}</td>
                                      <td className="py-2 px-3 font-mono text-slate-700">
                                        {it.batchNumber ? (
                                          <span>
                                            <strong>{it.batchNumber}</strong>
                                            {it.expiryDate && <span className="text-slate-500 text-[10px] block">HSD: {it.expiryDate}</span>}
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 italic">Chưa tạo lô</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono text-slate-700">
                                        {it.unitPrice ? `${it.unitPrice.toLocaleString('vi-VN')} đ` : '-'}
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

      <Pagination
        currentPage={currentPage}
        totalItems={filteredOrders.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};
