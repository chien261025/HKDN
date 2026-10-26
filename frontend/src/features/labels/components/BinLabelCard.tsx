import React from 'react';
import { MapPin, Weight } from 'lucide-react';
import { BarcodeSvg, QrCodeSvg } from '../../../components/common';

export interface BinLabelData {
  binBarcode: string;
  zoneCode: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  maxWeightKg: number;
}

interface BinLabelCardProps {
  data: BinLabelData;
  className?: string;
}

export const BinLabelCard: React.FC<BinLabelCardProps> = ({ data, className = '' }) => {
  const isColdZone = data.zoneCode?.includes('ZB') || data.zoneCode?.includes('ZONE_B');

  return (
    <div
      className={`bg-white border-2 border-slate-900 rounded-xl p-3.5 flex flex-col justify-between text-slate-900 shadow-sm print-single-label ${className}`}
      style={{ width: '100%', maxWidth: '340px', minHeight: '185px' }}
    >
      {/* Label Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-300">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-indigo-700" />
          <span className="font-black text-2xs tracking-wider uppercase text-slate-900">
            SMART WMS • THẺ VỊ TRÍ Ô KỆ
          </span>
        </div>
        <span
          className={`text-2xs font-bold px-2 py-0.5 rounded font-mono ${
            isColdZone
              ? 'bg-cyan-100 text-cyan-900 border border-cyan-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          {data.zoneCode}
        </span>
      </div>

      {/* Main Barcode & QR Code Center */}
      <div className="my-2 flex items-center justify-between gap-3">
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <BarcodeSvg
            value={data.binBarcode}
            format="CODE128"
            width={1.6}
            height={42}
            fontSize={11}
          />
        </div>
        <div className="flex-shrink-0 flex flex-col items-center">
          <QrCodeSvg value={data.binBarcode} size={60} level="M" />
          <span className="text-3xs font-mono text-slate-500 mt-0.5">QUÉT NHANH</span>
        </div>
      </div>

      {/* Location Breakdown Badges */}
      <div className="pt-2 border-t border-slate-300 grid grid-cols-4 gap-1 text-center font-mono">
        <div className="bg-slate-100 p-1 rounded border border-slate-200">
          <div className="text-3xs text-slate-500 uppercase font-sans">Dãy</div>
          <div className="font-bold text-xs text-slate-900">{data.aisle}</div>
        </div>
        <div className="bg-slate-100 p-1 rounded border border-slate-200">
          <div className="text-3xs text-slate-500 uppercase font-sans">Kệ</div>
          <div className="font-bold text-xs text-slate-900">{data.rack}</div>
        </div>
        <div className="bg-slate-100 p-1 rounded border border-slate-200">
          <div className="text-3xs text-slate-500 uppercase font-sans">Tầng</div>
          <div className="font-bold text-xs text-indigo-700">{data.shelf}</div>
        </div>
        <div className="bg-slate-100 p-1 rounded border border-slate-200">
          <div className="text-3xs text-slate-500 uppercase font-sans">Ô chứa</div>
          <div className="font-bold text-xs text-slate-900">{data.bin}</div>
        </div>
      </div>

      {/* Max Weight Capacity */}
      <div className="mt-1.5 flex items-center justify-between text-2xs font-mono text-slate-600">
        <span className="flex items-center gap-1">
          <Weight className="w-3 h-3 text-slate-500" />
          Tải trọng tối đa: <strong className="text-slate-900">{data.maxWeightKg} kg</strong>
        </span>
        <span className="font-sans font-semibold text-slate-400">Kho WH-01</span>
      </div>
    </div>
  );
};
