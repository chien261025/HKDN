import React, { useState } from 'react';
import {
  Zap,
  Lock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Calendar,
  MapPin,
  Package,
  FileSpreadsheet,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  Info,
  ShieldAlert,
  Hash
} from 'lucide-react';
import { StockLedgerModal, LedgerEntryData } from './StockLedgerModal';

interface OutboundOrderPreset {
  orderCode: string;
  customerName: string;
  productId: number;
  productSku: string;
  productName: string;
  requestedQty: number;
  unitPrice: number;
  priority: 'HIGH' | 'NORMAL';
  batchesAvailable: {
    batchNumber: string;
    expiryDate: string;
    daysRemaining: number;
    locationBarcode: string;
    onHandQty: number;
    isOptimalFefo: boolean;
    reason: string;
  }[];
}

const PRESET_ORDERS: OutboundOrderPreset[] = [
  {
    orderCode: 'OUT-2026-001',
    customerName: 'Hệ thống Siêu thị Co.opmart Cống Quỳnh',
    productId: 1,
    productSku: 'SKU-MILK-100',
    productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
    requestedQty: 20,
    unitPrice: 35000,
    priority: 'HIGH',
    batchesAvailable: [
      {
        batchNumber: 'BATCH-MILK-26A',
        expiryDate: '2026-09-25',
        daysRemaining: 15,
        locationBarcode: 'ZB-B01-R01-S01-B05',
        onHandQty: 80,
        isOptimalFefo: true,
        reason: 'Hạn dùng 25/09/2026 gần nhất (còn 15 ngày) ➔ FEFO ưu tiên giải phóng kho trước để chống hỏng hàng.',
      },
      {
        batchNumber: 'BATCH-MILK-26B',
        expiryDate: '2026-11-30',
        daysRemaining: 81,
        locationBarcode: 'ZB-B01-R01-S02-B06',
        onHandQty: 200,
        isOptimalFefo: false,
        reason: 'Hạn dùng còn dài (81 ngày) ➔ Giữ lại kho, bảo toàn thời hạn lưu kho tối đa cho khách hàng sau.',
      },
    ],
  },
  {
    orderCode: 'OUT-2026-002',
    customerName: 'Chuỗi Bán lẻ Công nghệ FPT Shop',
    productId: 2,
    productSku: 'SKU-SAMS-S24',
    productName: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
    requestedQty: 5,
    unitPrice: 27990000,
    priority: 'HIGH',
    batchesAvailable: [
      {
        batchNumber: 'BATCH-S24-01',
        expiryDate: '2028-01-10',
        daysRemaining: 487,
        locationBarcode: 'ZA-A01-R01-S01-B01',
        onHandQty: 25,
        isOptimalFefo: true,
        reason: 'Lô hàng điện tử đợt 1 nhập tháng 1/2024, bảo hành chính hãng tiêu chuẩn ➔ Xuất trước theo vòng quay vốn.',
      },
    ],
  },
];

