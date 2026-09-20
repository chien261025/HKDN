import React, { useState } from 'react';
import { Search, Filter, Barcode, AlertTriangle, ShieldAlert, CheckCircle2, Copy, Check, Printer, Edit2, Box } from 'lucide-react';
import { ProductItem, ProductCategory } from '../types';

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

  const getCategoryBadge = (cat: ProductCategory) => {
    switch (cat) {
      case 'FOOD_BEVERAGE':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">Thực Phẩm & Đồ Uống</span>;
      case 'CHEMICAL':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-800 border border-purple-300">Hóa Chất / Dung Môi</span>;
      case 'ELECTRONICS':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300">Linh Kiện Điện Tử</span>;
      case 'PHARMA':
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300">Dược Phẩm Y Tế</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">Hàng Tổng Hợp</span>;
    }
  };

  const getZoneBadge = (zone: 'ZONE_A' | 'ZONE_B') => {
    if (zone === 'ZONE_B') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-blue-50 text-blue-800 border border-blue-300">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
          ZONE B (Kho Mát 2-8°C)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
        ZONE A (Khô & Thường)
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
      {/* Filters bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, mã vạch Barcode, tên mặt hàng, NCC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-300 shadow-xs">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs sm:text-sm"
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
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-300 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <select
              value={stockHealthFilter}
              onChange={(e) => setStockHealthFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs sm:text-sm"
            >
              <option value="ALL">Tất cả trạng thái tồn</option>
              <option value="CRITICAL">Dưới Tồn An Toàn (Nguy cấp)</option>
              <option value="REORDER">Cần Đặt Thêm (≤ Reorder)</option>
              <option value="NORMAL">Tồn kho An Toàn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-800">
          <thead className="bg-slate-100 text-xs font-bold font-mono text-slate-800 uppercase tracking-wider border-b border-slate-300">
            <tr>
              <th className="py-3.5 px-4">Mã SKU & Barcode</th>
              <th className="py-3.5 px-4">Tên Sản Phẩm</th>
              <th className="py-3.5 px-4">Phân Loại & Vùng Lưu Trữ</th>
              <th className="py-3.5 px-4">Nhà Cung Cấp</th>
              <th className="py-3.5 px-4 text-center">Tồn Hiện Tại / Định Mức</th>
              <th className="py-3.5 px-4">Quy Cách & Trọng Lượng</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-500 italic">
                  Không tìm thấy mặt hàng nào phù hợp với bộ lọc tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const isUnderSafety = p.currentStock <= p.safetyStock;
                const isUnderReorder = p.currentStock <= p.reorderPoint && !isUnderSafety;

                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    {/* SKU & Barcode */}
                    <td className="py-4 px-4">
                      <div className="font-mono font-black text-slate-900 text-sm flex items-center gap-1.5">
                        <Box className="w-4 h-4 text-indigo-600" />
                        {p.sku}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-300 w-fit font-bold">
                        <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{p.barcode}</span>
                        <button
                          onClick={() => handleCopy(p.barcode)}
                          title="Sao chép Barcode"
                          className="hover:text-indigo-600 transition-colors ml-1 cursor-pointer"
                        >
                          {copiedBarcode === p.barcode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-slate-800" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-4 px-4 max-w-[220px]">
                      <div className="font-bold text-slate-900 truncate text-sm sm:text-base" title={p.name}>
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">
                        Trạng thái:{' '}
                        <span className="text-emerald-700 font-bold">Đang kinh doanh</span>
                      </div>
                    </td>

                    {/* Category & Storage Zone */}
                    <td className="py-4 px-4 space-y-1.5">
                      <div>{getCategoryBadge(p.category)}</div>
                      <div>{getZoneBadge(p.storageZone)}</div>
                    </td>

                    {/* Supplier */}
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900 text-sm">{p.supplierName}</div>
                      <div className="font-mono text-xs text-slate-600 mt-0.5 font-semibold">Mã: {p.supplierCode}</div>
                    </td>

                    {/* Stock Health */}
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-base font-black font-mono ${
                              isUnderSafety
                                ? 'text-rose-700'
                                : isUnderReorder
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {p.currentStock.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-600 font-bold">{p.unit}</span>
                        </div>

                        {/* Progress Bar relative to Reorder Point */}
                        <div className="w-28 bg-slate-200 rounded-full h-2 mt-1.5 overflow-hidden">
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
                          ></div>
                        </div>

                        {/* Benchmark labels */}
                        <div className="flex justify-between w-28 text-xs font-mono text-slate-600 font-semibold mt-1">
                          <span title="Tồn an toàn (Safety)">Min: {p.safetyStock}</span>
                          <span title="Điểm đặt lại (Reorder)">ROP: {p.reorderPoint}</span>
                        </div>
                      </div>
                    </td>

                    {/* Unit & Weight */}
                    <td className="py-4 px-4 font-mono text-slate-800 text-xs sm:text-sm">
                      <div>ĐVT: <span className="font-bold text-slate-900">{p.unit}</span></div>
                      <div className="text-xs text-slate-600 mt-0.5 font-sans font-medium">Khối lượng: {p.weightKg} kg/{p.unit}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onPrintBarcode(p)}
                          title="In mã vạch Barcode (GS1-128 / Code 128)"
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-colors border border-slate-300 cursor-pointer shadow-xs"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditProduct(p)}
                          title="Chỉnh sửa thông số SKU"
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-lg transition-colors border border-slate-300 cursor-pointer shadow-xs"
                        >
                          <Edit2 className="w-4 h-4" />
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
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs sm:text-sm text-slate-700 flex items-center justify-between font-mono font-semibold">
        <div>
          Hiển thị <span className="text-slate-900 font-black">{filteredProducts.length}</span> / {products.length} mặt hàng
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> An toàn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cần đặt hàng (ROP)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Dưới tồn tối thiểu (Safety)
          </span>
        </div>
      </div>
    </div>
  );
};

