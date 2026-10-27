import React from 'react';
import { Barcode, Box, Copy, Check, Printer, Edit2 } from 'lucide-react';
import { ProductItem } from '../types';
import { getCategoryBadge, getZoneBadge } from '../utils/productBadges';

interface ProductMobileCardsProps {
  products: ProductItem[];
  copiedBarcode: string | null;
  onCopyBarcode: (code: string) => void;
  onPrintBarcode: (product: ProductItem) => void;
  onEditProduct: (product: ProductItem) => void;
}

export const ProductMobileCards: React.FC<ProductMobileCardsProps> = ({
  products,
  copiedBarcode,
  onCopyBarcode,
  onPrintBarcode,
  onEditProduct,
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

        return (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
          >
            {/* Header: SKU, Barcode, Actions */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Box className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{p.sku}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit">
                  <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{p.barcode}</span>
                  <button
                    onClick={() => onCopyBarcode(p.barcode)}
                    title="Sao chép Barcode"
                    className="hover:text-indigo-600 ml-1 p-0.5 cursor-pointer"
                  >
                    {copiedBarcode === p.barcode ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onPrintBarcode(p)}
                  title="In tem mã vạch"
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onEditProduct(p)}
                  title="Chỉnh sửa sản phẩm"
                  className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Product Name & Supplier */}
            <div>
              <div className="font-semibold text-slate-900 text-sm leading-snug">
                {p.name}
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                <span>NCC: <span className="font-medium text-slate-700">{p.supplierName}</span></span>
                <span className="font-mono text-[11px]">ĐVT: {p.unit} ({p.weightKg} kg)</span>
              </div>
            </div>

            {/* Badges: Category & Storage Zone */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {getCategoryBadge(p.category)}
              {getZoneBadge(p.storageZone)}
            </div>

            {/* Stock Progress & Benchmarks */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Tồn kho khả dụng:</span>
                <span
                  className={`text-sm font-bold font-mono ${
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

              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isUnderSafety
                      ? 'bg-rose-500'
                      : isUnderReorder
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.round((p.currentStock / (p.reorderPoint * 1.5)) * 100))}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                <span>An toàn (Min): {p.safetyStock}</span>
                <span>Điểm đặt lại (ROP): {p.reorderPoint}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
