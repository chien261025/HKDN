import React from 'react';
import { Navigation, Compass, Layers } from 'lucide-react';

export interface PickWaypoint {
  id: string;
  stepNumber: number;
  productName: string;
  sku: string;
  locationBarcode: string;
  qty: number;
  x: number;
  y: number;
  zone: string;
  rack: string;
  shelf: string;
}

interface WarehouseFloorMapSvgProps {
  isOptimal: boolean;
  waypoints: PickWaypoint[];
  activeStep: number;
  onSelectWaypoint: (step: number) => void;
}

export const WarehouseFloorMapSvg: React.FC<WarehouseFloorMapSvgProps> = ({
  isOptimal,
  waypoints,
  activeStep,
  onSelectWaypoint,
}) => {
  // Start: Dock 01, Finish: Bàn Đóng Gói QC
  const startPoint = { x: 80, y: 450, label: 'DOCK 01' };
  const endPoint = { x: 900, y: 450, label: 'BÀN QC' };

  // Thứ tự lộ trình: Tối ưu (S-Shape) vs Ngẫu nhiên (Random)
  const orderedPoints = isOptimal
    ? [...waypoints].sort((a, b) => a.stepNumber - b.stepNumber)
    : [waypoints[2] || waypoints[0], waypoints[0], waypoints[3] || waypoints[1], waypoints[1]].filter(Boolean);

  const pathCoordinates = [
    startPoint,
    ...orderedPoints.map((p) => ({ x: p.x, y: p.y })),
    endPoint,
  ];

  const pathD = pathCoordinates.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  // Vị trí avatar người nhặt hàng theo activeStep
  const currentAvatarPos = activeStep === 0
    ? startPoint
    : activeStep > waypoints.length
      ? endPoint
      : orderedPoints[activeStep - 1] || startPoint;

  return (
    <div className="relative w-full aspect-[16/10] bg-[#070d19] rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-2xl select-none">
      {/* HUD Header */}
      <div className="absolute top-3.5 left-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-indigo-500/40 shadow-lg">
        <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
        <span className="text-xs font-bold text-slate-100 tracking-wide">
          SƠ ĐỒ MẶT BẰNG 2D • SMART PICK-PATH
        </span>
      </div>

      <div className="absolute top-3.5 right-4 z-10 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700 shadow-lg text-xs font-mono">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="text-emerald-400 font-bold">
          {isOptimal ? '⚡ LỘ TRÌNH S-SHAPE TSP (TỐI ƯU)' : '⚠️ LỐI ĐI TỰ DO (CHƯA TỐI ƯU)'}
        </span>
      </div>

      <svg viewBox="0 0 980 540" className="w-full h-full font-sans">
        <defs>
          {/* Lưới sàn kho công nghiệp */}
          <pattern id="floorGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#070d19" />
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162238" strokeWidth="1" />
            <circle cx="40" cy="40" r="1.5" fill="#1e293b" />
          </pattern>

          {/* Vạch kẻ an toàn vàng đen */}
          <pattern id="hazardStripe" width="20" height="20" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <rect width="10" height="20" fill="#eab308" />
            <rect x="10" width="10" height="20" fill="#1e293b" />
          </pattern>

          {/* Dải màu lộ trình phát sáng */}
          <linearGradient id="neonPathGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>

          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Nền sàn kho */}
        <rect width="100%" height="100%" fill="url(#floorGrid)" />

        {/* Hành lang an toàn xe nâng & người đi bộ (Main Aisles) */}
        <rect x="50" y="420" width="880" height="70" fill="#0d1829" stroke="#334155" strokeWidth="1.5" rx="8" />
        <rect x="50" y="486" width="880" height="4" fill="url(#hazardStripe)" opacity="0.7" />
        <text x="490" y="455" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle" letterSpacing="2">
          HÀNH LANG TRỤC CHÍNH XE NÂNG & NGƯỜI ĐI BỘ (MAIN TRANSIT AISLE)
        </text>

        {/* Hành lang thoát đầu dãy trên (Top Aisle) */}
        <rect x="110" y="35" width="760" height="40" fill="#0c1626" stroke="#1e293b" strokeWidth="1" rx="6" />
        <text x="490" y="58" fill="#64748b" fontSize="11" fontWeight="600" textAnchor="middle" letterSpacing="1">
          LỐI ĐI THOÁT ĐẦU DÃY KỆ (TOP CROSS AISLE)
        </text>

        {/* ================= DÃY KỆ ZONE A & B ================= */}
        {[
          { id: 'A1', name: 'DÃY KỆ A1', zone: 'ZONE A • TIÊU DÙNG', x: 130, fill: '#0284c7', stroke: '#38bdf8', prefix: 'A01' },
          { id: 'A2', name: 'DÃY KỆ A2', zone: 'ZONE A • TIÊU DÙNG', x: 310, fill: '#0284c7', stroke: '#38bdf8', prefix: 'A02' },
          { id: 'B1', name: 'DÃY KỆ B1', zone: 'ZONE B • ĐIỆN TỬ', x: 510, fill: '#059669', stroke: '#10b981', prefix: 'B01' },
          { id: 'B2', name: 'DÃY KỆ B2', zone: 'ZONE B • ĐIỆN TỬ', x: 690, fill: '#059669', stroke: '#10b981', prefix: 'B02' },
        ].map((rack) => (
          <g key={rack.id} id={`rack-${rack.id}`}>
            <rect x={rack.x} y="95" width="130" height="300" fill="#0b1322" stroke={rack.stroke} strokeWidth="2" rx="8" />
            <rect x={rack.x} y="95" width="130" height="42" fill={rack.fill} rx="8" />
            <text x={rack.x + 65} y="118" fill="#ffffff" fontSize="13" fontWeight="bold" textAnchor="middle">{rack.name}</text>
            <text x={rack.x + 65} y="131" fill="#f8fafc" fontSize="8.5" fontWeight="600" textAnchor="middle">{rack.zone}</text>
            {[155, 212, 269, 326].map((y, idx) => (
              <g key={`${rack.id}-${idx}`}>
                <rect x={rack.x + 10} y={y} width="110" height="45" fill="#162032" stroke="#334155" strokeWidth="1" rx="4" />
                <text x={rack.x + 65} y={y + 27} fill="#94a3b8" fontSize="11" fontWeight="bold" textAnchor="middle">
                  {rack.prefix}-0{idx + 1}
                </text>
              </g>
            ))}
          </g>
        ))}

        {/* ================= ĐƯỜNG DẪN DI CHUYỂN PHÁT SÁNG ================= */}
        <path d={pathD} fill="none" stroke={isOptimal ? '#38bdf8' : '#f43f5e'} strokeWidth="8" strokeOpacity="0.3" strokeLinecap="round" strokeLinejoin="round" filter="url(#neonGlow)" />
        <path d={pathD} fill="none" stroke={isOptimal ? 'url(#neonPathGrad)' : '#fb7185'} strokeWidth="4.5" strokeDasharray="10 8" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite" />
        </path>

        {/* ================= ĐIỂM XUẤT PHÁT: DOCK 01 ================= */}
        <g transform={`translate(${startPoint.x}, ${startPoint.y})`}>
          <rect x="-45" y="-35" width="90" height="55" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="2" rx="8" />
          <circle cx="0" cy="-10" r="15" fill="#3b82f6" />
          <text x="0" y="-5" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">START</text>
          <text x="0" y="12" fill="#bfdbfe" fontSize="10" fontWeight="bold" textAnchor="middle">CỬA DOCK 01</text>
        </g>

        {/* ================= ĐIỂM KẾT THÚC: BÀN ĐÓNG GÓI QC ================= */}
        <g transform={`translate(${endPoint.x}, ${endPoint.y})`}>
          <rect x="-55" y="-35" width="110" height="55" fill="#064e3b" stroke="#34d399" strokeWidth="2" rx="8" />
          <circle cx="0" cy="-10" r="15" fill="#10b981" />
          <text x="0" y="-5" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">FINISH</text>
          <text x="0" y="12" fill="#a7f3d0" fontSize="10" fontWeight="bold" textAnchor="middle">BÀN ĐÓNG GÓI QC</text>
        </g>

        {/* ================= CÁC WAYPOINT NHẶT HÀNG ================= */}
        {orderedPoints.map((pt, idx) => {
          const isSelected = activeStep === idx + 1;
          return (
            <g
              key={pt.id}
              transform={`translate(${pt.x}, ${pt.y})`}
              className="cursor-pointer group"
              onClick={() => onSelectWaypoint(idx + 1)}
            >
              {/* Highlight vòng ngoài */}
              <circle
                r={isSelected ? 26 : 20}
                fill={isSelected ? '#f59e0b' : '#6366f1'}
                fillOpacity={isSelected ? 0.35 : 0.2}
                className={isSelected ? 'animate-pulse' : ''}
              />
              <circle
                r={isSelected ? 16 : 13}
                fill={isSelected ? '#fbbf24' : '#4f46e5'}
                stroke="#ffffff"
                strokeWidth="2.5"
                filter="drop-shadow(0 2px 6px rgba(0,0,0,0.6))"
              />
              <text y="5" fill="#ffffff" fontSize={isSelected ? 13 : 11} fontWeight="bold" textAnchor="middle">
                {idx + 1}
              </text>

              {/* Bảng nhãn định danh điểm nhặt nổi bật */}
              <g transform="translate(0, -30)">
                <rect
                  x="-75"
                  y="-18"
                  width="150"
                  height="26"
                  fill="#020617"
                  rx="6"
                  stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                  strokeWidth={isSelected ? 2 : 1.2}
                  filter="drop-shadow(0 4px 8px rgba(0,0,0,0.8))"
                />
                <text x="0" y="-1" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">
                  #{idx + 1}: {pt.rack} • {pt.qty} SP
                </text>
              </g>
            </g>
          );
        })}

        {/* ================= THỦ KHO AVATAR (DI CHUYỂN THỜI GIAN THỰC) ================= */}
        <g transform={`translate(${currentAvatarPos.x}, ${currentAvatarPos.y + 24})`}>
          <rect x="-42" y="-10" width="84" height="20" fill="#f59e0b" rx="10" />
          <text x="0" y="4" fill="#000000" fontSize="10" fontWeight="bold" textAnchor="middle">
            🚶 Thủ kho đang ở đây
          </text>
        </g>
      </svg>
    </div>
  );
};
