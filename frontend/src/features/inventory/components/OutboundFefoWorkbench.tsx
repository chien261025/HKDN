import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Package,
  Clock,
  Lock,
  CheckCircle2,
  Truck,
  Eye,
  Search,
  FileText,
  LayoutList,
  Columns,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { OrderItem, LedgerEntryData, InventoryStats } from '../types';
import { RecentLedgerCard } from './outbound/RecentLedgerCard';
import { OrderDispatchDrawer } from './outbound/OrderDispatchDrawer';
import { StockLedgerModal } from './StockLedgerModal';
import { inventoryService } from '../services/inventoryService';

export const OutboundFefoWorkbench: React.FC = () => {
  // Chế độ hiển thị: 'table' (Bảng dữ liệu) hoặc 'kanban' (Bảng điều phối luồng hàng)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Danh sách đơn hàng xuất mẫu
  const [orders, setOrders] = useState<OrderItem[]>([
    {
      id: '1',
      code: 'OUT-2026-001',
      customer: 'Siêu thị Co.opmart Cống Quỳnh',
      productSku: 'SKU-MILK-100',
      productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      qty: 20,
      status: 'PENDING',
      locationBarcode: 'ZB-B01-R01-S01-B05',
      batchNumber: 'BATCH-MILK-26A',
      expiryDate: '2026-09-25',
      daysRemaining: 13,
      alternateBatch: {
        batchNumber: 'BATCH-MILK-26B',
        expiryDate: '2026-11-30',
        daysRemaining: 81,
        locationBarcode: 'ZB-B01-R01-S02-B06',
        onHand: 200,
      },
    },
    {
      id: '2',
      code: 'OUT-2026-002',
      customer: 'Chuỗi Bán lẻ FPT Shop',
      productSku: 'SKU-SAMS-S24',
      productName: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
      qty: 5,
      status: 'PENDING',
      locationBarcode: 'ZA-A01-R01-S01-B01',
      batchNumber: 'BATCH-S24-01',
      expiryDate: '2028-01-10',
      daysRemaining: 487,
    },
  ]);

  // Bộ lọc tìm kiếm & trạng thái
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RESERVED' | 'SHIPPED'>('ALL');

  // Đơn hàng đang mở Drawer chi tiết cạnh phải
  const [activeDrawerOrder, setActiveDrawerOrder] = useState<OrderItem | null>(null);

  // Tồn kho thực tế của các ô kệ
  const [inventoryStats, setInventoryStats] = useState<Record<string, InventoryStats>>({
    '1': { onHand: 80, reserved: 0, available: 80 },
    '2': { onHand: 25, reserved: 0, available: 25 },
  });

  // Lịch sử giao dịch
  const [ledgerHistory, setLedgerHistory] = useState<LedgerEntryData[]>([
    {
      id: 'LEDGER-001',
      transactionType: 'INBOUND',
      referenceCode: 'INB-2026-001',
      locationBarcode: 'ZB-B01-R01-S01-B05',
      productSku: 'SKU-MILK-100',
      productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      batchNumber: 'BATCH-MILK-26A',
      expiryDate: '2026-09-25',
      qtyChange: 80,
      balanceBefore: 0,
      balanceAfter: 80,
      performedBy: 'Hệ Thống',
      notes: 'Nhập số dư đầu kỳ từ nhà cung cấp Vinamilk',
      timestamp: '10/09/2026 08:30:00',
      hashSignature: '7d5a8b2c4e1f9a0d3b6c8e5f2a1d4b7c89f0e1a2b3c4d5e6f7a8b9c0d1e2f3a4',
    },
  ]);

  useEffect(() => {
    inventoryService.getRecentLedger().then((entries) => {
      if (entries && entries.length > 0) {
        setLedgerHistory(entries);
      }
    });
  }, []);

  // Modal Phiếu Xuất Kho
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);

  // Thao tác 1: Giữ hàng (Reserve)
  const handleReserveOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status !== 'PENDING') return;

    // Gửi yêu cầu giữ hàng tới backend
    inventoryService.reserveStock(1, 5, 1, targetOrder.qty);

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'RESERVED' } : o))
    );

    setInventoryStats((prev) => {
      const cur = prev[orderId] || { onHand: 80, reserved: 0, available: 80 };
      const newReserved = cur.reserved + targetOrder.qty;
      return {
        ...prev,
        [orderId]: {
          onHand: cur.onHand,
          reserved: newReserved,
          available: cur.onHand - newReserved,
        },
      };
    });

    if (activeDrawerOrder?.id === orderId) {
      setActiveDrawerOrder((prev) => prev ? { ...prev, status: 'RESERVED' } : null);
    }
  };

  // Thao tác 2: Xuất kho thực tế (Ship)
  const handleShipOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status !== 'RESERVED') return;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'SHIPPED' } : o))
    );

    const cur = inventoryStats[orderId] || { onHand: 80, reserved: 0, available: 80 };
    const balanceBefore = cur.onHand;
    const balanceAfter = cur.onHand - targetOrder.qty;

    setInventoryStats((prev) => ({
      ...prev,
      [orderId]: {
        onHand: balanceAfter,
        reserved: Math.max(0, cur.reserved - targetOrder.qty),
        available: balanceAfter,
      },
    }));

    const newLedgerEntry: LedgerEntryData = {
      id: `PXK-${Math.floor(1000 + Math.random() * 9000)}`,
      transactionType: 'OUTBOUND',
      referenceCode: targetOrder.code,
      locationBarcode: targetOrder.locationBarcode,
      productSku: targetOrder.productSku,
      productName: targetOrder.productName,
      batchNumber: targetOrder.batchNumber,
      expiryDate: targetOrder.expiryDate,
      qtyChange: -targetOrder.qty,
      balanceBefore,
      balanceAfter,
      performedBy: 'Trần Trưởng Kho',
      notes: `Xuất kho hoàn tất cho khách hàng ${targetOrder.customer}`,
      timestamp: new Date().toLocaleTimeString('vi-VN') + ' - 13/09/2026',
      hashSignature: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
    };

    setLedgerHistory((prev) => [newLedgerEntry, ...prev]);

    if (activeDrawerOrder?.id === orderId) {
      setActiveDrawerOrder((prev) => prev ? { ...prev, status: 'SHIPPED' } : null);
    }
  };

  // Làm mới dữ liệu
  const handleReset = () => {
    setOrders([
      {
        id: '1',
        code: 'OUT-2026-001',
        customer: 'Siêu thị Co.opmart Cống Quỳnh',
        productSku: 'SKU-MILK-100',
        productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
        qty: 20,
        status: 'PENDING',
        locationBarcode: 'ZB-B01-R01-S01-B05',
        batchNumber: 'BATCH-MILK-26A',
        expiryDate: '2026-09-25',
        daysRemaining: 13,
      },
      {
        id: '2',
        code: 'OUT-2026-002',
        customer: 'Chuỗi Bán lẻ FPT Shop',
        productSku: 'SKU-SAMS-S24',
        productName: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
        qty: 5,
        status: 'PENDING',
        locationBarcode: 'ZA-A01-R01-S01-B01',
        batchNumber: 'BATCH-S24-01',
        expiryDate: '2028-01-10',
        daysRemaining: 487,
      },
    ]);
    setInventoryStats({
      '1': { onHand: 80, reserved: 0, available: 80 },
      '2': { onHand: 25, reserved: 0, available: 25 },
    });
    setActiveDrawerOrder(null);
  };

  // Lọc đơn hàng
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productSku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === 'PENDING').length;
  const reservedOrders = orders.filter((o) => o.status === 'RESERVED').length;
  const shippedOrders = orders.filter((o) => o.status === 'SHIPPED').length;

  return (
    <div className="space-y-5">
      {/* 4 THẺ CHỈ SỐ KPI ĐẬM NÉT, RỰC RỠ & GIÀU NĂNG LƯỢNG */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng đơn xuất */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Tổng Đơn Xuất</span>
              <span className="text-3xl font-extrabold text-slate-900 mt-2 block tracking-tight font-mono">{totalOrders}</span>
              <span className="inline-block mt-2 text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Toàn Kho
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 2: Chờ xử lý */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Chờ Xử Lý</span>
              <span className="text-3xl font-extrabold text-amber-700 mt-2 block tracking-tight font-mono">{pendingOrders}</span>
              <span className="inline-block mt-2 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Cần Xử Lý Ngay
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 3: Đã giữ hàng */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Đã Giữ Hàng</span>
              <span className="text-3xl font-extrabold text-blue-700 mt-2 block tracking-tight font-mono">{reservedOrders}</span>
              <span className="inline-block mt-2 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Sẵn Sàng Nhặt
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Card 4: Đã xuất kho */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs sm:text-sm font-semibold text-slate-600 block">Đã Xuất Kho</span>
              <span className="text-3xl font-extrabold text-emerald-700 mt-2 block tracking-tight font-mono">{shippedOrders}</span>
              <span className="inline-block mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Đã Ghi Sổ Kho
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* KHÔNG GIAN ĐIỀU PHỐI XUẤT KHO SẮC NÉT & SANG TRỌNG */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
        {/* Toolbar hiện đại với màu sắc nổi bật */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping"></span>
              <span>Điều Phối Xuất Hàng (FEFO)</span>
            </h2>

            {/* Nút gạt chuyển đổi View Mode: Bảng vs Kanban */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-200 text-xs shadow-inner">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Dạng Bảng</span>
              </button>

              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Luồng Kanban</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Ô tìm kiếm có viền sáng */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn, khách hàng, SKU..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium shadow-xs"
              />
            </div>

            {/* Tab lọc trạng thái */}
            {viewMode === 'table' && (
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất Cả
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'PENDING'
                      ? 'bg-white text-amber-700 font-bold shadow-xs'
                      : 'text-amber-700/80 hover:text-amber-800'
                  }`}
                >
                  Chờ Xuất
                </button>
                <button
                  onClick={() => setStatusFilter('RESERVED')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'RESERVED'
                      ? 'bg-white text-blue-700 font-bold shadow-xs'
                      : 'text-blue-700/80 hover:text-blue-800'
                  }`}
                >
                  Đã Giữ
                </button>
                <button
                  onClick={() => setStatusFilter('SHIPPED')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'SHIPPED'
                      ? 'bg-white text-emerald-700 font-bold shadow-xs'
                      : 'text-emerald-700/80 hover:text-emerald-800'
                  }`}
                >
                  Đã Xuất
                </button>
              </div>
            )}

            {/* Nút reset */}
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300 transition-colors cursor-pointer shadow-xs"
              title="Làm mới lại dữ liệu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CHẾ ĐỘ 1: DẠNG BẢNG DỮ LIỆU ĐẬM ĐÀ & NỔI BẬT (TABLE VIEW) */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left text-xs sm:text-sm text-slate-800">
              <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Mã Đơn</th>
                  <th className="py-3.5 px-4">Khách Hàng</th>
                  <th className="py-3.5 px-4">Sản Phẩm & SKU</th>
                  <th className="py-3.5 px-4 text-center">Số Lượng</th>
                  <th className="py-3.5 px-4">Hạn Dùng & Lô FEFO</th>
                  <th className="py-3.5 px-4">Vị Trí Ô Kệ</th>
                  <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {filteredOrders.map((order) => {
                  const isUrgent = order.daysRemaining < 30;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => setActiveDrawerOrder(order)}
                    >
                      {/* Mã đơn */}
                      <td className="py-4 px-4">
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 group-hover:border-indigo-400 transition-colors shadow-xs">
                          {order.code}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{order.customer}</div>
                      </td>

                      {/* Sản phẩm */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors" title={order.productName}>
                          {order.productName}
                        </div>
                        <div className="inline-block mt-1 font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {order.productSku}
                        </div>
                      </td>

                      {/* Số lượng */}
                      <td className="py-4 px-4 text-center font-mono font-bold text-slate-900 text-base">
                        {order.qty} SP
                      </td>

                      {/* Thước đo HSD FEFO */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-900 text-xs font-bold">{order.batchNumber}</span>
                          {isUrgent && (
                            <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 shadow-xs animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> CẬN HẠN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 mt-1 font-medium">
                          HSD: <strong className="text-rose-600">{order.expiryDate}</strong> (Còn {order.daysRemaining} ngày)
                        </div>
                      </td>

                      {/* Vị Trí Ô Kệ */}
                      <td className="py-4 px-4 font-mono text-xs">
                        <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-bold flex items-center gap-1.5 w-fit shadow-xs">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{order.locationBarcode}</span>
                        </span>
                      </td>

                      {/* Trạng thái sinh động */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-xs ${
                            order.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : order.status === 'RESERVED'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              order.status === 'PENDING'
                                ? 'bg-amber-500 animate-pulse'
                                : order.status === 'RESERVED'
                                ? 'bg-blue-500 animate-ping'
                                : 'bg-emerald-500'
                            }`}
                          ></span>
                          {order.status === 'PENDING'
                            ? 'Chờ Xử Lý'
                            : order.status === 'RESERVED'
                            ? 'Đã Giữ Hàng'
                            : 'Đã Xuất Kho'}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDrawerOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi Tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* CHẾ ĐỘ 2: BẢNG ĐIỀU PHỐI KANBAN PIPELINE RỰC RỠ SẮC MÀU */
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CỘT 1: CHỜ XỬ LÝ (AMBER) */}
            <div className="rounded-2xl overflow-hidden border border-amber-200 shadow-xs bg-amber-50/40">
              {/* Header Cột */}
              <div className="bg-amber-500 p-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-white" />
                  <span>1. Chờ Xuất Kho</span>
                </div>
                <span className="font-mono text-xs font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                  {orders.filter((o) => o.status === 'PENDING').length} đơn
                </span>
              </div>

              {/* Thân Cột */}
              <div className="p-3.5 space-y-3">
                {orders
                  .filter((o) => o.status === 'PENDING')
                  .map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setActiveDrawerOrder(order)}
                      className="p-4 rounded-xl bg-white hover:bg-slate-50 border-l-4 border-l-amber-500 border border-slate-200 transition-all cursor-pointer space-y-2 shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {order.code}
                        </span>
                        <span className="font-mono font-bold text-amber-700 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {order.qty} SP
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors">
                        {order.productName}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{order.customer}</div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {order.locationBarcode.split('-')[4] || 'Ô Kệ'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReserveOrder(order.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Giữ Hàng ➔</span>
                        </button>
                      </div>
                    </div>
                  ))}
                {orders.filter((o) => o.status === 'PENDING').length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 italic">Không có đơn chờ xử lý</div>
                )}
              </div>
            </div>

            {/* CỘT 2: ĐÃ GIỮ HÀNG (BLUE) */}
            <div className="rounded-2xl overflow-hidden border border-blue-200 shadow-xs bg-blue-50/40">
              {/* Header Cột */}
              <div className="bg-blue-600 p-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-white" />
                  <span>2. Đã Giữ Hàng</span>
                </div>
                <span className="font-mono text-xs font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                  {orders.filter((o) => o.status === 'RESERVED').length} đơn
                </span>
              </div>

              {/* Thân Cột */}
              <div className="p-3.5 space-y-3">
                {orders
                  .filter((o) => o.status === 'RESERVED')
                  .map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setActiveDrawerOrder(order)}
                      className="p-4 rounded-xl bg-white hover:bg-slate-50 border-l-4 border-l-blue-600 border border-slate-200 transition-all cursor-pointer space-y-2 shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {order.code}
                        </span>
                        <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {order.qty} SP
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors">
                        {order.productName}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">{order.customer}</div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-blue-700 text-xs flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Đã Khóa Tồn
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShipOrder(order.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Xuất Kho ➔</span>
                        </button>
                      </div>
                    </div>
                  ))}
                {orders.filter((o) => o.status === 'RESERVED').length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 italic">Chưa có đơn đang giữ hàng</div>
                )}
              </div>
            </div>

            {/* CỘT 3: ĐÃ XUẤT KHO (EMERALD) */}
            <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-xs bg-emerald-50/40">
              {/* Header Cột */}
              <div className="bg-emerald-600 p-3.5 flex items-center justify-between text-white">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>3. Đã Xuất Kho</span>
                </div>
                <span className="font-mono text-xs font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full">
                  {orders.filter((o) => o.status === 'SHIPPED').length} đơn
                </span>
              </div>

              {/* Thân Cột */}
              <div className="p-3.5 space-y-3">
                {orders
                  .filter((o) => o.status === 'SHIPPED')
                  .map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setActiveDrawerOrder(order)}
                      className="p-4 rounded-xl bg-white hover:bg-slate-50 border-l-4 border-l-emerald-600 border border-slate-200 transition-all cursor-pointer space-y-2 shadow-xs group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {order.code}
                        </span>
                        <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {order.qty} SP
                        </span>
                      </div>
                      <div className="font-bold text-slate-900 text-sm leading-snug">{order.productName}</div>
                      <div className="text-xs text-slate-500 font-medium">{order.customer}</div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã Ghi Sổ Kho
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const match = ledgerHistory.find((l) => l.referenceCode === order.code) || ledgerHistory[0];
                            setActiveLedgerEntry(match);
                            setShowLedgerModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1 border border-slate-200 shadow-xs cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Xem Phiếu</span>
                        </button>
                      </div>
                    </div>
                  ))}
                {orders.filter((o) => o.status === 'SHIPPED').length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 italic">Chưa có đơn đã xuất kho</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* LỊCH SỬ XUẤT NHẬP KHO GẦN ĐÂY */}
      <RecentLedgerCard
        history={ledgerHistory}
        onSelectEntry={(entry) => {
          setActiveLedgerEntry(entry);
          setShowLedgerModal(true);
        }}
      />

      {/* DRAWER CHI TIẾT ĐƠN HÀNG SLIDE-OVER CẠNH PHẢI (MASTER-DETAIL WORKSPACE) */}
      <OrderDispatchDrawer
        order={activeDrawerOrder}
        stats={activeDrawerOrder ? (inventoryStats[activeDrawerOrder.id] || { onHand: 80, reserved: 0, available: 80 }) : { onHand: 80, reserved: 0, available: 80 }}
        onClose={() => setActiveDrawerOrder(null)}
        onReserve={handleReserveOrder}
        onShip={handleShipOrder}
        onViewLedger={(order) => {
          const match = ledgerHistory.find((l) => l.referenceCode === order.code) || ledgerHistory[0];
          setActiveLedgerEntry(match);
          setShowLedgerModal(true);
        }}
      />

      {/* MODAL PHIẾU XUẤT KHO IN CHỨNG TỪ */}
      {showLedgerModal && activeLedgerEntry && (
        <StockLedgerModal
          entry={activeLedgerEntry}
          onClose={() => setShowLedgerModal(false)}
        />
      )}
    </div>
  );
};


