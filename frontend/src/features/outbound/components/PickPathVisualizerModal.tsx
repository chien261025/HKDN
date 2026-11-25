import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Navigation, ArrowRight, Printer, Route, Timer, Footprints } from 'lucide-react';
import { OutboundOrder } from '../types';
import { WarehouseFloorMapSvg, PickWaypoint } from './WarehouseFloorMapSvg';
import { calculateDijkstraShortestRoute } from '../utils/warehouseRoutingEngine';
import { printHtmlDocument } from '../../../services/printService';
import { getWarehouseDisplayName } from '../../masterdata/services/warehouseService';

interface PickPathVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OutboundOrder | null;
}

// Bản đồ tọa độ SVG theo Dãy (Aisle) thực tế trong DB
// Barcode format: WH01-ZA-{aisle}-{rack}-{shelf}-{bin}
// SVG viewBox: 980 x 540 — hành lang chính ở y=420-490
const AISLE_SVG_MAP: Record<string, { x: number; zoneLabel: string; zoneClass: 'A' | 'B' }> = {
  A01: { x: 195, zoneLabel: 'Zone A', zoneClass: 'A' },
  A02: { x: 375, zoneLabel: 'Zone A', zoneClass: 'A' },
  B01: { x: 575, zoneLabel: 'Zone B', zoneClass: 'B' },
  B02: { x: 755, zoneLabel: 'Zone B', zoneClass: 'B' },
};

// Vị trí y theo shelf trong SVG (S01=tầng thấp nhất, S02=cao hơn...)
const SHELF_Y_MAP: Record<string, number> = {
  S01: 326,
  S02: 269,
  S03: 212,
  S04: 155,
};

const getOrderUnitLabel = (sku?: string, name?: string): string => {
  const text = `${sku || ''} ${name || ''}`.toLowerCase();
  if (text.includes('sữa') || text.includes('milk') || text.includes('yogurt')) return 'Hộp';
  if (text.includes('coca') || text.includes('bia') || text.includes('nước ngọt')) return 'Lon';
  if (text.includes('lavie') || text.includes('nước khoáng')) return 'Thùng';
  if (text.includes('samsung') || text.includes('điện thoại') || text.includes('laptop')) return 'Chiếc';
  if (text.includes('cà phê') || text.includes('g7')) return 'Hộp';
  return 'Thùng';
};

/** Giải mã barcode → aisle, rack, shelf, bin
 *  Format: WH01-ZA-A01-R01-S01-B01  hoặc  WH01-ZB-B01-R01-S01-B05
 */
function parseBarcode(barcode: string): { aisle: string; rack: string; shelf: string; bin: string } | null {
  const parts = barcode.split('-');
  // parts: [WH01, ZA, A01, R01, S01, B01]
  if (parts.length < 6) return null;
  return { aisle: parts[2], rack: parts[3], shelf: parts[4], bin: parts[5] };
}

