import React, { useState } from 'react';
import { Search, Filter, Barcode, ShieldAlert, Copy, Check, Printer, Edit2, Box } from 'lucide-react';
import { ProductItem } from '../types';
import { ProductMobileCards } from './ProductMobileCards';
import { getCategoryBadge, getZoneBadge } from '../utils/productBadges';

interface ProductTableProps {
  products: ProductItem[];
  onPrintBarcode: (product: ProductItem) => void;
  onEditProduct: (product: ProductItem) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onPrintBarcode,
  onEditProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockHealthFilter, setStockHealthFilter] = useState<string>('ALL');
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBarcode(code);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;

    let matchHealth = true;
    if (stockHealthFilter === 'CRITICAL') {
      matchHealth = p.currentStock <= p.safetyStock;
    } else if (stockHealthFilter === 'REORDER') {
      matchHealth = p.currentStock <= p.reorderPoint && p.currentStock > p.safetyStock;
    } else if (stockHealthFilter === 'NORMAL') {
      matchHealth = p.currentStock > p.reorderPoint;
    }

    return matchSearch && matchCategory && matchHealth;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Filters bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, barcode, tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả ngành hàng</option>
              <option value="FOOD_BEVERAGE">Thực Phẩm & Đồ Uống</option>
              <option value="CHEMICAL">Hóa Chất / Dung Môi</option>
              <option value="ELECTRONICS">Linh Kiện Điện Tử</option>
              <option value="PHARMA">Dược Phẩm Y Tế</option>
              <option value="GENERAL">Hàng Tổng Hợp</option>
            </select>
          </div>

          {/* Health Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={stockHealthFilter}
              onChange={(e) => setStockHealthFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả mức tồn</option>
              <option value="CRITICAL">Dưới Tồn An Toàn</option>
              <option value="REORDER">Cần Đặt Thêm (ROP)</option>
              <option value="NORMAL">Tồn kho An Toàn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Card Feed (< md) */}
      <div className="block md:hidden">
        <ProductMobileCards
          products={filteredProducts}
          copiedBarcode={copiedBarcode}
          onCopyBarcode={handleCopy}
          onPrintBarcode={onPrintBarcode}
          onEditProduct={onEditProduct}
        />
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Mã SKU & Barcode</th>
              <th className="py-3 px-4">Tên Sản Phẩm</th>
              <th className="py-3 px-4">Phân Loại & Vùng</th>
              <th className="py-3 px-4">Nhà Cung Cấp</th>
              <th className="py-3 px-4 text-center">Tồn / Định Mức</th>
              <th className="py-3 px-4">Quy Cách</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                  Không tìm thấy mặt hàng nào phù hợp với bộ lọc tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isUnderSafety = p.currentStock <= p.safetyStock;
                const isUnderReorder = p.currentStock <= p.reorderPoint && !isUnderSafety;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-sm flex items-center gap-1.5">
                        <Box className="w-4 h-4 text-indigo-600" />
                        {p.sku}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit">
                        <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{p.barcode}</span>
                        <button
                          onClick={() => handleCopy(p.barcode)}
                          title="Sao chép Barcode"
                          className="hover:text-indigo-600 ml-1 cursor-pointer"
                        >
                          {copiedBarcode === p.barcode ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-semibold text-slate-900 truncate text-sm" title={p.name}>
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Đang kinh doanh
                      </div>
                    </td>

                    <td className="py-3.5 px-4 space-y-1">
                      <div>{getCategoryBadge(p.category)}</div>
                      <div>{getZoneBadge(p.storageZone)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 text-sm">{p.supplierName}</div>
                      <div className="font-mono text-xs text-slate-400">{p.supplierCode}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-bold font-mono ${
                              isUnderSafety
                                ? 'text-rose-600'
                                : isUnderReorder
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {p.currentStock.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">{p.unit}</span>
                        </div>

                        <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1.5 overflow-hidden">
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

                        <div className="flex justify-between w-24 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span>Min: {p.safetyStock}</span>
                          <span>ROP: {p.reorderPoint}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div>ĐVT: <span className="font-semibold text-slate-800">{p.unit}</span></div>
                      <div className="text-slate-400 mt-0.5">{p.weightKg} kg</div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPrintBarcode(p)}
                          title="In mã vạch Barcode"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditProduct(p)}
                          title="Chỉnh sửa sản phẩm"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer statistics */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2 font-mono">
        <div>
          Hiển thị <span className="text-slate-900 font-bold">{filteredProducts.length}</span> / {products.length} mặt hàng
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> An toàn
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Đặt thêm (ROP)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Dưới tồn tối thiểu
          </span>
        </div>
      </div>
    </div>
  );
};
