import React from 'react';
import { Barcode, Box, Copy, Check, Printer, Edit2, Eye, DollarSign, Ruler, Image as ImageIcon } from 'lucide-react';
import { ProductItem } from '../types';
import { getCategoryBadge, getZoneBadge } from '../utils/productBadges';

interface ProductMobileCardsProps {
  products: ProductItem[];
  copiedBarcode: string | null;
  onCopyBarcode: (code: string) => void;
  onPrintBarcode: (product: ProductItem) => void;
  onEditProduct: (product: ProductItem) => void;
  onViewDetail?: (product: ProductItem) => void;
}

export const ProductMobileCards: React.FC<ProductMobileCardsProps> = ({
  products,
  copiedBarcode,
  onCopyBarcode,
  onPrintBarcode,
  onEditProduct,
  onViewDetail,
}) => {
  if (products.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 italic text-sm bg-white">
        Không tìm thấy mặt hàng nào phù hợp với bộ lọc tìm kiếm.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 bg-slate-50/70">
      {products.map((p) => {
        const isUnderSafety = p.currentStock <= p.safetyStock;
        const isUnderReorder = p.currentStock <= p.reorderPoint && !isUnderSafety;
        const inventoryValue = p.currentStock * (p.purchasePrice || 0);

        return (
          <div
            key={p.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
          >
            {/* Header: Thumbnail + SKU + Barcode + Actions */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                <div
                  onClick={() => onViewDetail && onViewDetail(p)}
                  className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 cursor-pointer flex items-center justify-center"
                >
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                <div>
                  <div className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="text-blue-700">{p.sku}</span>
                    {p.brand && (
                      <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 bg-slate-100 rounded">
                        {p.brand}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit">
                    <Barcode className="w-3.5 h-3.5 text-blue-600" />
                    <span>{p.barcode}</span>
                    <button
                      onClick={() => onCopyBarcode(p.barcode)}
                      title="Sao chép Barcode"
                      className="hover:text-blue-600 ml-1 p-0.5 cursor-pointer"
                    >
                      {copiedBarcode === p.barcode ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {onViewDetail && (
                  <button
                    onClick={() => onViewDetail(p)}
                    title="Xem chi tiết"
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 border border-slate-200 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onPrintBarcode(p)}
                  title="In tem mã vạch"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onEditProduct(p)}
                  title="Chỉnh sửa sản phẩm"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Product Name */}
            <div>
              <div
                onClick={() => onViewDetail && onViewDetail(p)}
                className="font-bold text-slate-900 text-sm leading-snug cursor-pointer hover:text-blue-600"
              >
                {p.name}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>NCC: <span className="font-medium text-slate-700">{p.supplierName}</span></span>
                <span className="font-mono text-[11px]">ĐVT: {p.unit} ({p.weightKg} kg)</span>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs font-mono grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 text-[10px] block">Giá nhập / Vốn:</span>
                <span className="font-bold text-emerald-700">{(p.purchasePrice || 0).toLocaleString()} ₫</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Giá bán đề xuất:</span>
                <span className="font-bold text-blue-700">{(p.sellingPrice || 0).toLocaleString()} ₫</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Trị giá tồn kho:</span>
                <span className="font-extrabold text-slate-900">{inventoryValue.toLocaleString()} ₫</span>
              </div>
            </div>

            {/* Badges: Category & Storage Zone & Lifecycle */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                  p.businessStatus === 'ACTIVE' || !p.businessStatus
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : p.businessStatus === 'SUSPENDED'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {p.businessStatus === 'ACTIVE' || !p.businessStatus
                  ? 'Đang KD'
                  : p.businessStatus === 'SUSPENDED'
                  ? 'Tạm ngưng nhập'
                  : 'Ngừng KD'}
              </span>
              {getCategoryBadge(p.category)}
              {getZoneBadge(p.storageZone)}
            </div>

            {/* Stock Level Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Tồn kho:</span>
                <span
                  className={`font-mono font-bold ${
                    isUnderSafety
                      ? 'text-rose-600'
                      : isUnderReorder
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {p.currentStock.toLocaleString()} {p.unit}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Min: {p.safetyStock} | ROP: {p.reorderPoint}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
