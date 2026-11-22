import React from 'react';
import { MapPin, Weight, AlertTriangle } from 'lucide-react';
import { BarcodeSvg, QrCodeSvg } from '../../../components/common';

export interface BinLabelData {
  binBarcode: string;
  zoneCode: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  maxWeightKg: number;
  warehouseId?: number;
  warehouseCode?: string;
  warehouseName?: string;
  isActive?: boolean;
}

interface BinLabelCardProps {
  data: BinLabelData;
  className?: string;
}

export const BinLabelCard: React.FC<BinLabelCardProps> = ({ data, className = '' }) => {
  const isColdZone = data.zoneCode?.includes('ZB') || data.zoneCode?.includes('ZONE_B');
  const isInactive = data.isActive === false;

  // Payload chuẩn định danh vị trí cho thiết bị quét PDA và Camera
  const qrPayload = JSON.stringify({
    type: 'LOCATION',
    bin: data.binBarcode,
    zone: data.zoneCode,
    aisle: data.aisle,
    rack: data.rack,
    shelf: data.shelf,
    pos: data.bin,
    maxKg: data.maxWeightKg,
    wh: data.warehouseCode || (data.binBarcode.startsWith('WH02') ? 'WH02' : data.binBarcode.startsWith('WH03') ? 'WH03' : data.binBarcode.startsWith('WH04') ? 'WH04' : 'WH01'),
    active: !isInactive,
  });

  const whCode = data.warehouseCode || (data.binBarcode.startsWith('WH02') ? 'WH02' : data.binBarcode.startsWith('WH03') ? 'WH03' : data.binBarcode.startsWith('WH04') ? 'WH04' : 'WH01');
  const whName = data.warehouseName || (whCode === 'WH02' ? 'KHO VSIP BẮC NINH' : whCode === 'WH03' ? 'KHO ĐÀ NẴNG' : whCode === 'WH04' ? 'KHO SÓNG THẦN' : 'KHO TỔNG TÂN BÌNH');

  return (
    <div
      className={`bg-white border-2 ${isInactive ? 'border-rose-500 bg-rose-50/20' : 'border-slate-900'} rounded-xl p-3 flex flex-col justify-between text-slate-900 shadow-xs print-single-label ${className}`}
      style={{ width: '100%', maxWidth: '360px', minHeight: '210px' }}
    >
      {/* 1. Header tem: Tên hệ thống & Kho + Badge Zone + Badge Trạng thái Khóa nếu có */}
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
          <span className="font-bold text-[10.5px] tracking-tight text-slate-700 truncate" title={`${whName} (${whCode})`}>
            {whName} ({whCode})
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isInactive && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 font-sans uppercase flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
              ĐANG KHÓA
            </span>
          )}
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono uppercase ${
              isColdZone
                ? 'bg-blue-100 text-blue-900 border border-blue-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}
          >
            {data.zoneCode}
          </span>
        </div>
      </div>

      {/* 2. MÃ VỊ TRÍ BIN CHÍNH (Hero Block - In to, đậm, rõ nét nhất nhãn, responsive chống tràn chữ) */}
      <div className={`my-1.5 py-1 px-2 ${isInactive ? 'bg-rose-900' : 'bg-slate-900'} text-white rounded-md text-center font-mono font-black text-xs sm:text-sm tracking-wider shadow-2xs break-all`}>
        {data.binBarcode}
      </div>

      {/* 3. Vùng Barcode & QR Code độ phân giải cao cho PDA */}
      <div className="my-1 flex items-center justify-between gap-2.5 bg-slate-50/70 p-2 rounded-lg border border-slate-200">
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <BarcodeSvg
            value={data.binBarcode}
            format="CODE128"
            width={1.65}
            height={48}
            fontSize={10}
          />
        </div>
        <div className="flex-shrink-0 flex flex-col items-center pl-1 border-l border-slate-200">
          <QrCodeSvg value={qrPayload} size={64} level="M" />
          <span className="text-[9px] font-mono font-bold text-slate-600 mt-0.5 tracking-tight">QUÉT PDA</span>
        </div>
      </div>

      {/* 4. Tọa độ Dãy - Kệ - Tầng - Ô chứa */}
      <div className="pt-1.5 border-t border-slate-200 grid grid-cols-4 gap-1 text-center font-mono">
        <div className="bg-slate-100/80 p-1 rounded border border-slate-200">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Dãy</div>
          <div className="font-extrabold text-xs text-slate-900">{data.aisle}</div>
        </div>
        <div className="bg-slate-100/80 p-1 rounded border border-slate-200">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Kệ</div>
          <div className="font-extrabold text-xs text-slate-900">{data.rack}</div>
        </div>
        <div className="bg-blue-50 p-1 rounded border border-blue-200">
          <div className="text-[10px] text-blue-700 uppercase font-sans font-semibold">Tầng</div>
          <div className="font-extrabold text-xs text-blue-800">{data.shelf}</div>
        </div>
        <div className="bg-slate-100/80 p-1 rounded border border-slate-200">
          <div className="text-[10px] text-slate-500 uppercase font-sans font-semibold">Ô chứa</div>
          <div className="font-extrabold text-xs text-slate-900">{data.bin}</div>
        </div>
      </div>

      {/* 5. Tải trọng & Chuẩn định danh (Căn thẳng hàng, không ngắt dòng) */}
      <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-slate-600 pt-1 border-t border-slate-100">
        <span className="flex items-center gap-1">
          <Weight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>MAX LOAD: <strong className="text-slate-900 font-bold">{data.maxWeightKg} KG</strong></span>
        </span>
        <span className="font-sans text-[10px] text-slate-500 font-medium">Chuẩn kệ WMS</span>
      </div>
    </div>
  );
};