export const PickPathVisualizerModal: React.FC<PickPathVisualizerModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  const [activeStep, setActiveStep] = useState(0);

  // Dùng dữ liệu thật từ order.items[].allocations (kể cả bin nằm ngoài 4 dãy A01-B02)
  const realWaypoints: PickWaypoint[] = useMemo(() => {
    if (!order?.items?.length) return [];

    const wps: PickWaypoint[] = [];
    order.items.forEach((item) => {
      const unit = item.unit || getOrderUnitLabel(item.sku, item.productName);
      const allocations = item.allocations || [];
      allocations.forEach((alloc) => {
        const parsed = parseBarcode(alloc.locationBarcode);
        const aisleKey = parsed?.aisle || 'A01';
        const svgPos = AISLE_SVG_MAP[aisleKey] || {
          x: 195 + ((wps.length % 4) * 180),
          zoneLabel: aisleKey.startsWith('B') ? 'Zone B' : aisleKey.startsWith('C') ? 'Zone C' : 'Zone A',
          zoneClass: (aisleKey.startsWith('B') ? 'B' : 'A') as 'A' | 'B',
        };
        const svgY = (parsed && SHELF_Y_MAP[parsed.shelf]) ?? 269;
        const zoneLabel = svgPos.zoneLabel;
        const rackLabel = parsed ? `Dãy ${parsed.aisle} • Kệ ${parsed.rack}` : alloc.locationBarcode;
        const shelfLabel = parsed ? `Tầng ${parsed.shelf} • Ô ${parsed.bin}` : 'Vị trí kệ';

        wps.push({
          id: `wp-${wps.length + 1}`,
          stepNumber: wps.length + 1,
          productName: item.productName,
          sku: item.sku,
          locationBarcode: alloc.locationBarcode,
          qty: alloc.qtyAllocated,
          unit,
          batchNumber: alloc.batchNumber || '—',
          expiryDate: alloc.expiryDate || '—',
          x: svgPos.x,
          y: svgY,
          zone: zoneLabel,
          rack: rackLabel,
          shelf: shelfLabel,
          rackKey: aisleKey,
        });
      });
    });

    return wps
      .sort((a, b) => a.locationBarcode.localeCompare(b.locationBarcode))
      .map((wp, idx) => ({ ...wp, id: `wp-${idx + 1}`, stepNumber: idx + 1 }));
  }, [order]);

  // Fallback: nếu chưa ALLOCATED (không có allocations) thì dùng items trực tiếp
  const fallbackWaypoints: PickWaypoint[] = useMemo(() => {
    if (!order?.items?.length) return [];
    return order.items.slice(0, 4).map((item, idx) => {
      const unit = item.unit || getOrderUnitLabel(item.sku, item.productName);
      const aisleKeys = Object.keys(AISLE_SVG_MAP);
      const aisleKey = aisleKeys[idx % aisleKeys.length];
      const svgPos = AISLE_SVG_MAP[aisleKey];
      const shelfKeys = Object.keys(SHELF_Y_MAP);
      const shelfKey = shelfKeys[idx % shelfKeys.length];
      return {
        id: `wp-fb-${idx + 1}`,
        stepNumber: idx + 1,
        productName: item.productName,
        sku: item.sku,
        locationBarcode: `WH01-ZA-${aisleKey}-R01-${shelfKey}-B01`,
        qty: item.requestedQty,
        unit,
        batchNumber: 'LOT-2026-FEFO',
        expiryDate: '31/12/2027',
        x: svgPos.x,
        y: SHELF_Y_MAP[shelfKey],
        zone: svgPos.zoneLabel,
        rack: `Dãy ${aisleKey} • Kệ R01`,
        shelf: `Tầng ${shelfKey} • Ô B01`,
        rackKey: aisleKey,
      };
    });
  }, [order]);

  const defaultWaypoints = realWaypoints.length > 0 ? realWaypoints : fallbackWaypoints;

  // Tính toán lộ trình theo thứ tự vị trí
  const routeInfo = useMemo(() => {
    if (!defaultWaypoints.length) return null;
    const rawStops = defaultWaypoints.map((w) => ({ x: w.x, y: w.y, qty: w.qty }));
    return calculateDijkstraShortestRoute(rawStops);
  }, [defaultWaypoints]);

  if (!isOpen || !order) return null;

  const stopCount = defaultWaypoints.length;
  const distance = routeInfo ? routeInfo.totalDistanceMeters : 0;
  const travelSec = routeInfo ? routeInfo.travelTimeSeconds : 0;
  const pickSec = routeInfo ? routeInfo.pickTimeSeconds : 0;
  const estTime = routeInfo ? `${routeInfo.totalTimeMinutes} phút` : '0 phút';
  const algoName = 'Thứ tự lấy hàng tối ưu theo dãy kệ';

  const warehouseName = getWarehouseDisplayName(order.warehouseId);

  const handlePrintRoute = () => {
    const routeRows = defaultWaypoints
      .map(
        (wp, idx) => `
      <tr>
        <td class="text-center font-mono font-bold" style="color: #4338ca;">#${idx + 1}</td>
        <td class="font-mono font-bold">${wp.locationBarcode}</td>
        <td>
          <div class="font-bold">${wp.zone} • ${wp.rack}</div>
          <div style="font-size: 10px; color: #64748b;" class="font-mono">${wp.shelf}</div>
        </td>
        <td>
          <div class="font-bold">${wp.productName}</div>
          <div style="font-size: 10px; color: #64748b;" class="font-mono">SKU: ${wp.sku}</div>
          <div style="font-size: 9.5px; color: #4338ca; font-family: monospace; font-weight: 700; margin-top: 2px;">
            Số Lô: ${wp.batchNumber || 'LOT-2026-X1'} • HSD: ${wp.expiryDate || '31/12/2027'} (FEFO)
          </div>
        </td>
        <td class="text-right font-mono" style="white-space: nowrap;">
          <strong style="font-size: 13px; color: #b45309;">${wp.qty}</strong> <span style="font-size: 10.5px; color: #475569; font-weight: 700;">${wp.unit || 'Chiếc'}</span>
        </td>
        <td class="text-center font-mono" style="font-size: 13px; color: #64748b;">[ &nbsp;&nbsp; ]</td>
      </tr>
    `
      )
      .join('');

    const bodyHtml = `
      <div class="header">
        <div>
          <div class="header-sub">HỆ THỐNG QUẢN LÝ KHO THÔNG MINH - SMART WMS LOGISTICS</div>
          <div class="header-title">PHIẾU ĐIỀU PHỐI LỘ TRÌNH LẤY HÀNG</div>
          <div class="header-date">${warehouseName} • In lúc: ${new Date().toLocaleString('vi-VN')}</div>
        </div>
        <div class="header-code-box">
          <div class="header-code-label">MÃ ĐƠN XUẤT (SO)</div>
          <div class="header-code-val">${order.soCode}</div>
          <!-- Barcode mini scan cho máy PDA -->
          <div style="margin: 3px 0 1px 0; display: inline-flex; align-items: flex-end; height: 20px; gap: 1.5px;">
            <div style="width: 2px; height: 100%; background: #000;"></div>
            <div style="width: 1px; height: 100%; background: #000;"></div>
            <div style="width: 3px; height: 100%; background: #000;"></div>
            <div style="width: 1px; height: 100%; background: #000;"></div>
            <div style="width: 2px; height: 100%; background: #000;"></div>
            <div style="width: 4px; height: 100%; background: #000;"></div>
            <div style="width: 1px; height: 100%; background: #000;"></div>
            <div style="width: 2px; height: 100%; background: #000;"></div>
            <div style="width: 3px; height: 100%; background: #000;"></div>
            <div style="width: 1px; height: 100%; background: #000;"></div>
            <div style="width: 2px; height: 100%; background: #000;"></div>
            <div style="width: 1px; height: 100%; background: #000;"></div>
            <div style="width: 3px; height: 100%; background: #000;"></div>
            <div style="width: 2px; height: 100%; background: #000;"></div>
            <div style="width: 1px; height: 100%; background: #000;"></div>
            <div style="width: 3px; height: 100%; background: #000;"></div>
            <div style="width: 1px; height: 100%; background: #000;"></div>
            <div style="width: 2px; height: 100%; background: #000;"></div>
          </div>
          <div style="font-family: monospace; font-size: 8.5px; font-weight: bold; letter-spacing: 1.5px; color: #475569;">*${order.soCode}*</div>
          <div style="margin-top: 3px;">
            <span class="badge">${algoName.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div class="meta-grid">
        <div>
          <div class="meta-item"><span class="meta-label">Khách hàng nhận:</span> <span class="meta-value">${order.customerName}</span></div>
          <div class="meta-item"><span class="meta-label">Kho xuất phát:</span> <span class="meta-value">${warehouseName}</span></div>
          <div class="meta-item"><span class="meta-label">Cửa xuất phát (Start):</span> <span class="meta-value" style="color: #1d4ed8;">CỬA DOCK 01 (Khu Nhận Thiết Bị)</span></div>
        </div>
        <div>
          <div class="meta-item"><span class="meta-label">Điểm kết thúc:</span> <span class="meta-value" style="color: #047857;">KHU ĐÓNG GÓI &amp; KIỂM HÀNG</span></div>
          <div class="meta-item"><span class="meta-label">Tổng cự ly di chuyển:</span> <span class="meta-value">${distance} mét</span> • Ước tính: <span class="meta-value">${estTime}</span> (${travelSec}s di chuyển + ${pickSec}s thao tác)</div>
          <div class="meta-item"><span class="meta-label">Quy mô nhặt hàng:</span> <span class="meta-value">${stopCount} điểm dừng lấy hàng</span></div>
        </div>
      </div>

      <div class="section-title">
        <span>Bảng Kê Chi Tiết Thứ Tự Các Chặng Lấy Hàng (Pick Sequence)</span>
        <span style="font-weight: normal; font-style: italic; font-size: 10px; color: #64748b;">* Quét Barcode vị trí & kiểm tra HSD trước khi bốc hàng</span>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 50px;">Chặng</th>
            <th>Vị Trí Ô Kệ (Location Barcode)</th>
            <th>Phân Khu / Dãy Kệ</th>
            <th>Mặt Hàng & Mã Lô (FEFO)</th>
            <th class="text-right" style="width: 85px;">SL Cần Lấy</th>
            <th class="text-center" style="width: 75px;">Xác Nhận</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background-color: #eff6ff;">
            <td class="text-center font-mono font-bold" style="color: #2563eb;">0</td>
            <td class="font-mono font-bold" style="color: #1e40af;">WH01-DOCK-01</td>
            <td>Cửa Tiếp Nhận #01</td>
            <td style="color: #475569; font-style: italic;">Nhận xe nâng / xe kéo & pallet xuất rỗng</td>
            <td class="text-right font-mono">-</td>
            <td class="text-center font-mono" style="color: #94a3b8;">[ &nbsp;&nbsp; ]</td>
          </tr>
          ${routeRows}
          <tr style="background-color: #f0fdf4;">
            <td class="text-center font-mono font-bold" style="color: #059669;">#${defaultWaypoints.length + 1}</td>
            <td class="font-mono font-bold" style="color: #065f46;">WH01-QC-DESK</td>
            <td>Khu Đóng Gói &amp; Kiểm Hàng</td>
            <td style="color: #475569; font-style: italic;">Bàn giao toàn bộ pallet đã lấy để kiểm đếm và đóng gói xuất kho</td>
            <td class="text-right font-mono">-</td>
            <td class="text-center font-mono" style="color: #94a3b8;">[ &nbsp;&nbsp; ]</td>
          </tr>
        </tbody>
      </table>

      <div class="notice-box">
        <div style="font-weight: 700; color: #1e293b; margin-bottom: 2px;">Quy định an toàn & vận hành xe nâng trong kho:</div>
        <div>1. Di chuyển đúng theo hành lang an toàn quy định, tốc độ tối đa không quá 8 km/h.</div>
        <div>2. Quét mã QR/Barcode ô kệ trước khi lấy hàng để tránh nhầm lẫn vị trí hoặc lô date cận hạn (FEFO).</div>
      </div>

      <div class="signatures">
        <div>
          <div class="sign-title">Người Lập Lộ Trình</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div style="height: 48px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 4px;"></div>
          <div style="font-size: 10px; color: #94a3b8; font-style: italic;">Họ tên: .......................................</div>
        </div>
        <div>
          <div class="sign-title">Nhân Viên Lấy Hàng</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div style="height: 48px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 4px;"></div>
          <div style="font-size: 10px; color: #94a3b8; font-style: italic;">Họ tên: .......................................</div>
        </div>
        <div>
          <div class="sign-title">Thủ Kho Xuất Hàng</div>
          <div class="sign-sub">(Ký, ghi rõ họ tên)</div>
          <div style="height: 48px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 4px;"></div>
          <div style="font-size: 10px; color: #94a3b8; font-style: italic;">Họ tên: .......................................</div>
        </div>
      </div>
    `;

    printHtmlDocument(`Phieu-Lo-Trinh-${order.soCode}`, bodyHtml);
  };

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Navigation className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Tối Ưu Hóa Lộ Trình Nhặt Hàng
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-300">
                  {order.soCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Khách hàng: <span className="font-semibold text-slate-800">{order.customerName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KPI Metrics Dashboard Bar (Hidden on Print) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-slate-100/90 border-b border-slate-200 text-xs print:hidden">
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Footprints className="w-4 h-4 text-indigo-600" /> Quãng đường dự kiến
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-extrabold text-slate-900 tabular-nums">{distance} mét</span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                {stopCount} điểm lấy
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-slate-500 flex items-center gap-1.5 font-medium">
              <Timer className="w-4 h-4 text-indigo-600" /> Thời gian ước tính
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-extrabold text-slate-900 tabular-nums">{estTime}</span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({travelSec}s đi • {pickSec}s lấy)
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-center">
            <span className="text-slate-500 font-medium">Lộ trình đề xuất:</span>
            <span className="text-sm font-bold text-indigo-700 mt-1">Cửa 01 &rarr; Kệ hàng &rarr; Khu đóng gói</span>
          </div>
        </div>

        {/* Main Content: Map + Steps (Hidden on Print) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5 overflow-y-auto flex-1 items-start print:hidden">
          {/* Cột trái (7 cols): Sơ đồ mặt bằng 2D */}
          <div className="lg:col-span-7 space-y-3">
            <WarehouseFloorMapSvg
              isOptimal={true}
              waypoints={defaultWaypoints}
              activeStep={activeStep}
              onSelectWaypoint={(s) => setActiveStep(s)}
            />

            {/* Thanh chọn từng điểm dừng */}
            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200">
              {/* Luồng di chuyển trực quan theo từng điểm nhặt thực tế */}
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveStep(0)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    activeStep === 0
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  Cửa 01
                </button>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {defaultWaypoints.map((wp, idx) => {
                  const isCurrent = activeStep === idx + 1;
                  return (
                    <React.Fragment key={wp.id}>
                      <button
                        type="button"
                        onClick={() => setActiveStep(idx + 1)}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-amber-500 text-white shadow-xs animate-pulse ring-2 ring-amber-300'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        #{idx + 1} {wp.rack}
                      </button>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </React.Fragment>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setActiveStep(defaultWaypoints.length + 1)}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                    activeStep > defaultWaypoints.length
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  Khu Đóng Gói
                </button>
              </div>
            </div>
          </div>

          {/* Cột phải (5 cols): Danh sách thứ tự nhặt hàng */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Route className="w-4 h-4 text-indigo-600" />
                <span>Thứ Tự Nhặt Hàng</span>
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {stopCount}/{stopCount} Điểm Dừng
              </span>
            </div>

            <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
              {defaultWaypoints.map((wp) => {
                const isActive = activeStep === wp.stepNumber;
                return (
                  <div
                    key={wp.id}
                    onClick={() => setActiveStep(wp.stepNumber)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${isActive
                      ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200 shadow-md scale-[1.01]'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/80'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold font-mono shadow-xs ${isActive ? 'bg-amber-500 text-white' : 'bg-slate-800 text-white'
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
                      <div className="text-2xs font-mono font-bold">
                        {isActive ? (
                          <span className="text-amber-700 flex items-center gap-1 animate-pulse">
                            ● Điểm lấy kế tiếp
                          </span>
                        ) : (
                          <span className="text-slate-400">
                            ○ Chờ lấy
                          </span>
                        )}
                      </div>
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
              onClick={handlePrintRoute}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              title="In phiếu lộ trình lấy hàng A4"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu Lộ Trình</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
