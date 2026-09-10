import React, { useState } from 'react';
import {
  Package,
  Lock,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Printer
} from 'lucide-react';
import { StockLedgerModal, LedgerEntryData } from './StockLedgerModal';

interface OrderItem {
  id: string;
  code: string;
  customer: string;
  productSku: string;
  productName: string;
  qty: number;
  status: 'PENDING' | 'RESERVED' | 'SHIPPED';
  locationBarcode: string;
  batchNumber: string;
  expiryDate: string;
  daysRemaining: number;
  alternateBatch?: {
    batchNumber: string;
    expiryDate: string;
    daysRemaining: number;
    locationBarcode: string;
    onHand: number;
  };
}

export const OutboundFefoWorkbench: React.FC = () => {
  // Danh sách đơn xuất mẫu
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
      daysRemaining: 15,
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

  const [selectedOrderId, setSelectedOrderId] = useState<string>('1');
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // Tồn kho thực tế của lô đang chọn
  const [inventoryStats, setInventoryStats] = useState<Record<string, { onHand: number; reserved: number; available: number }>>({
    '1': { onHand: 80, reserved: 0, available: 80 },
    '2': { onHand: 25, reserved: 0, available: 25 },
  });

  const currentStats = inventoryStats[selectedOrderId] || { onHand: 80, reserved: 0, available: 80 };

  // Modal Sổ Cái
  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);
  const [currentLedger, setCurrentLedger] = useState<LedgerEntryData | null>(null);

  // Lịch sử Sổ cái
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
      performedBy: 'Nguyễn Quản Kho',
      notes: 'Nhập số dư đầu kỳ',
      timestamp: '2026-09-08 08:30:00',
      hashSignature: '7d5a8b2c4e1f9a0d3b6c8e5f2a1d4b7c',
    },
  ]);

  // Hành động 1: Giữ hàng (Reserve)
  const handleReserve = () => {
    if (selectedOrder.status !== 'PENDING') return;

    // Cập nhật trạng thái đơn
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'RESERVED' } : o))
    );

    // Cập nhật tồn kho
    setInventoryStats((prev) => ({
      ...prev,
      [selectedOrderId]: {
        onHand: currentStats.onHand,
        reserved: currentStats.reserved + selectedOrder.qty,
        available: currentStats.available - selectedOrder.qty,
      },
    }));
  };

  // Hành động 2: Xuất kho (Ship)
  const handleShip = () => {
    if (selectedOrder.status !== 'RESERVED') return;

    const oldOnHand = currentStats.onHand;
    const newOnHand = oldOnHand - selectedOrder.qty;

    // Cập nhật đơn
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'SHIPPED' } : o))
    );

    // Cập nhật tồn kho (trừ vật lý, giải phóng reserved)
    setInventoryStats((prev) => ({
      ...prev,
      [selectedOrderId]: {
        onHand: newOnHand,
        reserved: 0,
        available: newOnHand,
      },
    }));

    // Tạo bút toán Thẻ kho
    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');
    const entry: LedgerEntryData = {
      id: `LEDGER-OUT-${Math.floor(100 + Math.random() * 900)}`,
      transactionType: 'OUTBOUND',
      referenceCode: selectedOrder.code,
      locationBarcode: selectedOrder.locationBarcode,
      productSku: selectedOrder.productSku,
      productName: selectedOrder.productName,
      batchNumber: selectedOrder.batchNumber,
      expiryDate: selectedOrder.expiryDate,
      qtyChange: -selectedOrder.qty,
      balanceBefore: oldOnHand,
      balanceAfter: newOnHand,
      performedBy: 'Trần Trưởng Kho (CHIEF_OPERATOR)',
      notes: `Xuất kho giao cho ${selectedOrder.customer}`,
      timestamp: timeStr,
      hashSignature: 'e4d8a1f6c3b9e2a5f7d1b8c4e6a0d2f5',
    };

    setCurrentLedger(entry);
    setLedgerHistory((prev) => [entry, ...prev]);
    setShowLedgerModal(true);
  };

  // Đặt lại dữ liệu demo
  const handleReset = () => {
    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrderId ? { ...o, status: 'PENDING' } : o))
    );
    setInventoryStats((prev) => ({
      ...prev,
      [selectedOrderId]: selectedOrderId === '1'
        ? { onHand: 80, reserved: 0, available: 80 }
        : { onHand: 25, reserved: 0, available: 25 },
    }));
  };

  return (
    <div className="space-y-5">
      {/* Thanh Điều Hướng Đơn Giản & Tinh Gọn */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            Điều Phối Xuất Kho & Phân Bổ FEFO
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Khóa bi quan (SELECT FOR UPDATE)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tự động ưu tiên lô cận date, khóa giữ hàng an toàn chống âm kho và ghi sổ cái bất biến.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Đặt Lại Trạng Thái</span>
        </button>
      </div>

      {/* Grid 2 Cột Cân Đối: Nghiệp Vụ (Trái 60%) & Giám Sát Tồn Kho (Phải 40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI: DANH SÁCH ĐƠN & QUY TRÌNH XUẤT HÀNG (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Khối 1: Chọn Đơn Hàng Xuất */}
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              1. Chọn đơn hàng xuất kho
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {orders.map((order) => {
                const isSelected = order.id === selectedOrderId;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-850/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className={isSelected ? 'text-indigo-400 font-bold' : 'text-slate-300 font-medium'}>
                        {order.code}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          order.status === 'SHIPPED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : order.status === 'RESERVED'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {order.status === 'SHIPPED'
                          ? 'Đã xuất kho'
                          : order.status === 'RESERVED'
                          ? 'Đã giữ hàng'
                          : 'Chờ xử lý'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 mt-1.5 truncate">{order.customer}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>SL: <strong className="text-white">{order.qty}</strong></span>
                      <span className="text-slate-300">{order.productSku}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Khối 2: Chi Tiết Đề Xuất FEFO & Lộ Trình Lấy Hàng */}
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                2. Phân tích FEFO & Vị trí lấy hàng
              </span>
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã quét hạn dùng tối ưu
              </span>
            </div>

            {/* Thông tin mặt hàng đang chọn */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs">
              <p className="text-slate-400 text-[11px]">Sản phẩm cần xuất:</p>
              <h3 className="text-sm font-bold text-white mt-0.5">{selectedOrder.productName}</h3>
              <p className="text-slate-400 font-mono text-[11px] mt-1">
                Mã SKU: <span className="text-indigo-300">{selectedOrder.productSku}</span> | Khách nhận:{' '}
                <span className="text-slate-300">{selectedOrder.customer}</span>
              </p>
            </div>

            {/* So sánh Lô FEFO (nếu có 2 lô) */}
            {selectedOrder.alternateBatch && (
              <div className="space-y-2">
                <p className="text-[11px] text-slate-400">So sánh các lô hàng trong kho:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Lô Cận Date Được Chọn */}
                  <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white">{selectedOrder.batchNumber}</span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        FEFO CHỌN
                      </span>
                    </div>
                    <div className="text-[11px] text-rose-300 font-mono">
                      HSD: {selectedOrder.expiryDate} (Còn {selectedOrder.daysRemaining} ngày)
                    </div>
                    <p className="text-[10px] text-slate-400">Hạn gần nhất ➔ Xuất trước chống hỏng.</p>
                  </div>

                  {/* Lô Xa Date Được Giữ Lại */}
                  <div className="p-2.5 rounded-xl bg-slate-950/30 border border-slate-800 text-xs space-y-1 opacity-75">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-slate-300">{selectedOrder.alternateBatch.batchNumber}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        LƯU KHO
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      HSD: {selectedOrder.alternateBatch.expiryDate} (Còn {selectedOrder.alternateBatch.daysRemaining} ngày)
                    </div>
                    <p className="text-[10px] text-slate-500">Hạn còn dài ➔ Giữ lại kho an toàn.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lộ trình nhặt hàng chỉ dẫn */}
            <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Chỉ định ô kệ lấy hàng:
                </span>
                <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
                  {selectedOrder.locationBarcode}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <span>Lộ trình:</span>
                <span className="text-slate-300">Zone B</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-slate-300">Dãy B01</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-slate-300">Kệ R01</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-cyan-300 font-bold">Ô B05 (Lấy {selectedOrder.qty} cái)</span>
              </div>
            </div>

            {/* Khối 3: Hai Nút Thao Tác Trật Tự & Rõ Ràng */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              {/* Nút 1: Khóa giữ hàng */}
              <button
                onClick={handleReserve}
                disabled={selectedOrder.status !== 'PENDING'}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  selectedOrder.status === 'PENDING'
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/20 cursor-pointer'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {selectedOrder.status === 'PENDING'
                    ? `1. Khóa Giữ ${selectedOrder.qty} Cái (Reserve)`
                    : 'Đã Khóa Giữ Hàng'}
                </span>
              </button>

              {/* Nút 2: Xuất kho */}
              <button
                onClick={handleShip}
                disabled={selectedOrder.status !== 'RESERVED'}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  selectedOrder.status === 'RESERVED'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 cursor-pointer'
                    : selectedOrder.status === 'SHIPPED'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>
                  {selectedOrder.status === 'SHIPPED'
                    ? 'Đã Xuất Kho Thành Công'
                    : '2. Xuất Kho (Ship Order)'}
                </span>
              </button>
            </div>

            {/* Nút Xem lại phiếu thẻ kho nếu đã xuất */}
            {selectedOrder.status === 'SHIPPED' && (
              <button
                onClick={() => setShowLedgerModal(true)}
                className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Xem Phiếu Thẻ Kho Của Đơn Này</span>
              </button>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: GIÁM SÁT TỒN KHO & LỊCH SỬ THẺ KHO (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Thẻ 1: Tồn Kho Ô Kệ Đang Thao Tác */}
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tồn kho ô kệ {selectedOrder.locationBarcode}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE
              </span>
            </div>

            {/* 3 Chỉ số lớn, rõ ràng */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* On-Hand */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-medium">Vật lý (On-Hand)</span>
                <span className="text-lg font-extrabold font-mono text-white mt-1 block">
                  {currentStats.onHand}
                </span>
                <span className="text-[9px] text-slate-500">Trên kệ</span>
              </div>

              {/* Reserved */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  currentStats.reserved > 0
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <span className="text-[10px] text-amber-300 block font-medium">Đang giữ (Reserved)</span>
                <span
                  className={`text-lg font-extrabold font-mono mt-1 block ${
                    currentStats.reserved > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}
                >
                  {currentStats.reserved > 0 ? `+${currentStats.reserved}` : '0'}
                </span>
                <span className="text-[9px] text-slate-500">Đơn chờ</span>
              </div>

              {/* Available */}
              <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/30">
                <span className="text-[10px] text-emerald-300 block font-medium">Khả dụng (Available)</span>
                <span className="text-lg font-extrabold font-mono text-emerald-400 mt-1 block">
                  {currentStats.available}
                </span>
                <span className="text-[9px] text-slate-500">Được bán</span>
              </div>
            </div>

            {/* Chú thích kỹ thuật ngắn gọn 1 dòng */}
            <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 font-mono">
              💡 Cơ chế: <span className="text-indigo-300 font-semibold">On-Hand = Reserved + Available</span>. Khóa dữ liệu bằng câu lệnh SELECT FOR UPDATE bảo đảm không bao giờ âm kho.
            </p>
          </div>

          {/* Thẻ 2: Lịch Sử Sổ Cái Thẻ Kho Gần Nhất */}
          <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sổ cái thẻ kho gần nhất (Ledger)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Bất biến</span>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto">
              {ledgerHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setCurrentLedger(item);
                    setShowLedgerModal(true);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-850/60 border border-slate-800 hover:border-indigo-500/40 cursor-pointer transition-colors text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-indigo-300">{item.id}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        item.qtyChange < 0
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[160px]">{item.productName}</span>
                    <span className="font-mono text-slate-200">Tồn sau: {item.balanceAfter}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-850">
                    <span>Đơn: {item.referenceCode}</span>
                    <span>{item.timestamp.split(' ')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Sổ Cái Chi Tiết */}
      {showLedgerModal && currentLedger && (
        <StockLedgerModal entry={currentLedger} onClose={() => setShowLedgerModal(false)} />
      )}
    </div>
  );
};
