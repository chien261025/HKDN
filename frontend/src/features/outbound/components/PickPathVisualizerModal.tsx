import React, { useState, useEffect } from 'react';
import { X, Navigation, CheckCircle2, ArrowRight, Printer, Smartphone, Zap, Route, Timer, Footprints, Play, Pause, RotateCcw } from 'lucide-react';
import { OutboundOrder } from '../types';
import { WarehouseFloorMapSvg, PickWaypoint } from './WarehouseFloorMapSvg';

interface PickPathVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OutboundOrder | null;
}

export const PickPathVisualizerModal: React.FC<PickPathVisualizerModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [isOptimal, setIsOptimal] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pdaSynced, setPdaSynced] = useState(false);

  const defaultWaypoints: PickWaypoint[] = [
    { id: 'wp-1', stepNumber: 1, productName: order?.items[0]?.productName || 'Sữa tươi tiệt trùng Vinamilk 100% 1L', sku: 'SKU-MILK-100', locationBarcode: 'WH01-ZA-A01-R01-S01-B01', qty: 20, x: 195, y: 212, zone: 'Zone A', rack: 'Dãy Kệ A1', shelf: 'Tầng 2 • Ô B01' },
    { id: 'wp-2', stepNumber: 2, productName: order?.items[1]?.productName || 'Nước giặt OMO Matic Cửa Trên 3.6kg', sku: 'SKU-OMO-MATIC', locationBarcode: 'WH01-ZA-A02-R01-S01-B03', qty: 10, x: 375, y: 269, zone: 'Zone A', rack: 'Dãy Kệ A2', shelf: 'Tầng 3 • Ô B03' },
    { id: 'wp-3', stepNumber: 3, productName: order?.items[2]?.productName || 'Điện thoại Samsung Galaxy S24 Ultra', sku: 'SKU-SAMS-S24', locationBarcode: 'WH01-ZB-B01-R01-S01-B05', qty: 5, x: 575, y: 212, zone: 'Zone B', rack: 'Dãy Kệ B1', shelf: 'Tầng 2 • Ô B05' },
    { id: 'wp-4', stepNumber: 4, productName: 'Cà phê hòa tan G7 3in1 Hộp 18 gói', sku: 'SKU-COF-G7', locationBarcode: 'WH01-ZB-B02-R01-S02-B02', qty: 15, x: 755, y: 326, zone: 'Zone B', rack: 'Dãy Kệ B2', shelf: 'Tầng 4 • Ô B02' },
  ];

  // Auto-play mô phỏng bước đi của thủ kho
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= defaultWaypoints.length ? 1 : prev + 1));
    }, 1800);
    return () => clearInterval(timer);
  }, [isPlaying, defaultWaypoints.length]);

  if (!isOpen || !order) return null;

  const distance = isOptimal ? 74 : 168;
  const estTime = isOptimal ? '2.4 phút' : '5.6 phút';

  const handleSyncToPda = () => {
    setPdaSynced(true);
    setTimeout(() => setPdaSynced(false), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-[1400px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Tối Ưu Hóa Lộ Trình Nhặt Hàng (Pick-Path Routing Visualizer)
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300">
                  {order.soCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Thuật toán định tuyến ngắn nhất (Shortest Path TSP) • Khách hàng: <span className="font-semibold text-slate-800">{order.customerName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Metrics Dashboard Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3.5 bg-slate-100/90 border-b border-slate-200 text-xs">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Footprints className="w-4 h-4 text-indigo-600" /> Quãng đường di chuyển
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-extrabold text-slate-900 tabular-nums">{distance} mét</span>
              {isOptimal && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">-94m (-56%)</span>}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Timer className="w-4 h-4 text-indigo-600" /> Thời gian ước tính
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-extrabold text-slate-900 tabular-nums">{estTime}</span>
              {isOptimal && <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">-3.2 phút</span>}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Zap className="w-4 h-4 text-amber-500" /> Hiệu suất tiết kiệm
            </span>
            <div className="text-lg font-extrabold text-emerald-600 tabular-nums mt-1">
              {isOptimal ? '56.0% Chi Phí Di Chuyển' : '0% (Đi tự do)'}
            </div>
          </div>

          {/* Toggle Thuật toán */}
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
            <span className="text-slate-600 text-2xs font-bold uppercase tracking-wider mb-1">Mô hình định tuyến:</span>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setIsOptimal(true)}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  isOptimal ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ S-Shape TSP (Tối ưu)
              </button>
              <button
                onClick={() => setIsOptimal(false)}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  !isOptimal ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚠️ Ngẫu Nhiên
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Map + Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5 overflow-y-auto flex-1 items-start">
          {/* Cột trái (7 cols): Sơ đồ mặt bằng 2D */}
          <div className="lg:col-span-7 space-y-3">
            <WarehouseFloorMapSvg
              isOptimal={isOptimal}
              waypoints={defaultWaypoints}
              activeStep={activeStep}
              onSelectWaypoint={(s) => setActiveStep(s)}
            />

            {/* Điều khiển mô phỏng bước đi + Flow Bar */}
            <div className="flex items-center justify-between gap-3 bg-slate-100 p-2.5 rounded-xl border border-slate-200 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    isPlaying ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Tạm Dừng Mô Phỏng' : 'Tự Động Mô Phỏng Bước Đi'}</span>
                </button>
                <button
                  onClick={() => { setIsPlaying(false); setActiveStep(1); }}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-200 text-slate-600 border border-slate-300 transition-colors cursor-pointer"
                  title="Đặt lại bước đầu"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Luồng di chuyển */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 flex-wrap">
                <span className="text-blue-600 font-bold">Dock 01</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-sky-600 font-bold">Zone A</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-600 font-bold">Zone B</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-teal-600 font-bold">QC Desk</span>
              </div>
            </div>
          </div>

          {/* Cột phải (5 cols): Danh sách thứ tự nhặt hàng */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Route className="w-4 h-4 text-indigo-600" />
                <span>Thứ Tự Nhặt Hàng (Turn-by-turn Picking List)</span>
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                4/4 Điểm Dừng
              </span>
            </div>

            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {defaultWaypoints.map((wp) => {
                const isActive = activeStep === wp.stepNumber;
                return (
                  <div
                    key={wp.id}
                    onClick={() => setActiveStep(wp.stepNumber)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200 shadow-md scale-[1.01]'
                        : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold font-mono shadow-xs ${
                          isActive ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'
                        }`}>
                          {wp.stepNumber}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-slate-900 line-clamp-1">{wp.productName}</div>
                          <div className="text-2xs font-mono text-slate-500 mt-0.5">{wp.sku}</div>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-mono whitespace-nowrap">
                        {wp.qty} SP
                      </span>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-2xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded font-bold ${wp.zone === 'Zone A' ? 'bg-sky-100 text-sky-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          {wp.zone}
                        </span>
                        <span className="font-semibold text-slate-700">{wp.rack}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-semibold">{wp.shelf}</span>
                      </div>
                      {isActive && (
                        <span className="text-amber-700 font-bold flex items-center gap-1 animate-pulse">
                          ● Đang lấy hàng
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/90 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleSyncToPda}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Gửi Lộ Trình Sang Máy PDA</span>
            </button>
            <button
              onClick={() => alert(`In phiếu lộ trình nhặt hàng cho đơn: ${order.soCode}`)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In Phiếu Lộ Trình</span>
            </button>
          </div>

          {pdaSynced && (
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã truyền lệnh lộ trình tới PDA #04 thành công!</span>
            </div>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
