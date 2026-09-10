import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  Layers,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu,
  Boxes,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  MapPin,
  Flame
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface BinCell {
  id: string;
  barcode: string;
  aisle: string;
  rack: string;
  shelf: string;
  status: 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'EXPIRING';
  productName?: string;
  sku?: string;
  qty?: number;
  batch?: string;
  expiry?: string;
}

export const DashboardPage: React.FC = () => {
  const [selectedBin, setSelectedBin] = useState<BinCell | null>(null);
  const [isSimulatingLock, setIsSimulatingLock] = useState(false);
  const [simulationResults, setSimulationResults] = useState<{ threadId: number; status: 'SUCCESS' | 'REJECTED'; message: string }[]>([]);
  const [putAwayWeight, setPutAwayWeight] = useState<number>(150);
  const [putAwayResult, setPutAwayResult] = useState<{ zone: string; shelf: string; bin: string; reason: string } | null>(null);

  // Digital Twin Warehouse Grid Mock
  const warehouseGrid: BinCell[] = [
    { id: '1', barcode: 'ZA-A01-R01-S01-B01', aisle: 'A01', rack: 'R01', shelf: 'S01', status: 'OCCUPIED', productName: 'Samsung Galaxy S24 Ultra', sku: 'SKU-SAMS-S24', qty: 25, batch: 'BATCH-S24-01', expiry: '2028-01-10' },
    { id: '2', barcode: 'ZA-A01-R01-S02-B02', aisle: 'A01', rack: 'R01', shelf: 'S02', status: 'EMPTY' },
    { id: '3', barcode: 'ZA-A01-R02-S01-B03', aisle: 'A01', rack: 'R02', shelf: 'S01', status: 'OCCUPIED', productName: 'Nước giặt OMO Matic 3.6kg', sku: 'SKU-OMO-MATIC', qty: 60, batch: 'BATCH-OMO-01', expiry: '2027-03-01' },
    { id: '4', barcode: 'ZA-A02-R01-S01-B04', aisle: 'A02', rack: 'R01', shelf: 'S01', status: 'RESERVED', productName: 'Nước giặt OMO Matic 3.6kg (Đang Giữ)', sku: 'SKU-OMO-MATIC', qty: 15, batch: 'BATCH-OMO-01', expiry: '2027-03-01' },
    { id: '5', barcode: 'ZB-B01-R01-S01-B05', aisle: 'B01', rack: 'R01', shelf: 'S01', status: 'EXPIRING', productName: 'Sữa tươi Vinamilk 100% 1L', sku: 'SKU-MILK-100', qty: 80, batch: 'BATCH-MILK-26A', expiry: '2026-09-25' },
    { id: '6', barcode: 'ZB-B01-R01-S02-B06', aisle: 'B01', rack: 'R01', shelf: 'S02', status: 'OCCUPIED', productName: 'Sữa tươi Vinamilk 100% 1L', sku: 'SKU-MILK-100', qty: 200, batch: 'BATCH-MILK-26B', expiry: '2026-11-30' },
    { id: '7', barcode: 'ZB-B02-R01-S01-B07', aisle: 'B02', rack: 'R01', shelf: 'S01', status: 'EMPTY' },
    { id: '8', barcode: 'ZB-B02-R01-S02-B08', aisle: 'B02', rack: 'R01', shelf: 'S02', status: 'EMPTY' },
  ];

  // Chạy mô phỏng 20 luồng đồng thời
  const runConcurrencyTest = () => {
    setIsSimulatingLock(true);
    setSimulationResults([]);

    const initialStock = 10;
    const totalThreads = 20;
    let reserved = 0;
    const results: { threadId: number; status: 'SUCCESS' | 'REJECTED'; message: string }[] = [];

    for (let i = 1; i <= totalThreads; i++) {
      if (reserved < initialStock) {
        reserved += 1;
        results.push({
          threadId: i,
          status: 'SUCCESS',
          message: `Luồng #${i}: Khóa bi quan thành công! Tồn giữ mới = ${reserved}/10`,
        });
      } else {
        results.push({
          threadId: i,
          status: 'REJECTED',
          message: `Luồng #${i}: BỊ CHẶN AN TOÀN! Hết tồn khả dụng (Available = 0). Chống âm kho thành công!`,
        });
      }
    }

    setTimeout(() => {
      setSimulationResults(results);
      setIsSimulatingLock(false);
    }, 600);
  };

  // Tính toán gợi ý Put-away
  const calculatePutAway = () => {
    if (putAwayWeight > 100) {
      setPutAwayResult({
        zone: 'ZONE_A (Hàng Khô / Tải Nặng)',
        shelf: 'S01 (Tầng Trệt - Ground Shelf)',
        bin: 'ZA-A01-R01-S01-B02',
        reason: `Trọng lượng kiện hàng (${putAwayWeight}kg) > 100kg: Thuật toán tự động định tuyến xuống Tầng trệt S01 để bảo vệ kết cấu cơ học giá kệ.`,
      });
    } else {
      setPutAwayResult({
        zone: 'ZONE_A (Hàng Khô)',
        shelf: 'S02 (Tầng 2 - Standard Shelf)',
        bin: 'ZA-A01-R01-S02-B04',
        reason: `Trọng lượng kiện hàng (${putAwayWeight}kg) <= 100kg: Thuật toán tối ưu hóa vị trí tầng cao S02 để tiết kiệm diện tích sàn tầng trệt.`,
      });
    }
  };

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Futuristic Hero Cockpit Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-[#131b2e] to-slate-900 p-6 border border-slate-800/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-600/20 via-cyan-500/10 to-transparent blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                CONTROL TOWER ONLINE • EVENT-DRIVEN MODULAR MONOLITH
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Trung Tâm Điều Hành Kho Thông Minh
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Hệ thống đang kiểm soát thời gian thực <span className="text-white font-semibold">6 phân khu lưu trữ</span>, động cơ <span className="text-cyan-400 font-semibold">Khóa Bi Quan (Pessimistic Locking)</span> chống âm kho đa luồng, và điều phối lấy hàng theo hạn sử dụng <span className="text-amber-400 font-semibold">FEFO</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/smartquery"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 border border-indigo-400/30"
            >
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Hỏi Trợ Lý AI (Text-to-SQL)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              to="/reports"
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700/60"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Báo Cáo Lớn (RabbitMQ)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cyber Metric Cards (4 KPI Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: SKU */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-cyan-500/50 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tổng Mã SKU Quản Lý</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">1,248</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+12.4% danh mục tháng này</span>
            </div>
          </div>
        </div>

        {/* Card 2: Công Suất Kho */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-indigo-500/50 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Tỷ Lệ Lấp Đầy Ô Kệ</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">78.5%</div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full" style={{ width: '78.5%' }}></div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">314 / 400 ô kệ đang lưu trữ</p>
          </div>
        </div>

        {/* Card 3: FEFO Cận Date */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-rose-500/50 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Cảnh Báo Hạn Dùng (FEFO)</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-400 tracking-tight">4 Lô Hàng</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20 w-fit">
              <Flame className="w-3 h-3" />
              <span>Hạn dưới 30 ngày (Cần xuất trước)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Đơn Đang Xử Lý & Khóa Bi Quan */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-emerald-500/50 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Động Cơ Khóa Đồng Thời</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">18 Đơn Chờ</div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pessimistic Lock: 0 Âm Kho</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Row: 2 Cột Lớn */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI (7 Cột): Bản Đồ Digital Twin Kho Hàng (Interactive Heatmap) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-indigo-400" />
                  Mô Hình Không Gian Ô Kệ Trực Quan (Digital Twin Warehouse Grid)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Click vào ô kệ bất kỳ để soi chi tiết lô hàng, SKU và tải trọng thời gian thực</p>
              </div>

              {/* Chú thích trạng thái màu */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500"></span> Trống</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-indigo-500"></span> Đang Chứa</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500"></span> Khóa Giữ</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500"></span> Cận Date</span>
              </div>
            </div>

            {/* Grid ô kệ trực quan */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
              {warehouseGrid.map((bin) => {
                let badgeColor = 'border-slate-700 bg-slate-800/40 text-slate-400';
                let dotColor = 'bg-slate-500';
                if (bin.status === 'EMPTY') {
                  badgeColor = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400';
                  dotColor = 'bg-emerald-400';
                } else if (bin.status === 'OCCUPIED') {
                  badgeColor = 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200 hover:border-indigo-400';
                  dotColor = 'bg-indigo-400';
                } else if (bin.status === 'RESERVED') {
                  badgeColor = 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:border-amber-400';
                  dotColor = 'bg-amber-400';
                } else if (bin.status === 'EXPIRING') {
                  badgeColor = 'border-rose-500/50 bg-rose-500/15 text-rose-200 hover:border-rose-400 shadow-sm shadow-rose-900/30';
                  dotColor = 'bg-rose-400 animate-pulse';
                }

                return (
                  <div
                    key={bin.id}
                    onClick={() => setSelectedBin(bin)}
                    className={`cursor-pointer rounded-xl p-3 border transition-all hover:scale-[1.03] ${badgeColor} ${selectedBin?.id === bin.id ? 'ring-2 ring-indigo-400' : ''}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold">{bin.aisle}-{bin.rack}</span>
                      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                    </div>
                    <div className="mt-2 text-xs font-bold truncate">
                      {bin.status === 'EMPTY' ? 'Ô Kệ Trống' : bin.productName}
                    </div>
                    <div className="mt-1 text-[10px] font-mono opacity-70 flex justify-between">
                      <span>{bin.shelf}</span>
                      <span>{bin.qty ? `${bin.qty} cái` : '0 cái'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chi tiết ô kệ đang chọn */}
          <div className="mt-5 pt-4 border-t border-slate-800/80 bg-slate-950/60 p-4 rounded-xl border border-slate-800/60">
            {selectedBin ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                      {selectedBin.barcode}
                    </span>
                    <span className="font-bold text-white text-sm">{selectedBin.productName || 'Ô Chưa Chứa Hàng'}</span>
                  </div>
                  {selectedBin.sku && (
                    <p className="text-slate-400 text-[11px] font-mono">
                      SKU: <span className="text-white">{selectedBin.sku}</span> • Lô: <span className="text-cyan-400">{selectedBin.batch}</span> • Hạn: <span className={selectedBin.status === 'EXPIRING' ? 'text-rose-400 font-bold' : 'text-slate-300'}>{selectedBin.expiry}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono text-xs">
                    <span className="text-slate-400">Số lượng: </span>
                    <span className="text-emerald-400 font-extrabold text-sm">{selectedBin.qty || 0}</span>
                  </div>
                  <Link
                    to="/inventory"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    Xem Tồn Kho
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  Bấm vào một ô kệ trên lưới để kiểm tra thông tin chi tiết
                </span>
                <Link to="/layout" className="text-indigo-400 hover:underline font-semibold">
                  Mở bản đồ đầy đủ →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI (5 Cột): Bàn Thí Nghiệm Nghiệp Vụ Trực Tiếp (Live Test Cockpit) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Test Concurrency Khóa Bi Quan 20 Luồng */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Mô Phỏng 20 Luồng Đồng Thời (Pessimistic Lock)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                SELECT FOR UPDATE
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Giả lập 20 khách hàng cùng bấm mua 1 sản phẩm còn tồn kho = 10. Hệ thống sử dụng khóa bi quan để triệt tiêu Race Condition.
            </p>

            <button
              onClick={runConcurrencyTest}
              disabled={isSimulatingLock}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulatingLock ? 'Đang Bắn 20 Luồng...' : 'Kích Hoạt Test 20 Luồng Đồng Thời'}</span>
            </button>

            {/* Khung kết quả chạy test */}
            {simulationResults.length > 0 && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-[11px] font-mono">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold flex justify-between">
                  <span>KẾT QUẢ: 10 THÀNH CÔNG • 10 BỊ CHẶN</span>
                  <span>TỒN ÂM: 0</span>
                </div>
                {simulationResults.map((r, i) => (
                  <div
                    key={i}
                    className={`p-1.5 rounded flex items-center justify-between border ${r.status === 'SUCCESS' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-rose-950/40 border-rose-500/30 text-rose-400'}`}
                  >
                    <span>{r.message}</span>
                    <span className="font-bold">{r.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Test Thuật Toán Put-away (Gợi ý Cất Hàng) */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800/80 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                Thuật Toán Gợi Ý Cất Hàng (Smart Put-away)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                WEIGHT OPTIMIZER
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Nhập trọng lượng kiện hàng:</span>
                <span className="font-mono font-bold text-cyan-400">{putAwayWeight} kg</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                step="10"
                value={putAwayWeight}
                onChange={(e) => setPutAwayWeight(Number(e.target.value))}
                className="w-full accent-indigo-500 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-300 font-mono">
                <span>10 kg (Hàng nhẹ)</span>
                <span>100 kg (Ngưỡng an toàn)</span>
                <span>300 kg (Hàng nặng)</span>
              </div>
            </div>

            <button
              onClick={calculatePutAway}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-slate-700"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Chạy Thuật Toán Phân Tích Vị Trí</span>
            </button>

            {putAwayResult && (
              <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-500/40 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between text-indigo-300 font-bold">
                  <span>GỢI Ý: {putAwayResult.shelf}</span>
                  <span className="text-cyan-400">{putAwayResult.bin}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{putAwayResult.reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
