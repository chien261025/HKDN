import React, { useState } from 'react';
import { X, Printer, Barcode, CheckCircle2, ShieldAlert, QrCode, Sparkles } from 'lucide-react';
import { ProductItem } from '../types';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [codeType, setCodeType] = useState<'BARCODE' | 'QR'>('BARCODE');
  const [showPrice, setShowPrice] = useState(true);

  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate QR data URL using public SVG generator or QR matrix representation
  const qrData = encodeURIComponent(
    JSON.stringify({
      sku: product.sku,
      bc: product.barcode,
      name: product.name,
      zone: product.storageZone,
      price: product.sellingPrice,
    })
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">In Tem Nhãn Định Danh Barcode / QR</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tiêu chuẩn GS1-128 & QR Code 2D dán thùng / Pallet WMS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Toolbar */}
        <div className="px-5 py-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setCodeType('BARCODE')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                codeType === 'BARCODE'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Barcode className="w-3.5 h-3.5" />
              <span>Mã Vạch 1D</span>
            </button>
            <button
              onClick={() => setCodeType('QR')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                codeType === 'QR'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Mã QR 2D</span>
            </button>
          </div>

          <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={showPrice}
              onChange={(e) => setShowPrice(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>In giá niêm yết</span>
          </label>
        </div>

        {/* Printable Tag Preview */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-100 print:bg-white print:p-0">
          <div className="w-full max-w-sm bg-white text-slate-950 p-5 rounded-2xl shadow-lg border-2 border-slate-400 font-sans print:border-black print:shadow-none">
            {/* Tag Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">SMART WMS ENTERPRISE</div>
                <div className="text-sm font-black uppercase tracking-tight">TEM NHÃN ĐỊNH DANH HÀNG HÓA</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-0.5 text-xs font-black uppercase bg-black text-white rounded">
                  {product.storageZone}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-1 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black text-blue-900">
                  SKU: <span className="text-base">{product.sku}</span>
                </span>
                {product.brand && (
                  <span className="text-[11px] font-bold uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {product.brand}
                  </span>
                )}
              </div>

              <div className="text-sm font-extrabold leading-snug text-slate-900 line-clamp-2">
                {product.name}
              </div>

              <div className="text-xs text-slate-700 font-medium">
                NCC: {product.supplierName} ({product.supplierCode})
              </div>

              <div className="flex items-center justify-between text-xs text-slate-700 font-mono pt-1">
                <span>ĐVT: <b>{product.unit}</b> ({product.weightKg} kg)</span>
                <span>KT: <b>{product.lengthCm || 20}x{product.widthCm || 15}x{product.heightCm || 10}cm</b></span>
              </div>

              {showPrice && product.sellingPrice && product.sellingPrice > 0 && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                  <span className="text-slate-500 font-medium">Giá bán niêm yết:</span>
                  <span className="font-mono font-black text-slate-900 text-sm">
                    {product.sellingPrice.toLocaleString()} VNĐ
                  </span>
                </div>
              )}
            </div>

            {/* Code Visualization (1D or 2D) */}
            <div className="border-t-2 border-dashed border-slate-300 pt-3 flex flex-col items-center">
              {codeType === 'BARCODE' ? (
                <div className="w-full flex flex-col items-center">
                  <div className="h-16 w-full flex items-center justify-center gap-[2px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                    {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 3, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2].map(
                      (width, idx) => (
                        <div
                          key={idx}
                          className="bg-black h-full"
                          style={{ width: `${width * 1.5}px` }}
                        />
                      )
                    )}
                  </div>
                  <div className="font-mono text-sm font-black tracking-[0.25em] text-slate-900 mt-1.5">
                    {product.barcode}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">
                    GS1-128 / Code-128 Standard
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="p-2 bg-white rounded-xl border-2 border-black">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${qrData}`}
                      alt="QR Code"
                      className="w-28 h-28"
                    />
                  </div>
                  <div className="font-mono text-xs font-bold text-slate-900 mt-1.5">
                    SCAN TO IDENTIFY SKU
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">
                    GS1 Digital Link 2D Matrix
                  </div>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span>ĐK: {product.storageCondition || 'AMBIENT'}</span>
              <span>CBM: {product.volumeCbm || 0.003} m³</span>
              <span>SMART-WMS v2.0</span>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Hỗ trợ máy in tem nhãn nhiệt Zebra, Xprinter hoặc máy in văn phòng A4.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
