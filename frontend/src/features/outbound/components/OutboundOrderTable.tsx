import React, { useEffect, useState, useMemo } from 'react';
import {
  PackageCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Lock,
  Truck,
  Flame,
  Navigation,
  XCircle,
  Search,
  Calendar,
  Filter,
  Download,
  FileText,
  Zap,
  Layers,
  X,
  RotateCcw,
} from 'lucide-react';
import { OutboundOrder } from '../types';
import { OutboundMobileCards } from './OutboundMobileCards';
import { Pagination } from '../../../components/common';
import { OutboundFilterStatus } from './OutboundHeader';
import { cleanOutboundText } from '../services/outboundService';

const PAGE_SIZE = 10;

type DateFilterType = 'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'CUSTOM';

interface OutboundOrderTableProps {
  orders: OutboundOrder[];
  activeStatus?: OutboundFilterStatus;
  onStatusChange?: (status: OutboundFilterStatus) => void;
  onSelectOrder: (order: OutboundOrder) => void;
  onAllocateAndLock: (orderId: string) => void;
  onDispatchOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onOpenPickPath?: (order: OutboundOrder) => void;
  onStartPicking?: (order: OutboundOrder) => void;
  onOpenVoucher?: (order: OutboundOrder) => void;
  onOpenOrderLedger?: (soCode: string) => void;
}

