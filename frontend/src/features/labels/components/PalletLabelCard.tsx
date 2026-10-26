import React from 'react';
import { Truck, Box, Calendar, CheckCircle2, QrCode } from 'lucide-react';
import { BarcodeSvg, QrCodeSvg } from '../../../components/common';

export interface PalletLabelData {
  palletCode: string;
  orderCode: string;
  productName: string;
  sku: string;
  totalQuantity: number;
  unit: string;
  grossWeightKg: number;
  destinationLocation: string;
  dateCreated: string;
  inspectorName: string;
}

interface PalletLabelCardProps {
  data: PalletLabelData;
  className?: string;
}

export const PalletLabelCard: React.FC<PalletLabelCardProps> = ({ data, className = '' }) => {
  const qrPayload = JSON.stringify({
    pallet: data.palletCode,
    order: data.orderCode,
    sku: data.sku,
    qty: data.totalQuantity,
    dest: data.destinationLocation,
  });

  return (
    <div
      className={`bg-white border-3 border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-slate-900 shadow-md print-pallet-label ${className}`}
      style={{ width: '100%', maxWidth: '380px', minHeight: '360px' }}
    >
      {/* Header */}
      <div className="pb-3 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-700 shrink-0" />
            <span className="font-black text-xs tracking-wider uppercase">
              SMART WMS • THẺ PALLET / KIỆN HÀNG
            </span>
          </div>
          <span className="text-2xs font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-mono border border-indigo-300">
            LOGISTICS A6
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-2xs text-slate-500 font-mono">
          <span>Đơn hàng: <strong className="text-slate-800">{data.orderCode}</strong></span>
          <span>Ngày đóng: <strong>{data.dateCreated}</strong></span>
        </div>
      </div>

      {/* Main Pallet Code & Barcode */}
      <div className="my-3 text-center">
        <span className="text-3xs font-mono font-bold text-slate-500 uppercase tracking-widest block">
          MÃ ĐỊNH DANH PALLET (SSCC-18)
        </span>
        <h2 className="text-lg font-black font-mono tracking-tight text-slate-950 mt-0.5">
          {data.palletCode}
        </h2>
        <div className="mt-1 flex justify-center overflow-hidden">
          <BarcodeSvg
            value={data.palletCode}
            format="CODE128"
            width={1.8}
            height={48}
            fontSize={12}
          />
        </div>
      </div>

      {/* Product Details & Destination Box */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-300 space-y-1.5 text-xs font-mono">
        <div className="font-bold font-sans text-slate-900 line-clamp-1">
          {data.productName}
        </div>
        <div className="flex justify-between text-slate-600">
          <span>Mã SKU: <strong className="text-slate-900">{data.sku}</strong></span>
          <span>Vị trí đích: <strong className="text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">{data.destinationLocation}</strong></span>
        </div>
        <div className="flex justify-between items-center pt-1 border-t border-slate-200">
          <span>Tổng số lượng: <strong className="text-emerald-700 text-sm">{data.totalQuantity} {data.unit}</strong></span>
          <span>Trọng lượng: <strong className="text-slate-900">{data.grossWeightKg} kg</strong></span>
        </div>
      </div>

      {/* QR Code and Inspection Sign */}
      <div className="mt-3 pt-2.5 border-t-2 border-slate-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <QrCodeSvg value={qrPayload} size={64} level="M" />
          <div className="text-3xs font-mono text-slate-500">
            <span className="font-bold text-slate-700 block">QUÉT TỰ ĐỘNG</span>
            <span>Khớp vị trí ô kệ</span>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-3xs font-bold border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>ĐÃ KIỂM SOÁT QC</span>
          </div>
          <div className="text-3xs font-mono text-slate-500 mt-1">
            KTV: <strong className="text-slate-800">{data.inspectorName}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
