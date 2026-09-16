import React, { useState } from 'react';
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

  // Modal Phiếu Xuất Kho
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [activeLedgerEntry, setActiveLedgerEntry] = useState<LedgerEntryData | null>(null);

  // Thao tác 1: Giữ hàng (Reserve)
  const handleReserveOrder = (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder || targetOrder.status !== 'PENDING') return;

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng đơn xuất */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/90 to-[#0e1424] border border-indigo-500/40 p-4 shadow-xl shadow-indigo-950/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-300 font-semibold block">Tổng Đơn Xuất</span>
              <span className="text-2xl font-black text-white mt-1 block tracking-tight">{totalOrders}</span>
              <span className="inline-block mt-1 text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/40">
                Toàn Kho
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40">
              <Package className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 2: Chờ xử lý */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-950/60 via-slate-900/90 to-[#0e1424] border border-amber-500/40 p-4 shadow-xl shadow-amber-950/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-amber-300 font-semibold block">Chờ Xử Lý</span>
              <span className="text-2xl font-black text-amber-400 mt-1 block tracking-tight">{pendingOrders}</span>
              <span className="inline-block mt-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40">
                Cần Xử Lý Ngay
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/40">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 3: Đã giữ hàng */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-900/90 to-[#0e1424] border border-cyan-500/40 p-4 shadow-xl shadow-cyan-950/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-cyan-300 font-semibold block">Đã Giữ Hàng</span>
              <span className="text-2xl font-black text-cyan-300 mt-1 block tracking-tight">{reservedOrders}</span>
              <span className="inline-block mt-1 text-[10px] font-bold text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40">
                Sẵn Sàng Nhặt
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/40">
              <Lock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Card 4: Đã xuất kho */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900/90 to-[#0e1424] border border-emerald-500/40 p-4 shadow-xl shadow-emerald-950/40">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-300 font-semibold block">Đã Xuất Kho</span>
              <span className="text-2xl font-black text-emerald-300 mt-1 block tracking-tight">{shippedOrders}</span>
              <span className="inline-block mt-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                Đã Ghi Sổ Kho
              </span>
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* KHÔNG GIAN ĐIỀU PHỐI XUẤT KHO SẮC NÉT & SANG TRỌNG */}
      <div className="bg-[#0b1120] rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden space-y-3">
        {/* Toolbar hiện đại với màu sắc nổi bật */}
        <div className="p-4 border-b border-slate-700/80 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wide flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>Điều Phối Xuất Hàng (FEFO)</span>
            </h2>

            {/* Nút gạt chuyển đổi View Mode Bứt Phá: Bảng vs Kanban */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs shadow-inner">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Dạng Bảng</span>
              </button>

              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  viewMode === 'kanban'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white'
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
              <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm mã đơn, khách hàng, SKU..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium"
              />
            </div>

            {/* Tab lọc trạng thái màu sắc rực rỡ */}
            {viewMode === 'table' && (
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all font-bold ${
                    statusFilter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Tất Cả
                </button>
                <button
                  onClick={() => setStatusFilter('PENDING')}
                  className={`px-3 py-1 rounded-lg transition-all font-bold ${
                    statusFilter === 'PENDING'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  Chờ Xuất
                </button>
                <button
                  onClick={() => setStatusFilter('RESERVED')}
                  className={`px-3 py-1 rounded-lg transition-all font-bold ${
                    statusFilter === 'RESERVED'
                      ? 'bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/30'
                      : 'text-cyan-400/80 hover:text-cyan-300'
                  }`}
                >
                  Đã Giữ
                </button>
                <button
                  onClick={() => setStatusFilter('SHIPPED')}
                  className={`px-3 py-1 rounded-lg transition-all font-bold ${
                    statusFilter === 'SHIPPED'
                      ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/30'
                      : 'text-emerald-400/80 hover:text-emerald-300'
                  }`}
                >
                  Đã Xuất
                </button>
              </div>
            )}

            {/* Nút reset */}
            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shadow-sm"
              title="Làm mới lại dữ liệu"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CHẾ ĐỘ 1: DẠNG BẢNG DỮ LIỆU ĐẬM ĐÀ & NỔI BẬT (TABLE VIEW) */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-900 text-xs font-bold text-slate-200 uppercase tracking-wider border-b-2 border-slate-700">
                <tr>
                  <th className="py-3 px-3.5">Mã Đơn</th>
                  <th className="py-3 px-3.5">Khách Hàng</th>
                  <th className="py-3 px-3.5">Sản Phẩm & SKU</th>
                  <th className="py-3 px-3.5 text-center">Số Lượng</th>
                  <th className="py-3 px-3.5">Hạn Dùng & Lô FEFO</th>
                  <th className="py-3 px-3.5">Vị Trí Ô Kệ</th>
                  <th className="py-3 px-3.5 text-center">Trạng Thái</th>
                  <th className="py-3 px-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
                {filteredOrders.map((order) => {
                  const isUrgent = order.daysRemaining < 30;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-indigo-950/30 transition-colors cursor-pointer group"
                      onClick={() => setActiveDrawerOrder(order)}
                    >
                      {/* Mã đơn */}
                      <td className="py-3.5 px-3.5">
                        <span className="font-mono font-black text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/50 group-hover:border-cyan-400 transition-colors shadow-sm">
                          {order.code}
                        </span>
                      </td>

                      {/* Khách hàng */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-white text-sm">{order.customer}</div>
                      </td>

                      {/* Sản phẩm */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors" title={order.productName}>
                          {order.productName}
                        </div>
                        <div className="inline-block mt-0.5 font-mono text-[11px] font-bold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-700/50">
                          {order.productSku}
                        </div>
                      </td>

                      {/* Số lượng */}
                      <td className="py-3.5 px-3.5 text-center font-mono font-black text-amber-300 text-base">
                        {order.qty} SP
                      </td>

                      {/* Thước đo HSD FEFO */}
                      <td className="py-3.5 px-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white text-xs font-bold">{order.batchNumber}</span>
                          {isUrgent && (
                            <span className="text-[10px] font-extrabold bg-gradient-to-r from-rose-600/30 to-red-600/30 text-rose-300 px-2 py-0.5 rounded-md border border-rose-500/60 flex items-center gap-1 shadow-sm shadow-rose-900/30 animate-pulse">
                              <AlertTriangle className="w-3 h-3 text-rose-400" /> CẬN HẠN
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 mt-1 font-medium">
                          HSD: <strong className="text-rose-300">{order.expiryDate}</strong> (Còn {order.daysRemaining} ngày)
                        </div>
                      </td>

                      {/* Vị trí ô kệ */}
                      <td className="py-3.5 px-3.5 font-mono text-xs">
                        <span className="bg-slate-900 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-700/50 font-bold flex items-center gap-1.5 w-fit shadow-sm">
                          <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{order.locationBarcode}</span>
                        </span>
                      </td>

                      {/* Trạng thái sinh động */}
                      <td className="py-3.5 px-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-sm ${
                            order.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-amber-900/20'
                              : order.status === 'RESERVED'
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-cyan-900/20'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-emerald-900/20'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              order.status === 'PENDING'
                                ? 'bg-amber-400 animate-pulse'
                                : order.status === 'RESERVED'
                                ? 'bg-cyan-400 animate-ping'
                                : 'bg-emerald-400'
                            }`}
                          ></span>
                          {order.status === 'PENDING'
                            ? 'Chờ Xử Lý'
                            : order.status === 'RESERVED'
                            ? 'Đã Giữ Hàng'
                            : 'Đã Xuất Kho'}
                        </span>
                      </td>

                      {/* Thao tác rực rỡ */}
                      <td className="py-3.5 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveDrawerOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
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
          /* CHẾ ĐỘ 2: BẢNG ĐIỀU PHỐI KANBAN PIPELINE RỰC RỠ SẮC MÀU (BREAKTHROUGH BOARD) */
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* CỘT 1: CHỜ XỬ LÝ (AMBER / ORANGE RỰC RỠ) */}
            <div className="rounded-2xl overflow-hidden border-2 border-amber-500/50 shadow-2xl shadow-amber-950/40 bg-slate-900/90">
              {/* Header Cột */}
              <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-3.5 flex items-center justify-between text-slate-950">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-slate-950" />
                  <span>1. Chờ Xuất Kho</span>
                </div>
                <span className="font-mono text-xs font-black bg-slate-950 text-amber-400 px-2.5 py-0.5 rounded-full shadow-inner">
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
                      className="p-4 rounded-xl bg-gradient-to-br from-[#141c2e] to-[#0f172a] hover:from-[#1a253d] hover:to-[#131d33] border-l-4 border-l-amber-500 border border-slate-700/80 transition-all cursor-pointer space-y-2.5 shadow-lg group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-cyan-300 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {order.code}
                        </span>
                        <span className="font-mono font-black text-amber-300 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          {order.qty} SP
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm leading-snug group-hover:text-cyan-300 transition-colors">
                        {order.productName}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{order.customer}</div>

                      <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/40 text-[11px]">
                          {order.locationBarcode.split('-')[4] || 'Ô Kệ'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReserveOrder(order.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-500/30 transition-all active:scale-95 cursor-pointer"
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

            {/* CỘT 2: ĐÃ GIỮ HÀNG (CYAN / BLUE NỔI BẬT) */}
            <div className="rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl shadow-cyan-950/40 bg-slate-900/90">
              {/* Header Cột */}
              <div className="bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 p-3.5 flex items-center justify-between text-slate-950">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                  <Lock className="w-4 h-4 text-slate-950" />
                  <span>2. Đã Giữ Hàng</span>
                </div>
                <span className="font-mono text-xs font-black bg-slate-950 text-cyan-300 px-2.5 py-0.5 rounded-full shadow-inner">
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
                      className="p-4 rounded-xl bg-gradient-to-br from-[#141c2e] to-[#0f172a] hover:from-[#1a253d] hover:to-[#131d33] border-l-4 border-l-cyan-400 border border-slate-700/80 transition-all cursor-pointer space-y-2.5 shadow-lg group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-cyan-300 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {order.code}
                        </span>
                        <span className="font-mono font-black text-cyan-300 text-sm bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                          {order.qty} SP
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm leading-snug group-hover:text-cyan-300 transition-colors">
                        {order.productName}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">{order.customer}</div>

                      <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-cyan-300 text-xs flex items-center gap-1 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Đã Khóa Tồn
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShipOrder(order.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-cyan-400/30 transition-all active:scale-95 cursor-pointer"
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

            {/* CỘT 3: ĐÃ XUẤT KHO (EMERALD / TEAL SÁNG RỰC) */}
            <div className="rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-2xl shadow-emerald-950/40 bg-slate-900/90">
              {/* Header Cột */}
              <div className="bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 p-3.5 flex items-center justify-between text-slate-950">
                <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>3. Đã Xuất Kho</span>
                </div>
                <span className="font-mono text-xs font-black bg-slate-950 text-emerald-300 px-2.5 py-0.5 rounded-full shadow-inner">
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
                      className="p-4 rounded-xl bg-gradient-to-br from-[#141c2e] to-[#0f172a] hover:from-[#1a253d] hover:to-[#131d33] border-l-4 border-l-emerald-400 border border-slate-700/80 transition-all cursor-pointer space-y-2.5 shadow-lg group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-emerald-300 text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                          {order.code}
                        </span>
                        <span className="font-mono font-black text-emerald-300 text-sm bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          {order.qty} SP
                        </span>
                      </div>
                      <div className="font-bold text-white text-sm leading-snug">{order.productName}</div>
                      <div className="text-xs text-slate-300 font-medium">{order.customer}</div>

                      <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-xs">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã Ghi Sổ Kho
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const match = ledgerHistory.find((l) => l.referenceCode === order.code) || ledgerHistory[0];
                            setActiveLedgerEntry(match);
                            setShowLedgerModal(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 border border-slate-600 shadow-sm cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
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