const getLocalDateString = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const OutboundOrderTable: React.FC<OutboundOrderTableProps> = ({
  orders,
  activeStatus = 'ALL',
  onStatusChange,
  onSelectOrder,
  onAllocateAndLock,
  onDispatchOrder,
  onCancelOrder,
  onOpenPickPath,
  onStartPicking,
  onOpenVoucher,
  onOpenOrderLedger,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('ALL');
  const [customDate, setCustomDate] = useState<string>('');

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const yesterdayStr = useMemo(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    return getLocalDateString(y);
  }, []);

  const getOrderUnitLabel = (o: OutboundOrder) => {
    if (!o.items || o.items.length === 0) return 'kiện';
    const units = Array.from(new Set(o.items.map((it) => it.unit).filter(Boolean)));
    if (units.length === 1) return units[0];
    return 'kiện';
  };

  const calculateOrderProgress = (order: OutboundOrder) => {
    const isPending = order.status === 'PENDING';
    const isAllocated = order.status === 'ALLOCATED';
    const isPicking = order.status === 'PICKING';
    const isDispatched = order.status === 'DISPATCHED';
    const isCancelled = order.status === 'CANCELLED';
    const unitLabel = getOrderUnitLabel(order);

    const totalRequested = order.items.reduce((sum, it) => sum + (it.requestedQty || 0), 0);
    const totalAllocated = order.items.reduce((sum, it) => sum + (it.allocatedQty || 0), 0);
    const totalPicked = order.items.reduce((sum, it) => sum + (it.pickedQty || 0), 0);

    if (isCancelled) {
      return {
        stage: 'Đã hủy đơn',
        subText: 'Đã giải phóng hàng giữ',
        percent: 0,
        barColor: 'bg-slate-300',
        textColor: 'text-slate-500',
      };
    }

    if (isPending) {
      return {
        stage: '1. Chờ phân bổ',
        subText: `Chờ cấp phát FEFO (${totalRequested} ${unitLabel})`,
        percent: 0,
        barColor: 'bg-amber-500',
        textColor: 'text-amber-700',
      };
    }

    if (isAllocated) {
      return {
        stage: '2. Đã giữ hàng',
        subText: `Đã khóa ${totalAllocated}/${totalRequested} ${unitLabel} (50%)`,
        percent: 50,
        barColor: 'bg-indigo-600',
        textColor: 'text-indigo-700',
      };
    }

    if (isPicking) {
      const pickPct = totalAllocated > 0 ? Math.round((totalPicked / totalAllocated) * 100) : 50;
      return {
        stage: '3. Đang lấy hàng',
        subText: `Đã nhặt ${totalPicked}/${totalAllocated} ${unitLabel} (${pickPct}%)`,
        percent: Math.min(90, Math.round(50 + pickPct * 0.4)),
        barColor: 'bg-blue-600',
        textColor: 'text-blue-700',
      };
    }

    return {
      stage: '4. Đã xuất kho',
      subText: `Hoàn tất ${totalRequested}/${totalRequested} ${unitLabel} (100%)`,
      percent: 100,
      barColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
    };
  };

  // Lọc theo search, date và status
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status Filter
      if (activeStatus !== 'ALL') {
        if (activeStatus === 'PENDING' && o.status !== 'PENDING') return false;
        if (activeStatus === 'PICKING' && o.status !== 'ALLOCATED' && o.status !== 'PICKING') return false;
        if (activeStatus === 'DISPATCHED' && o.status !== 'DISPATCHED') return false;
      }

      // 2. Search Filter
      const q = searchTerm.toLowerCase().trim();
      if (q) {
        const matchCode = o.soCode.toLowerCase().includes(q);
        const matchCustomer = cleanOutboundText(o.customerName).toLowerCase().includes(q);
        const matchItem = o.items.some(
          (it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
        );
        if (!matchCode && !matchCustomer && !matchItem) return false;
      }

      // 3. Date Filter
      if (dateFilter !== 'ALL') {
        const orderDateStr = o.requiredDate ? o.requiredDate.split(' ')[0] : '';
        if (dateFilter === 'TODAY' && orderDateStr !== todayStr) return false;
        if (dateFilter === 'YESTERDAY' && orderDateStr !== yesterdayStr) return false;
        if (dateFilter === 'CUSTOM' && customDate && orderDateStr !== customDate) return false;
      }

      return true;
    }).sort((a, b) => Number(b.id) - Number(a.id));
  }, [orders, activeStatus, searchTerm, dateFilter, customDate, todayStr, yesterdayStr]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const visibleOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage(1), [activeStatus, searchTerm, dateFilter, customDate]);

  const handleExportCsv = () => {
    const headers = [
      'Mã Đơn SO',
      'Khách Hàng',
      'Kho Xuất',
      'Trạng Thái',
      'Hạn Giao Hàng',
      'Số Lượng SKU',
      'Tổng Số Lượng',
      'Ghi Chú',
    ];

    const rows = filteredOrders.map((o) => {
      const totalReq = o.items.reduce((sum, it) => sum + (it.requestedQty || 0), 0);
      const whName = o.warehouseId === 2 ? 'Kho VSIP Bắc Ninh' : 'Kho Tân Bình';
      return [
        `"${o.soCode}"`,
        `"${cleanOutboundText(o.customerName)}"`,
        `"${whName}"`,
        `"${o.status}"`,
        `"${o.requiredDate}"`,
        o.items.length,
        totalReq,
        `"${(o.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WMS_Danh_Sach_Don_Xuat_SO_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
      {/* Table Header Bar */}
      <div className="p-4 sm:px-5 sm:py-3.5 border-b border-slate-200/90 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
            SO
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <span>Danh Sách Đơn Xuất Kho</span>
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">
              Theo dõi tiến độ từ phê duyệt cấp phát lô FEFO, khóa giữ tồn kho đến nhặt hàng và bàn giao xe tải
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            title="Xuất dữ liệu đơn xuất kho ra file CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất CSV</span>
          </button>
          <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-mono">
            {filteredOrders.length} / {orders.length} Đơn SO
          </span>
        </div>
      </div>

      {/* Toolbar: Search, Date Filter & Status Pills */}
      <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-100 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã SO, tên khách hàng, sản phẩm hoặc SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
          />
        </div>

        {/* Date Filter & Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lọc ngày */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5 shrink-0" />
            <button
              type="button"
              onClick={() => { setDateFilter('ALL'); setCustomDate(''); }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ngày
            </button>
            <button
              type="button"
              onClick={() => { setDateFilter('TODAY'); setCustomDate(''); }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === 'TODAY' ? 'bg-white text-blue-700 shadow-2xs font-bold ring-1 ring-blue-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => { setDateFilter('YESTERDAY'); setCustomDate(''); }}
              className={`px-2 py-0.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                dateFilter === 'YESTERDAY' ? 'bg-white text-blue-700 shadow-2xs font-bold ring-1 ring-blue-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hôm qua
            </button>

            {/* Custom Date Input */}
            <div className="relative flex items-center ml-0.5 border-l border-slate-200 pl-1">
              <input
                type="date"
                value={customDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomDate(val);
                  setDateFilter(val ? 'CUSTOM' : 'ALL');
                }}
                className="px-1.5 py-0.5 text-[11px] font-mono rounded bg-white text-slate-800 border border-slate-200 outline-none focus:border-blue-500"
              />
              {customDate && (
                <button
                  type="button"
                  onClick={() => { setCustomDate(''); setDateFilter('ALL'); }}
                  className="ml-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Xóa lọc ngày"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => onStatusChange?.('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeStatus === 'ALL' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => onStatusChange?.('PENDING')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeStatus === 'PENDING' ? 'bg-amber-500 text-white shadow-xs font-bold' : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Chờ phân bổ ({orders.filter(o => o.status === 'PENDING').length})
            </button>
            <button
              type="button"
              onClick={() => onStatusChange?.('PICKING')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeStatus === 'PICKING' ? 'bg-blue-600 text-white shadow-xs font-bold' : 'text-blue-800 hover:text-blue-950'
              }`}
            >
              Đang lấy hàng ({orders.filter(o => o.status === 'ALLOCATED' || o.status === 'PICKING').length})
            </button>
            <button
              type="button"
              onClick={() => onStatusChange?.('DISPATCHED')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                activeStatus === 'DISPATCHED' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-emerald-800 hover:text-emerald-950'
              }`}
            >
              Đã xuất kho ({orders.filter(o => o.status === 'DISPATCHED').length})
            </button>
          </div>
        </div>
      </div>

      {/* MOBILE CARD VIEW (Block on mobile < 768px) */}
      <OutboundMobileCards
        orders={visibleOrders}
        onSelectOrder={onSelectOrder}
        onAllocateAndLock={onAllocateAndLock}
        onDispatchOrder={onDispatchOrder}
        onCancelOrder={onCancelOrder}
        onOpenPickPath={onOpenPickPath}
        onStartPicking={onStartPicking}
        onOpenVoucher={onOpenVoucher}
      />

      {/* DESKTOP TABLE VIEW (Hidden on mobile < 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Mã Đơn SO / Khách Hàng</th>
              <th className="py-3 px-4 whitespace-nowrap">Hạn Giao Hàng</th>
              <th className="py-3 px-4 whitespace-nowrap">Mặt Hàng & Quy Mô</th>
              <th className="py-3 px-4 min-w-[170px]">Tiến Độ Quy Trình</th>
              <th className="py-3 px-4 whitespace-nowrap">Trạng Thái & Khóa</th>
              <th className="py-3 px-4 text-right whitespace-nowrap min-w-[240px]">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <Filter className="w-7 h-7 text-slate-300" />
                    <span className="font-bold text-slate-800 text-sm">Không tìm thấy đơn xuất kho nào</span>
                    <p className="text-slate-500 text-xs text-center">
                      Không có đơn SO nào thỏa mãn bộ lọc hiện tại. Thử xóa bộ lọc hoặc tìm kiếm lại.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setDateFilter('ALL');
                        setCustomDate('');
                        onStatusChange?.('ALL');
                      }}
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
                const isAllocated = order.status === 'ALLOCATED';
                const isPicking = order.status === 'PICKING';
                const isDispatched = order.status === 'DISPATCHED';
                const isCancelled = order.status === 'CANCELLED';
                const totalRequested = order.items.reduce((sum, it) => sum + (it.requestedQty || 0), 0);
                const totalAllocated = order.items.reduce((sum, it) => sum + (it.allocatedQty || 0), 0);
                const unitLabel = getOrderUnitLabel(order);
                const progress = calculateOrderProgress(order);

                return (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 cursor-pointer" onClick={() => onSelectOrder(order)} title="Nhấn để xem chi tiết đơn xuất kho">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-700 hover:text-blue-900 text-sm font-mono hover:underline">{order.soCode}</span>
                        {order.soCode.startsWith('RTV-') && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300">
                            Xuất Trả NCC
                          </span>
                        )}
                        {order.warehouseId === 2 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Bắc Ninh
                          </span>
                        )}
                        {order.priority === 'URGENT' && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            <Flame className="w-3 h-3 text-rose-600" /> HỎA TỐC
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                        {cleanOutboundText(order.customerName)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <div className="text-slate-900 font-semibold tabular-nums">{order.requiredDate}</div>
                      <div className="text-xs text-slate-400 mt-0.5 tabular-nums">Tạo: {order.orderDate}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <div className="text-slate-900 font-semibold">{order.items.length} mặt hàng</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Tổng: <strong className="text-amber-700 font-bold tabular-nums">{totalRequested}</strong> {unitLabel}
                      </div>
                      {totalAllocated > 0 && totalAllocated < totalRequested && (
                        <div className="mt-1">
                          <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-300">
                            Cấp phát {totalAllocated}/{totalRequested} (Thiếu {totalRequested - totalAllocated})
                          </span>
                        </div>
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
                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-bold" title="Đơn mới, chưa giữ chỗ tồn kho">
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> CHỜ PHÂN BỔ
                        </span>
                      )}
                      {isAllocated && (
                        <span className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 font-bold" title="Đã khóa giữ đúng lô cận hạn cho đơn này">
                          <Lock className="w-3.5 h-3.5 text-indigo-600" /> ĐÃ GIỮ HÀNG
                        </span>
                      )}
                      {isPicking && (
                        <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-bold" title="Thủ kho đang đi nhặt hàng theo lộ trình">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> ĐANG LẤY HÀNG
                        </span>
                      )}
                      {isDispatched && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold" title="Xe tải đã bốc hàng rời kho, đã trừ tồn và ghi sổ cái">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐÃ XUẤT KHO
                        </span>
                      )}
                      {isCancelled && (
                        <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-bold" title="Đã hủy đơn và giải phóng tồn kho đã giữ">
                          <XCircle className="w-3.5 h-3.5 text-slate-500" /> ĐÃ HỦY
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {/* 1. Giai đoạn PENDING: Cần phân bổ lô FEFO */}
                        {isPending && (
                          <>
                            <button
                              onClick={() => onAllocateAndLock(order.id)}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Tự động tìm lô cận date và khóa giữ tồn kho (Reservation)"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Phân Bổ Lô</span>
                            </button>
                            <button
                              onClick={() => onCancelOrder(order.id)}
                              className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Hủy đơn xuất kho"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hủy</span>
                            </button>
                          </>
                        )}

                        {/* 2. Giai đoạn ALLOCATED: Đã giữ hàng -> Thực hiện Picking */}
                        {isAllocated && (
                          <>
                            {onStartPicking && (
                              <button
                                onClick={() => onStartPicking(order)}
                                className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                                title="Mở bảng kê lấy hàng chi tiết theo từng ô kệ (Bin/Rack)"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Lấy Hàng</span>
                              </button>
                            )}
                            {onOpenPickPath && (
                              <button
                                onClick={() => onOpenPickPath(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Xem bản đồ hướng dẫn đường đi ngắn nhất trong kho (SVG 2D)"
                              >
                                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Lộ Trình</span>
                              </button>
                            )}
                            <button
                              onClick={() => onCancelOrder(order.id)}
                              className="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Hủy đơn xuất và giải phóng hàng đã giữ"
                            >
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Hủy</span>
                            </button>
                          </>
                        )}

                        {/* 3. Giai đoạn PICKING: Đã gom hàng xong -> Xuất kho bàn giao xe tải */}
                        {isPicking && (
                          <>
                            <button
                              onClick={() => onDispatchOrder(order.id)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Bàn giao xe tải và chính thức trừ tồn kho On-hand & ghi Stock Ledger"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Xuất Kho & Giao Xe</span>
                            </button>
                            {onStartPicking && (
                              <button
                                onClick={() => onStartPicking(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Xem lại chi tiết số lượng đã gom nhặt"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                                <span>Phiếu Nhặt</span>
                              </button>
                            )}
                            {onOpenPickPath && (
                              <button
                                onClick={() => onOpenPickPath(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Xem bản đồ hướng dẫn đường đi ngắn nhất trong kho (SVG 2D)"
                              >
                                <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Lộ Trình</span>
                              </button>
                            )}
                          </>
                        )}

                        {/* 4. Giai đoạn DISPATCHED: Đã xuất xưởng -> In phiếu xuất kho GIN */}
                        {isDispatched && (
                          <>
                            {onOpenVoucher && (
                              <button
                                onClick={() => onOpenVoucher(order)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1.5 ${
                                  order.soCode.startsWith('RTV-')
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                } text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs`}
                                title={order.soCode.startsWith('RTV-') ? "In phiếu xuất trả nhà cung cấp kiêm biên bản bàn giao chuẩn A4" : "In phiếu xuất kho kiêm biên bản bàn giao vận chuyển chuẩn A4"}
                              >
                                {order.soCode.startsWith('RTV-') ? <RotateCcw className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                <span>{order.soCode.startsWith('RTV-') ? 'Phiếu Trả (RTV)' : 'Phiếu Xuất (GIN)'}</span>
                              </button>
                            )}
                            {onOpenOrderLedger && (
                              <button
                                onClick={() => onOpenOrderLedger(order.soCode)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                title="Tra cứu bút toán ghi sổ cái bất biến Stock Ledger"
                              >
                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Sổ Cái</span>
                              </button>
                            )}
                            <button
                              onClick={() => onSelectOrder(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                              title="Xem chi tiết đơn hàng xuất kho"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>Chi Tiết</span>
                            </button>
                          </>
                        )}

                        {/* 5. Giai đoạn CANCELLED */}
                        {isCancelled && (
                          <button
                            onClick={() => onSelectOrder(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            title="Xem chi tiết đơn hàng đã hủy"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>Chi Tiết</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
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
