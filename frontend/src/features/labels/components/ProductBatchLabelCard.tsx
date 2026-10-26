import React from 'react';
import { Package, Calendar, AlertTriangle } from 'lucide-react';
import { BarcodeSvg, QrCodeSvg } from '../../../components/common';

export interface ProductBatchLabelData {
  productName: string;
  sku: string;
  barcode: string;
  batchNumber: string;
  manufactureDate?: string;
  expiryDate?: string;
  storageZone?: string;
  supplierName?: string;
}

interface ProductBatchLabelCardProps {
  data: ProductBatchLabelData;
  className?: string;
}

export const ProductBatchLabelCard: React.FC<ProductBatchLabelCardProps> = ({
  data,
  className = '',
}) => {
  // Chuẩn hóa payload QR để máy quét hoặc camera đọc được toàn bộ thông số
  const qrPayload = JSON.stringify({
    sku: data.sku,
    batch: data.batchNumber,
    exp: data.expiryDate || 'N/A',
  });

  return (
    <div
      className={`bg-white border-2 border-slate-900 rounded-xl p-3.5 flex flex-col justify-between text-slate-900 shadow-sm print-single-label ${className}`}
      style={{ width: '100%', maxWidth: '340px', minHeight: '195px' }}
    >
      {/* Header */}
      <div className="pb-2 border-b border-slate-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Package className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="font-black text-2xs tracking-wider uppercase text-slate-900 truncate">
              TEM LÔ HÀNG & HẠN DÙNG (FEFO)
            </span>
          </div>
          <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono">
            {data.storageZone || 'ZONE_A'}
          </span>
        </div>
        <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-1">{data.productName}</div>
      </div>

      {/* Barcode & QR Center */}
      <div className="my-2 flex items-center justify-between gap-2">
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <BarcodeSvg
            value={data.barcode || data.sku}
            format="CODE128"
            width={1.5}
            height={40}
            fontSize={11}
          />
        </div>
        <div className="flex-shrink-0 flex flex-col items-center">
          <QrCodeSvg value={qrPayload} size={62} level="M" />
          <span className="text-3xs font-mono text-slate-500 mt-0.5">QUÉT LÔ</span>
        </div>
      </div>

      {/* Batch & FEFO Expiry Dates */}
      <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-1.5 font-mono text-xs">
        <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
          <div className="text-3xs text-slate-500 font-sans uppercase">Số Lô Hàng:</div>
          <div className="font-bold text-slate-900 truncate">{data.batchNumber}</div>
        </div>

        <div className="bg-rose-50 p-1.5 rounded border border-rose-300 text-rose-900">
          <div className="text-3xs text-rose-700 font-sans uppercase flex items-center gap-1 font-bold">
            <AlertTriangle className="w-2.5 h-2.5" />
            Hạn Dùng (FEFO):
          </div>
          <div className="font-black text-rose-950 truncate flex items-center gap-1">
            <Calendar className="w-3 h-3 text-rose-600" />
            {data.expiryDate || 'Phi hạn dùng'}
          </div>
        </div>
      </div>

      {/* Supplier & Origin Footer */}
      <div className="mt-1.5 flex items-center justify-between text-3xs font-mono text-slate-500">
        <span className="truncate max-w-[200px]">{data.supplierName || 'Chính hãng'}</span>
        <span className="font-bold text-slate-700">SKU: {data.sku}</span>
      </div>
    </div>
  );
};
