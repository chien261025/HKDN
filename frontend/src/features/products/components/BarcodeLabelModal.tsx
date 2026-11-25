import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Printer,
  Barcode,
  QrCode,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Square,
  Lock,
  Copy,
} from 'lucide-react';
import { ProductItem } from '../types';
import { BarcodeSvg, QrCodeSvg } from '../../../components/common';
import { isValidEan13 } from '../utils/barcodeUtils';
import { canViewCostPrice } from '../../auth/utils/permissionUtils';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: ProductItem | null;
  products?: ProductItem[];
}

interface ProductStickerCardProps {
  product: ProductItem;
  codeType: 'BARCODE' | 'QR';
  showPrice: boolean;
}

const getStorageConditionText = (cond?: string) => {
  if (cond === 'COOL') return 'Kho mát (2-8°C)';
  if (cond === 'COLD') return 'Kho đông (-18°C)';
  if (cond === 'SECURE') return 'An ninh / Giá trị cao';
  return 'Nhiệt độ phòng';
};

const ProductStickerCard: React.FC<ProductStickerCardProps> = ({ product, codeType, showPrice }) => {
  const rawBarcode = (product.barcode || product.sku || '').trim();
  const isEan13 = isValidEan13(rawBarcode);
  const barcodeFormat = isEan13 ? 'EAN13' : 'CODE128';

  const qrPayload = JSON.stringify({
    type: 'SKU',
    sku: product.sku,
    bc: rawBarcode,
    name: product.name,
    zone: product.storageZone,
    unit: product.unit,
  });

  return (
    <div className="w-full max-w-sm bg-white text-slate-950 p-4 sm:p-5 rounded-2xl shadow-lg border-2 border-slate-400 font-sans print-single-label print:border-black print:shadow-none print:rounded-lg">
      {/* Tag Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-2.5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
            SMART WMS - KHO DOANH NGHIỆP
          </div>
          <div className="text-xs sm:text-sm font-black uppercase tracking-tight">
            TEM SẢN PHẨM &amp; MÃ VẠCH
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block px-2.5 py-0.5 text-[11px] font-black uppercase bg-black text-white rounded">
            {product.storageZone}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-mono font-black text-blue-900">
            Mã SP: <span className="text-sm sm:text-base">{product.sku}</span>
          </span>
          {product.brand && (
            <span className="text-[10px] font-bold uppercase bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {product.brand}
            </span>
          )}
        </div>

        <div className="text-sm font-extrabold leading-snug text-slate-900 line-clamp-2" title={product.name}>
          {product.name}
        </div>

        <div className="text-[11px] text-slate-700 font-medium truncate">
          NCC: {product.supplierName || 'Đối Tác'} {product.supplierCode ? `(${product.supplierCode})` : ''}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-700 font-mono pt-1">
          <span>
            ĐVT: <b>{product.unit}</b> ({product.weightKg} kg)
          </span>
          <span>
            KT: <b>{product.lengthCm || 20}x{product.widthCm || 15}x{product.heightCm || 10}cm</b>
          </span>
        </div>

        {showPrice && product.sellingPrice !== undefined && product.sellingPrice > 0 && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
            <span className="text-slate-500 font-medium">Giá niêm yết:</span>
            <span className="font-mono font-black text-slate-900 text-sm">
              {product.sellingPrice.toLocaleString()} VNĐ
            </span>
          </div>
        )}
      </div>

      {/* Code Visualization (Real ISO Barcode / Local Offline QR) */}
      <div className="border-t-2 border-dashed border-slate-300 pt-2.5 flex flex-col items-center">
        {codeType === 'BARCODE' ? (
          <div className="w-full flex flex-col items-center">
            <div className="w-full flex items-center justify-center bg-white px-2 py-1 rounded border border-slate-200 overflow-hidden">
              <BarcodeSvg
                value={rawBarcode}
                format={barcodeFormat}
                width={1.8}
                height={52}
                displayValue={true}
                fontSize={12}
              />
            </div>
            <div className="text-[10px] text-slate-500 font-mono uppercase mt-1">
              {isEan13 ? 'Chuẩn EAN-13' : 'Chuẩn Code-128'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-2 bg-white rounded-xl border-2 border-black">
              <QrCodeSvg value={qrPayload} size={112} level="M" />
            </div>
            <div className="font-mono text-xs font-bold text-slate-900 mt-1.5">
              Mã QR truy xuất
            </div>
          </div>
        )}
      </div>

      {/* Footer Notice */}
      <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>Bảo quản: {getStorageConditionText(product.storageCondition)}</span>
        <span>{product.volumeCbm || 0.003} m³</span>
        <span>SMART WMS</span>
      </div>
    </div>
  );
};

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  product,
  products,
}) => {
  const [codeType, setCodeType] = useState<'BARCODE' | 'QR'>('BARCODE');
  const [showPrice, setShowPrice] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copies, setCopies] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'GRID'>('SINGLE');
  const [maskVersion, setMaskVersion] = useState(0);

  const itemList: ProductItem[] = useMemo(() => {
    if (products && products.length > 0) return products;
    return product ? [product] : [];
  }, [products, product]);

  useEffect(() => {
    const handler = () => setMaskVersion((v) => v + 1);
    window.addEventListener('smart_wms_price_mask_changed', handler);
    return () => window.removeEventListener('smart_wms_price_mask_changed', handler);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCodeType('BARCODE');
      setShowPrice(true);
      setCurrentIndex(0);
      setCopies(1);
      setViewMode(itemList.length > 1 ? 'GRID' : 'SINGLE');
    }
  }, [isOpen, itemList.length, product?.id]);

  const canSeePrice = canViewCostPrice();
  const effectiveShowPrice = canSeePrice && showPrice;

  if (!isOpen || itemList.length === 0) return null;

  const safeIndex = Math.min(currentIndex, itemList.length - 1);
  const currentProduct = itemList[safeIndex];
  const totalStickers = itemList.length * copies;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Modal Interactive UI (Hidden when printing) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in no-print">
        <div
          className={`bg-white border border-slate-200 rounded-3xl w-full shadow-2xl overflow-hidden my-6 transition-all ${
            viewMode === 'GRID' && totalStickers > 1 ? 'max-w-4xl' : 'max-w-xl'
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                <Barcode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                  <span>In Tem Mã Vạch &amp; Mã QR</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                    {itemList.length} SKU &middot; {totalStickers} Tem
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tạo tem mã vạch 1D và QR 2D sẵn sàng in
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng hộp thoại in tem"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Options Toolbar */}
          <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Code Type Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
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
                type="button"
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

            {/* Copies per SKU & Single/Grid View Switch */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 font-semibold">
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Bản in/SP:</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                  className="w-12 bg-white border border-slate-300 rounded-md px-1.5 py-0.5 text-center font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </label>

              {totalStickers > 1 && (
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('SINGLE')}
                    className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer ${
                      viewMode === 'SINGLE' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    <Square className="w-3 h-3" />
                    <span>1 Tem</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('GRID')}
                    className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer ${
                      viewMode === 'GRID' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    <span>Lưới ({totalStickers})</span>
                  </button>
                </div>
              )}

              {itemList.length > 1 && viewMode === 'SINGLE' && (
                <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl border border-slate-200 font-mono text-xs">
                  <button
                    type="button"
                    disabled={safeIndex === 0}
                    onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                    className="p-1 rounded hover:bg-white text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Tem trước"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-slate-900 px-1">
                    {safeIndex + 1} / {itemList.length}
                  </span>
                  <button
                    type="button"
                    disabled={safeIndex === itemList.length - 1}
                    onClick={() => setCurrentIndex((prev) => Math.min(itemList.length - 1, prev + 1))}
                    className="p-1 rounded hover:bg-white text-slate-700 disabled:opacity-30 cursor-pointer"
                    title="Tem kế tiếp"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Price Visibility Toggle (Respecting Global Security Price Mask) */}
            {canSeePrice ? (
              <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>In giá niêm yết</span>
              </label>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                <Lock className="w-3 h-3" />
                <span>Đang ẩn giá bảo mật</span>
              </span>
            )}
          </div>

          {/* Printable Tag Preview */}
          <div className="p-6 bg-slate-100 max-h-[60vh] overflow-y-auto">
            {viewMode === 'SINGLE' || totalStickers === 1 ? (
              <div className="flex flex-col items-center justify-center">
                <ProductStickerCard
                  product={currentProduct}
                  codeType={codeType}
                  showPrice={effectiveShowPrice}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 justify-items-center">
                {itemList.map((prod) =>
                  Array.from({ length: copies }).map((_, copyIdx) => (
                    <div key={`grid-${prod.id}-${copyIdx}`} className="flex flex-col items-center w-full max-w-sm">
                      <ProductStickerCard
                        product={prod}
                        codeType={codeType}
                        showPrice={effectiveShowPrice}
                      />
                      {copies > 1 && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 mt-1">
                          {prod.sku} &bull; Bản {copyIdx + 1}/{copies}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">
              Sẵn sàng in {totalStickers} tem nhãn.
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
                <span>{totalStickers > 1 ? `In Tất Cả (${totalStickers} Tem)` : 'In Ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Hidden Print Spooler Container (Renders ONLY labels during @media print) */}
      <div className="hidden print:flex print:flex-wrap print:gap-3 print:w-full print:overflow-visible print-decal-grid">
        {itemList.map((prod) =>
          Array.from({ length: copies }).map((_, copyIdx) => (
            <div
              key={`print-${prod.id}-${copyIdx}`}
              className="print-decal-item break-inside-avoid page-break-inside-avoid"
              style={{ width: itemList.length * copies > 1 ? 'calc(50% - 6px)' : '380px' }}
            >
              <ProductStickerCard
                product={prod}
                codeType={codeType}
                showPrice={effectiveShowPrice}
              />
            </div>
          ))
        )}
      </div>
    </>
  );
};
