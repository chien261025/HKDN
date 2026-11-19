import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Barcode,
  ShieldAlert,
  Copy,
  Check,
  Printer,
  Edit2,
  Box,
  Eye,
  DollarSign,
  Ruler,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { ProductItem } from '../types';
import { ProductMobileCards } from './ProductMobileCards';
import { getCategoryBadge, getZoneBadge } from '../utils/productBadges';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 10;

interface ProductTableProps {
  products: ProductItem[];
  onPrintBarcode: (product: ProductItem) => void;
  onEditProduct: (product: ProductItem) => void;
  onViewDetail?: (product: ProductItem) => void;
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onPrintBarcode,
  onEditProduct,
  onViewDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [stockHealthFilter, setStockHealthFilter] = useState<string>('ALL');
  const [businessStatusFilter, setBusinessStatusFilter] = useState<string>('ALL');
  const [copiedBarcode, setCopiedBarcode] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

    const matchBusiness =
      businessStatusFilter === 'ALL' ||
      (p.businessStatus || (p.status === 'INACTIVE' ? 'SUSPENDED' : 'ACTIVE')) === businessStatusFilter;

    return matchSearch && matchCategory && matchHealth && matchBusiness;
  });

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const visibleProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, stockHealthFilter, businessStatusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Filters bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, barcode, tên sản phẩm, thương hiệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Trạng thái kinh doanh */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <select
              value={businessStatusFilter}
              onChange={(e) => setBusinessStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái KD</option>
              <option value="ACTIVE">Đang kinh doanh</option>
              <option value="SUSPENDED">Tạm ngưng nhập</option>
              <option value="DISCONTINUED">Ngừng kinh doanh</option>
            </select>
          </div>

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
              <option value="CHEMICAL">Hóa Mỹ Phẩm & Tẩy Rửa</option>
              <option value="ELECTRONICS">Linh Kiện & Điện Tử</option>
              <option value="PHARMACEUTICAL">Dược Phẩm Y Tế</option>
              <option value="FASHION">Thời Trang & Dệt May</option>
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
              <option value="CRITICAL">Dưới Tồn An Toàn (Min)</option>
              <option value="REORDER">Cần Đặt Thêm (ROP)</option>
              <option value="NORMAL">Tồn Kho An Toàn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Card Feed (< md) */}
      <div className="block md:hidden">
        <ProductMobileCards
          products={visibleProducts}
          copiedBarcode={copiedBarcode}
          onCopyBarcode={handleCopy}
          onPrintBarcode={onPrintBarcode}
          onEditProduct={onEditProduct}
          onViewDetail={onViewDetail}
        />
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3.5">Sản Phẩm & Định Danh</th>
              <th className="py-3 px-3">Phân Loại & Vùng</th>
              <th className="py-3 px-3">Quy Cách & Thể Tích</th>
              <th className="py-3 px-3">Đơn Giá & Giá Vốn</th>
              <th className="py-3 px-3 text-center">Tồn Cuối / Định Mức</th>
              <th className="py-3 px-3">Trạng Thái</th>
              <th className="py-3 px-3.5 text-right">Thao Tác</th>
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
              visibleProducts.map((p) => {
                const isUnderSafety = p.currentStock <= p.safetyStock;
                const isUnderReorder = p.currentStock <= p.reorderPoint && !isUnderSafety;
                const inventoryValue = p.currentStock * (p.purchasePrice || 0);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Cột 1: Thumbnail & SKU & Tên */}
                    <td className="py-3 px-3.5 max-w-[260px]">
                      <div className="flex items-start gap-2.5">
                        {/* Thumbnail image */}
                        <div
                          onClick={() => onViewDetail && onViewDetail(p)}
                          className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 cursor-pointer shadow-2xs hover:ring-2 hover:ring-blue-400 transition-all flex items-center justify-center"
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

                        {/* Name, SKU, Barcode */}
                        <div className="min-w-0 flex-1">
                          <div
                            onClick={() => onViewDetail && onViewDetail(p)}
                            className="font-bold text-slate-900 truncate text-xs sm:text-sm hover:text-blue-600 transition-colors cursor-pointer"
                            title={p.name}
                          >
                            {p.name}
                          </div>

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-bold text-blue-700 text-xs">{p.sku}</span>
                            {p.brand && (
                              <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 bg-slate-100 rounded">
                                {p.brand}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 mt-0.5 w-fit">
                            <Barcode className="w-3 h-3 text-slate-400" />
                            <span>{p.barcode}</span>
                            <button
                              onClick={() => handleCopy(p.barcode)}
                              title="Sao chép Barcode"
                              className="hover:text-blue-600 p-0.5 cursor-pointer"
                            >
                              {copiedBarcode === p.barcode ? (
                                <Check className="w-2.5 h-2.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-2.5 h-2.5 text-slate-400" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Phân loại & Vùng & NCC */}
                    <td className="py-3 px-3 space-y-1">
                      <div>{getCategoryBadge(p.category)}</div>
                      <div>{getZoneBadge(p.storageZone)}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[150px]" title={p.supplierName}>
                        {p.supplierName}
                      </div>
                    </td>

                    {/* Cột 3: Quy cách, Trọng lượng & CBM */}
                    <td className="py-3 px-3 font-mono text-xs">
                      <div>
                        ĐVT: <span className="font-bold text-slate-900">{p.unit}</span>
                      </div>
                      <div className="text-slate-500 mt-0.5">{p.weightKg} kg / đơn vị</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        {p.lengthCm || 20}x{p.widthCm || 15}x{p.heightCm || 10}cm
                      </div>
                      <div className="text-blue-700 font-bold text-[10px] mt-0.5">
                        {p.volumeCbm || 0.003} m³
                      </div>
                    </td>

                    {/* Cột 4: Đơn Giá (Giá Nhập / Giá Bán & Trị giá tồn) */}
                    <td className="py-3 px-3 font-mono text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400 text-[11px]">Giá nhập:</span>
                        <span className="font-bold text-emerald-700">
                          {(p.purchasePrice || 0).toLocaleString()} ₫
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className="text-slate-400 text-[11px]">Giá bán:</span>
                        <span className="font-bold text-blue-700">
                          {(p.sellingPrice || 0).toLocaleString()} ₫
                        </span>
                      </div>
                      <div className="pt-1 mt-1 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500">Trị giá tồn:</span>
                        <span className="font-extrabold text-slate-900">
                          {inventoryValue.toLocaleString()} ₫
                        </span>
                      </div>
                    </td>

                    {/* Cột 5: Tồn kho & Định mức */}
                    <td className="py-3 px-3">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-black font-mono ${
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
                              width: `${Math.min(
                                100,
                                Math.round((p.currentStock / ((p.maxStock || 500) * 0.8)) * 100)
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="flex justify-between w-24 text-[10px] font-mono text-slate-400 mt-0.5">
                          <span>Min: {p.safetyStock}</span>
                          <span>ROP: {p.reorderPoint}</span>
                        </div>
                      </div>
                    </td>

                    {/* Cột 6: Trạng thái kinh doanh */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                          p.businessStatus === 'ACTIVE' || !p.businessStatus
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : p.businessStatus === 'SUSPENDED'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {p.businessStatus === 'ACTIVE' || !p.businessStatus
                          ? 'Đang kinh doanh'
                          : p.businessStatus === 'SUSPENDED'
                          ? 'Tạm ngưng nhập'
                          : 'Ngừng kinh doanh'}
                      </span>
                    </td>

                    {/* Cột 7: Thao tác */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onViewDetail && (
                          <button
                            onClick={() => onViewDetail(p)}
                            title="Xem chi tiết hồ sơ kỹ thuật"
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition-colors border border-slate-200 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onPrintBarcode(p)}
                          title="In tem mã vạch & QR"
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

      <Pagination
        currentPage={currentPage}
        totalItems={filteredProducts.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

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
            <span className="w-2 h-2 rounded-full bg-rose-500"></span> Dưới tồn tối thiểu (Min)
          </span>
        </div>
      </div>
    </div>
  );
};
