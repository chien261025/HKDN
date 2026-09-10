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
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Thực Phẩm & Đồ Uống</span>;
      case 'CHEMICAL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">Hóa Chất / Dung Môi</span>;
      case 'ELECTRONICS':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Linh Kiện Điện Tử</span>;
      case 'PHARMA':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Dược Phẩm Y Tế</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">Hàng Tổng Hợp</span>;
    }
  };

  const getZoneBadge = (zone: 'ZONE_A' | 'ZONE_B') => {
    if (zone === 'ZONE_B') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
          ZONE B (Kho Mát 2-8°C)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
        ZONE A (Khô & Thường)
      </span>
    );
  };

  return (
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Filters bar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, mã vạch Barcode, tên mặt hàng, NCC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-700/70">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">Tất cả ngành hàng</option>
              <option value="FOOD_BEVERAGE" className="bg-slate-900 text-white">Thực Phẩm & Đồ Uống</option>
              <option value="CHEMICAL" className="bg-slate-900 text-white">Hóa Chất / Dung Môi</option>
              <option value="ELECTRONICS" className="bg-slate-900 text-white">Linh Kiện Điện Tử</option>
              <option value="PHARMA" className="bg-slate-900 text-white">Dược Phẩm Y Tế</option>
              <option value="GENERAL" className="bg-slate-900 text-white">Hàng Tổng Hợp</option>
            </select>
          </div>

          {/* Health Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-700/70">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stockHealthFilter}
              onChange={(e) => setStockHealthFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">Tất cả trạng thái tồn</option>
              <option value="CRITICAL" className="bg-slate-900 text-rose-300">Dưới Tồn An Toàn (Nguy cấp)</option>
              <option value="REORDER" className="bg-slate-900 text-amber-300">Cần Đặt Thêm (≤ Reorder)</option>
              <option value="NORMAL" className="bg-slate-900 text-emerald-300">Tồn kho An Toàn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Mã SKU & Barcode</th>
              <th className="py-3 px-4">Tên Sản Phẩm</th>
              <th className="py-3 px-4">Phân Loại & Vùng Lưu Trữ</th>
              <th className="py-3 px-4">Nhà Cung Cấp</th>
              <th className="py-3 px-4 text-center">Tồn Hiện Tại / Định Mức</th>
              <th className="py-3 px-4">Quy Cách & Trọng Lượng</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
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
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* SKU & Barcode */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-white flex items-center gap-1.5">
                        <Box className="w-3.5 h-3.5 text-indigo-400" />
                        {p.sku}
                      </div>
                      <div className="flex items-center gap-1 mt-1 font-mono text-[10px] text-slate-400 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 w-fit">
                        <Barcode className="w-3 h-3 text-cyan-400" />
                        <span>{p.barcode}</span>
                        <button
                          onClick={() => handleCopy(p.barcode)}
                          title="Sao chép Barcode"
                          className="hover:text-white transition-colors ml-0.5"
                        >
                          {copiedBarcode === p.barcode ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4 max-w-[200px]">
                      <div className="font-semibold text-white truncate" title={p.name}>
                        {p.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Trạng thái:{' '}
                        <span className="text-emerald-400 font-medium">Đang kinh doanh</span>
                      </div>
                    </td>

                    {/* Category & Storage Zone */}
                    <td className="py-3.5 px-4 space-y-1.5">
                      <div>{getCategoryBadge(p.category)}</div>
                      <div>{getZoneBadge(p.storageZone)}</div>
                    </td>

                    {/* Supplier */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{p.supplierName}</div>
                      <div className="font-mono text-[10px] text-slate-500 mt-0.5">Mã: {p.supplierCode}</div>
                    </td>

                    {/* Stock Health */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-extrabold font-mono ${
                              isUnderSafety
                                ? 'text-rose-400'
                                : isUnderReorder
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {p.currentStock.toLocaleString()}
                          </span>
                          <span className="text-[11px] text-slate-400">{p.unit}</span>
                        </div>

                        {/* Progress Bar relative to Reorder Point */}
                        <div className="w-28 bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
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
                        <div className="flex justify-between w-28 text-[9px] font-mono text-slate-500 mt-1">
                          <span title="Tồn an toàn (Safety)">Min: {p.safetyStock}</span>
                          <span title="Điểm đặt lại (Reorder)">ROP: {p.reorderPoint}</span>
                        </div>
                      </div>
                    </td>

                    {/* Unit & Weight */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div>ĐVT: <span className="font-bold text-white">{p.unit}</span></div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Khối lượng: {p.weightKg} kg/{p.unit}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onPrintBarcode(p)}
                          title="In mã vạch Barcode (GS1-128 / Code 128)"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg transition-colors border border-slate-700"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditProduct(p)}
                          title="Chỉnh sửa thông số SKU"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition-colors border border-slate-700"
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
      <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
        <div>
          Hiển thị <span className="text-white font-bold">{filteredProducts.length}</span> / {products.length} mặt hàng
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> An toàn
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Cần đặt hàng (ROP)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span> Dưới tồn tối thiểu (Safety)
          </span>
        </div>
      </div>
    </div>
  );
};