export const OutboundFefoWorkbench: React.FC = () => {
  // Current Selected Order
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);
  const currentOrder = PRESET_ORDERS[selectedOrderIndex];

  // Stepper state: 1 = Chọn đơn, 2 = Phân tích FEFO, 3 = Đã khóa Reserve, 4 = Đã xuất Ship
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isLocking, setIsLocking] = useState<boolean>(false);
  const [isShipping, setIsShipping] = useState<boolean>(false);

  // Live Inventory Simulation State for the target batch
  const [targetOnHand, setTargetOnHand] = useState<number>(80);
  const [targetReserved, setTargetReserved] = useState<number>(0);
  const [targetAvailable, setTargetAvailable] = useState<number>(80);

  // Ledger Modal
  const [showLedgerModal, setShowLedgerModal] = useState<boolean>(false);
  const [ledgerEntry, setLedgerEntry] = useState<LedgerEntryData | null>(null);

  // Recent Ledger History Log
  const [recentLedgers, setRecentLedgers] = useState<LedgerEntryData[]>([
    {
      id: 'LEDGER-INIT-001',
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
      notes: 'Nhập kho ban đầu từ nhà cung cấp Vinamilk',
      timestamp: '2026-09-08 09:15:00',
      hashSignature: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    },
  ]);

  // Reset to initial state when switching order
  const handleSelectOrder = (index: number) => {
    setSelectedOrderIndex(index);
    setCurrentStep(1);
    const order = PRESET_ORDERS[index];
    const optimal = order.batchesAvailable.find((b) => b.isOptimalFefo) || order.batchesAvailable[0];
    setTargetOnHand(optimal.onHandQty);
    setTargetReserved(0);
    setTargetAvailable(optimal.onHandQty);
  };

  // Step 1 -> 2: Run FEFO Algorithm
  const handleRunFefo = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setCurrentStep(2);
    }, 600);
  };

  // Step 2 -> 3: Execute Pessimistic Locking (SELECT FOR UPDATE)
  const handleReserveStock = () => {
    setIsLocking(true);
    setTimeout(() => {
      setIsLocking(false);
      const qtyToReserve = currentOrder.requestedQty;
      const newReserved = targetReserved + qtyToReserve;
      const newAvailable = targetOnHand - newReserved;
      setTargetReserved(newReserved);
      setTargetAvailable(newAvailable);
      setCurrentStep(3);
    }, 700);
  };

  // Step 3 -> 4: Ship and Write Immutable Ledger
  const handleShipOrder = () => {
    setIsShipping(true);
    setTimeout(() => {
      setIsShipping(false);
      const shippedQty = currentOrder.requestedQty;
      const oldOnHand = targetOnHand;
      const newOnHand = targetOnHand - shippedQty;
      const newReserved = 0; // Released
      const newAvailable = newOnHand;

      setTargetOnHand(newOnHand);
      setTargetReserved(newReserved);
      setTargetAvailable(newAvailable);

      const optimalBatch = currentOrder.batchesAvailable.find((b) => b.isOptimalFefo) || currentOrder.batchesAvailable[0];
      const now = new Date();
      const timeString = now.toISOString().replace('T', ' ').substring(0, 19);

      const newEntry: LedgerEntryData = {
        id: `LEDGER-${now.getFullYear()}-OUT-${Math.floor(1000 + Math.random() * 9000)}`,
        transactionType: 'OUTBOUND',
        referenceCode: currentOrder.orderCode,
        locationBarcode: optimalBatch.locationBarcode,
        productSku: currentOrder.productSku,
        productName: currentOrder.productName,
        batchNumber: optimalBatch.batchNumber,
        expiryDate: optimalBatch.expiryDate,
        qtyChange: -shippedQty,
        balanceBefore: oldOnHand,
        balanceAfter: newOnHand,
        performedBy: 'Trần Trưởng Kho (ID: 1)',
        notes: `Xuất giao hàng cho ${currentOrder.customerName}. Giữ hàng bằng Pessimistic Lock.`,
        timestamp: timeString,
        hashSignature: `${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      };

      setLedgerEntry(newEntry);
      setRecentLedgers((prev) => [newEntry, ...prev]);
      setCurrentStep(4);
      setShowLedgerModal(true);
    }, 800);
  };

  const handleResetFlow = () => {
    handleSelectOrder(selectedOrderIndex);
  };

  const optimalBatch = currentOrder.batchesAvailable.find((b) => b.isOptimalFefo) || currentOrder.batchesAvailable[0];

  return (
    <div className="space-y-6">
      {/* Telemetry Architecture Header Ribbon */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
            <Zap className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              ĐIỀU PHỐI XUẤT KHO FEFO & KHÓA AN TOÀN ĐỒNG THỜI
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                PESSIMISTIC WRITE ACTIVE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Quy trình 4 bước chuẩn Enterprise: <span className="text-indigo-300 font-semibold">Khởi tạo</span> ➔ <span className="text-cyan-300 font-semibold">Phân tích FEFO</span> ➔ <span className="text-amber-300 font-semibold">Khóa SELECT FOR UPDATE</span> ➔ <span className="text-emerald-300 font-semibold">Thẻ kho Bất biến</span>
            </p>
          </div>
        </div>

        <button
          onClick={handleResetFlow}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all shadow-md"
        >
          <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
          <span>Đặt Lại Demo (Reset)</span>
        </button>
      </div>

      {/* 4-Step Interactive Progress Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { step: 1, title: '1. Chọn Đơn Hàng Xuất', desc: 'Chọn đơn & duyệt danh mục', icon: FileSpreadsheet },
          { step: 2, title: '2. Thuật Toán FEFO', desc: 'Quét hạn dùng & định tuyến', icon: Sparkles },
          { step: 3, title: '3. Khóa Bi Quan (Lock)', desc: 'SELECT FOR UPDATE chống âm kho', icon: Lock },
          { step: 4, title: '4. Xuất Kho & Thẻ Kho', desc: 'Trừ on-hand & sinh sổ cái', icon: ShieldCheck },
        ].map((item) => {
          const isPassed = currentStep > item.step;
          const isCurrent = currentStep === item.step;
          const Icon = item.icon;

          return (
            <div
              key={item.step}
              className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
                isCurrent
                  ? 'bg-gradient-to-b from-indigo-900/40 to-slate-900 border-indigo-500/80 shadow-lg shadow-indigo-900/30'
                  : isPassed
                  ? 'bg-slate-900/70 border-emerald-500/40 text-slate-300'
                  : 'bg-slate-900/40 border-slate-800 text-slate-500'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400"></div>
              )}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/40 ring-2 ring-indigo-400/30'
                      : isPassed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isCurrent ? 'text-white' : isPassed ? 'text-slate-200' : 'text-slate-500'}`}>
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Execution Arena (Split 2 Columns on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Actions & Order Context (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card: BƯỚC 1 - Chọn Đơn Hàng */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                  01
                </span>
                <h3 className="font-bold text-white text-sm">CHỌN ĐƠN HÀNG XUẤT KHO THỬ NGHIỆM</h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                DATABASE SEED MATCHED
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Chọn đơn hàng từ hàng đợi hệ thống:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_ORDERS.map((order, idx) => {
                  const isSelected = selectedOrderIndex === idx;
                  return (
                    <button
                      key={order.orderCode}
                      onClick={() => handleSelectOrder(idx)}
                      disabled={currentStep > 1}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md shadow-indigo-950/50'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                      } ${currentStep > 1 ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between font-mono text-xs font-bold">
                        <span className={isSelected ? 'text-cyan-300' : 'text-slate-300'}>{order.orderCode}</span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded">
                          {order.priority}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 mt-1 truncate">{order.customerName}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                        <span>SL Yêu cầu: <strong className="text-white">{order.requestedQty}</strong></span>
                        <span className="text-emerald-400 font-semibold">{order.productSku}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Order Details Brief Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Khách hàng nhận:</span>
                <span className="text-white font-bold font-sans">{currentOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Sản phẩm xuất:</span>
                <span className="text-cyan-300 font-bold font-sans">{currentOrder.productName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-sans">Số lượng chỉ định:</span>
                <span className="text-base font-extrabold text-amber-400">{currentOrder.requestedQty} cái/hộp</span>
              </div>
            </div>

            {/* Button Step 1 */}
            {currentStep === 1 && (
              <button
                onClick={handleRunFefo}
                disabled={isAnalyzing}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>ĐANG QUÉT HẠN DÙNG (FEFO ENGINE)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-200" />
                    <span>⚡ CHẠY THUẬT TOÁN FEFO & LẬP LỘ TRÌNH NHẶT HÀNG</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Card: BƯỚC 2 - Phân Tích & Bảng Chỉ Định FEFO */}
          {currentStep >= 2 && (
            <div className="glass-panel rounded-2xl p-5 border border-indigo-500/40 space-y-4 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                    02
                  </span>
                  <h3 className="font-bold text-white text-sm">KẾT QUẢ PHÂN TÍCH HẠN DÙNG (FEFO ALLOCATION)</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  OPTIMAL BATCH FOUND
                </span>
              </div>

              {/* Batches Comparison Card */}
              <div className="space-y-2.5">
                <p className="text-xs text-slate-300">
                  Hệ thống phân tích toàn bộ các lô tồn kho hiện có của mặt hàng{' '}
                  <strong className="text-white">{currentOrder.productSku}</strong>:
                </p>

                <div className="space-y-2">
                  {currentOrder.batchesAvailable.map((b) => (
                    <div
                      key={b.batchNumber}
                      className={`p-3.5 rounded-xl border transition-all ${
                        b.isOptimalFefo
                          ? 'bg-emerald-950/30 border-emerald-500/50 shadow-md shadow-emerald-950/20'
                          : 'bg-slate-900/40 border-slate-800/80 opacity-70'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="font-bold text-white">{b.batchNumber}</span>
                          <span className="text-slate-400">| HSD:</span>
                          <strong className={b.isOptimalFefo ? 'text-rose-400' : 'text-slate-300'}>
                            {b.expiryDate}
                          </strong>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            Còn {b.daysRemaining} ngày
                          </span>
                        </div>

                        {b.isOptimalFefo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                            <CheckCircle2 className="w-3 h-3" />
                            ƯU TIÊN XUẤT (FEFO #1)
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                            Bảo vệ trong kho
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 mt-2 font-sans">{b.reason}</p>

                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-slate-400">
                          Vị trí ô kệ: <strong className="text-cyan-300">{b.locationBarcode}</strong>
                        </span>
                        <span className="text-slate-400">
                          Tồn hiện tại: <strong className="text-white">{b.onHandQty} cái</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lộ Trình Nhặt Hàng Pick List */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    Chỉ định Lộ trình di chuyển (Optimal Pick Path):
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400">Dãy ➔ Kệ ➔ Tầng ➔ Ô</span>
                </div>
                <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800/80 flex items-center gap-2 text-xs font-mono text-cyan-300 overflow-x-auto">
                  <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-bold">
                    Zone B
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">Dãy B01</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">Kệ R01</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200">Tầng S01</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-extrabold">
                    Ô B05 (Lấy {currentOrder.requestedQty} hộp)
                  </span>
                </div>
              </div>

              {/* Button Step 2 */}
              {currentStep === 2 && (
                <button
                  onClick={handleReserveStock}
                  disabled={isLocking}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-400 text-white font-bold text-xs shadow-lg shadow-amber-900/30 transition-all flex items-center justify-center gap-2"
                >
                  {isLocking ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>ĐANG KÍCH HOẠT PESSIMISTIC LOCK (SELECT FOR UPDATE)...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>🔒 BƯỚC 3: KHÓA GIỮ {currentOrder.requestedQty} CÁI (PESSIMISTIC LOCKING)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Card: BƯỚC 4 - Xuất Kho & Đóng Thẻ Kho */}
          {currentStep === 3 && (
            <div className="glass-panel rounded-2xl p-5 border border-amber-500/50 space-y-4 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                    03
                  </span>
                  <h3 className="font-bold text-white text-sm">HÀNG ĐÃ ĐƯỢC GIỮ AN TOÀN - SẴN SÀNG XUẤT XE</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  STOCK RESERVED
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 space-y-1 font-sans">
                <p className="font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  Đã khóa giữ {currentOrder.requestedQty} đơn vị tại ô kệ {optimalBatch.locationBarcode}!
                </p>
                <p className="text-[11px] text-slate-300">
                  Các đơn hàng khác cùng mua mặt hàng này vào lúc này sẽ không thể chiếm số hàng trên (chống âm kho).
                  Bấm xuất kho khi hàng đã bốc lên xe tải của đơn vị vận chuyển.
                </p>
              </div>

              <button
                onClick={handleShipOrder}
                disabled={isShipping}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-xl shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
              >
                {isShipping ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>ĐANG TRỪ TỒN VẬT LÝ & GHI SỔ CÁI BẤT BIẾN...</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4" />
                    <span>🚚 BƯỚC 4: XUẤT KHO (SHIP ORDER) & ĐÓNG BÚT TOÁN THẺ KHO</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Step 4 Completed Summary Card */}
          {currentStep === 4 && (
            <div className="glass-panel rounded-2xl p-5 border border-emerald-500/60 bg-emerald-950/20 space-y-4 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>XUẤT KHO HOÀN TẤT THÀNH CÔNG!</span>
                </div>
                <button
                  onClick={() => setShowLedgerModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Xem Lại Chứng Từ Sổ Cái</span>
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Đơn hàng <strong className="text-white font-mono">{currentOrder.orderCode}</strong> đã hoàn tất bàn giao
                cho nhà xe. Tồn vật lý On-Hand đã được trừ vĩnh viễn, giải phóng lượng Reserved và ghi nhận bút toán thẻ
                kho bất biến theo tiêu chuẩn Enterprise WMS.
              </p>

              <button
                onClick={handleResetFlow}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>Thực Hiện Lại Chu Kỳ Xuất Kho Mới</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Live Inventory Balances & Concurrency Telemetry (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Real-time Inventory Gauge Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Số Dư Tồn Kho Tại Ô {optimalBatch.locationBarcode}</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE SYNC
              </span>
            </div>

            {/* Formula display */}
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center text-[11px] font-mono text-slate-400">
              On-Hand ({targetOnHand}) = Reserved ({targetReserved}) + Available ({targetAvailable})
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              {/* On-Hand */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tồn Vật Lý</span>
                <span className="text-xl font-extrabold font-mono text-white">{targetOnHand}</span>
                <span className="text-[9px] text-slate-500 block">Thực tế trên kệ</span>
              </div>

              {/* Reserved */}
              <div
                className={`p-3.5 rounded-2xl border space-y-1 transition-all duration-300 ${
                  targetReserved > 0
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-950/30'
                    : 'bg-slate-900/90 border-slate-800/90'
                }`}
              >
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">Đang Giữ</span>
                <span
                  className={`text-xl font-extrabold font-mono ${
                    targetReserved > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                  }`}
                >
                  {targetReserved > 0 ? `+${targetReserved}` : '0'}
                </span>
                <span className="text-[9px] text-slate-500 block">Khóa cho đơn</span>
              </div>

              {/* Available */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider block">Khả Dụng</span>
                <span className="text-xl font-extrabold font-mono text-emerald-400">{targetAvailable}</span>
                <span className="text-[9px] text-slate-500 block">Được phép bán</span>
              </div>
            </div>

            {/* Pessimistic Lock Code Snippet Explanation */}
            <div className="p-3.5 rounded-xl bg-black/50 border border-slate-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between text-slate-400 text-[10px]">
                <span className="flex items-center gap-1 text-cyan-400 font-bold">
                  <Lock className="w-3 h-3" />
                  DATABASE CONCURRENCY GUARD:
                </span>
                <span className="text-slate-500">PostgreSQL 16</span>
              </div>
              <pre className="text-slate-300 text-[10px] overflow-x-auto p-2 rounded bg-slate-950 border border-slate-800">
                <code>
{`-- Câu lệnh SELECT FOR UPDATE khóa chặt dòng:
SELECT * FROM wms_inventory 
WHERE location_id = 5 
  AND product_id = 1 
  AND batch_id = 1 
FOR UPDATE;`}
                </code>
              </pre>
              <p className="text-[10px] text-slate-400 font-sans">
                💡 Khi transaction đang mở, mọi luồng giao dịch đồng thời khác muốn sửa số dư ô kệ B05 đều phải xếp hàng
                đợi hoặc nhận lỗi Timeout.
              </p>
            </div>
          </div>

          {/* Recent Stock Ledger Audit Log (Live Stream) */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-wider">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Nhật Ký Thẻ Kho Bất Biến (Audit Trail)</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400">wms_stock_ledger</span>
            </div>

            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {recentLedgers.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setLedgerEntry(item);
                    setShowLedgerModal(true);
                  }}
                  className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition-all space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-cyan-300 group-hover:text-cyan-200">{item.id}</span>
                    <span
                      className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                        item.qtyChange < 0
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {item.qtyChange > 0 ? `+${item.qtyChange}` : `${item.qtyChange}`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="truncate max-w-[180px]">{item.productName}</span>
                    <span className="font-mono text-white font-semibold">Tồn sau: {item.balanceAfter}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>Đơn: {item.referenceCode}</span>
                    <span>{item.timestamp.split(' ')[1] || item.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Stock Ledger Modal */}
      {showLedgerModal && ledgerEntry && (
        <StockLedgerModal entry={ledgerEntry} onClose={() => setShowLedgerModal(false)} />
      )}
    </div>
  );
};
