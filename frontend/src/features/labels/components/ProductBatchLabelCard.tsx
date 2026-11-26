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
  if (!data || !data.batchNumber) {
    return (
      <div
        className={`bg-white border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center text-xs text-slate-400 ${className}`}
        style={{ width: '100%', maxWidth: '360px', minHeight: '210px' }}
      >
        <Package className="w-8 h-8 text-slate-300 mb-2" />
        <p className="font-semibold text-slate-600">Đang tải mẫu tem lô hàng...</p>
        <p className="text-2xs text-slate-400 mt-0.5">Vui lòng chọn một lô hàng từ danh sách để xem trước tem in</p>
      </div>
    );
  }

  const isExpired = data.expiryDate ? new Date(data.expiryDate) < new Date('2026-11-21') : false;

  // Chuẩn hóa tên phân khu để hiển thị gọn gàng, không bị vỡ dòng
  const zoneTag = data.storageZone?.includes('ZONE_B')
    ? 'ZONE_B (LẠNH)'
    : data.storageZone?.includes('ZONE_A')
    ? 'ZONE_A (KHÔ)'
    : (data.storageZone || 'ZONE_A');

  // Chuẩn hóa payload QR để máy quét hoặc camera đọc được toàn bộ thông số
  const qrPayload = JSON.stringify({
    type: 'BATCH',
    sku: data.sku,
    batch: data.batchNumber,
    exp: data.expiryDate || 'N/A',
    status: isExpired ? 'EXPIRED' : 'ACTIVE',
  });

  return (
    <div
      className={`bg-white border-2 ${isExpired ? 'border-rose-600 bg-rose-50/20' : 'border-slate-900'} rounded-xl p-3 flex flex-col justify-between text-slate-900 shadow-xs print-single-label ${className}`}
      style={{ width: '100%', maxWidth: '360px', minHeight: '210px' }}
    >
      {/* 1. Header tem: Tiêu đề + Phân khu lưu trữ */}
      <div className="pb-1.5 border-b border-slate-300">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <Package className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-extrabold text-[10px] tracking-wider uppercase text-slate-900 whitespace-nowrap">
              TEM LÔ HÀNG (FEFO)
            </span>
          </div>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 font-mono whitespace-nowrap shrink-0 text-slate-700">
            {zoneTag}
          </span>
        </div>
        <div className="font-bold text-xs text-slate-900 mt-1 line-clamp-1" title={data.productName}>
          {data.productName}
        </div>
      </div>

      {/* 2. Dải cảnh báo nếu lô hàng đã hết hạn dùng */}
      {isExpired && (
        <div className="bg-rose-600 text-white text-[9.5px] font-bold px-2 py-0.5 rounded text-center my-1 uppercase tracking-tight flex items-center justify-center gap-1">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>ĐÃ QUÁ HẠN DÙNG (CÁCH LY / KIỂM KÊ)</span>
        </div>
      )}

      {/* 3. Barcode & QR Code trung tâm */}
      <div className="my-1.5 flex items-center justify-between gap-2">
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <BarcodeSvg
            value={data.barcode || data.sku}
            format="CODE128"
            width={1.6}
            height={38}
            fontSize={11}
          />
        </div>
        <div className="shrink-0 flex flex-col items-center">
          <QrCodeSvg value={qrPayload} size={58} level="M" />
          <span className="text-[8.5px] font-mono font-bold text-slate-600 mt-0.5">QUÉT LÔ</span>
        </div>
      </div>

      {/* 4. Mã Số Lô & Hạn Dùng FEFO */}
      <div className="pt-1.5 border-t border-slate-300 grid grid-cols-2 gap-1.5 font-mono text-xs">
        <div className="bg-slate-50 p-1.5 rounded border border-slate-200">
          <div className="text-[9px] text-slate-500 font-sans uppercase font-bold">Số Lô Hàng:</div>
          <div className="font-bold text-slate-900 truncate text-[11px] mt-0.5">{data.batchNumber}</div>
        </div>

        <div className={`p-1.5 rounded border ${isExpired ? 'bg-rose-100 border-rose-400 text-rose-950 font-black' : 'bg-rose-50 border-rose-300 text-rose-900'}`}>
          <div className="text-[9px] text-rose-700 font-sans uppercase flex items-center gap-1 font-bold">
            <AlertTriangle className="w-2.5 h-2.5" />
            Hạn Dùng (FEFO):
          </div>
          <div className="font-black text-rose-950 truncate flex items-center gap-1 text-[11px] mt-0.5">
            <Calendar className="w-3 h-3 text-rose-600 shrink-0" />
            <span>{data.expiryDate || 'Phi hạn dùng'}</span>
          </div>
        </div>
      </div>

      {/* 5. Nhà cung cấp & Mã SKU */}
      <div className="mt-1.5 flex items-center justify-between text-[9.5px] font-mono text-slate-500 gap-2">
        <span className="truncate max-w-[190px] text-slate-600">{data.supplierName || 'Smart WMS'}</span>
        <span className="font-mono font-bold text-slate-800 whitespace-nowrap shrink-0">
          SKU: {data.sku}
        </span>
      </div>
    </div>
  );
};
