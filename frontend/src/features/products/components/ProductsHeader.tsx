import React, { useState, useEffect } from 'react';
import { Package, Building2, AlertTriangle, Plus, ShieldAlert, Tags, DollarSign, Download, CheckCircle2, PackageCheck, AlertCircle, Upload, Eye, EyeOff } from 'lucide-react';
import { ProductItem, SupplierItem } from '../types';
import { canViewCostPrice, isPriceMaskedGlobally, setGlobalPriceMask } from '../../auth/utils/permissionUtils';

interface ProductsHeaderProps {
  activeTab: 'PRODUCTS' | 'SUPPLIERS' | 'CATEGORIES';
  setActiveTab: (tab: 'PRODUCTS' | 'SUPPLIERS' | 'CATEGORIES') => void;
  products: ProductItem[];
  suppliers: SupplierItem[];
  onOpenCreateModal: () => void;
  onOpenImportModal?: () => void;
  selectedHealthFilter?: string;
  onSelectHealthFilter?: (filter: string) => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  activeTab,
  setActiveTab,
  products,
  suppliers,
  onOpenCreateModal,
  onOpenImportModal,
  selectedHealthFilter = 'ALL',
  onSelectHealthFilter,
}) => {
  const inStockCount = products.filter((p) => p.currentStock > p.safetyStock).length;
  const lowStockCount = products.filter((p) => p.currentStock <= p.safetyStock && p.currentStock > 0).length;
  const reorderCount = products.filter((p) => p.currentStock <= p.reorderPoint && p.currentStock > p.safetyStock).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;
  const warningStockCount = lowStockCount + reorderCount;

  const totalInventoryValuation = products.reduce(
    (sum, p) => sum + p.currentStock * (p.purchasePrice || 0),
    0
  );

  const [maskPriceActive, setMaskPriceActive] = useState(isPriceMaskedGlobally());
  const canSeePrice = canViewCostPrice();

  useEffect(() => {
    const handler = () => setMaskPriceActive(isPriceMaskedGlobally());
    window.addEventListener('smart_wms_price_mask_changed', handler);
    return () => window.removeEventListener('smart_wms_price_mask_changed', handler);
  }, []);

  const formatCurrency = (val: number) => {
    if (!canSeePrice) {
      return '***';
    }
    if (val >= 1_000_000_000) {
      return (val / 1_000_000_000).toFixed(2) + ' Tỷ';
    }
    if (val >= 1_000_000) {
      return (val / 1_000_000).toFixed(1) + ' Tr';
    }
    return val.toLocaleString() + ' ₫';
  };

  const handleExportCsv = () => {
    if (products.length === 0) return;
    const headers = [
      'Mã Sản Phẩm',
      'Mã Vạch',
      'Tên Sản Phẩm',
      'Thương Hiệu',
      'Xuất Xứ',
      'Đơn Vị Tính',
      'Trọng Lượng (kg)',
      'Kích Thước (cm)',
      'Thể Tích (m3)',
      'Giá Nhập (VND)',
      'Giá Bán (VND)',
      'Tồn Kho',
      'Tồn Tối Thiểu',
      'Ngưỡng Cần Nhập',
      'Tồn Tối Đa',
      'Tổng Giá Trị Tồn (VND)',
      'Nhà Cung Cấp',
      'Vùng Lưu Kho',
      'Trạng Thái Kinh Doanh',
    ];

    const rows = products.map((p) => [
      `"${p.sku}"`,
      `"${p.barcode}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.brand || '').replace(/"/g, '""')}"`,
      `"${(p.origin || '').replace(/"/g, '""')}"`,
      `"${p.unit}"`,
      p.weightKg || 1,
      `"${p.lengthCm || 20}x${p.widthCm || 15}x${p.heightCm || 10}"`,
      p.volumeCbm || 0.003,
      canSeePrice ? (p.purchasePrice || 0) : '"***"',
      canSeePrice ? (p.sellingPrice || 0) : '"***"',
      p.currentStock || 0,
      p.safetyStock || 0,
      p.reorderPoint || 0,
      p.maxStock || 500,
      canSeePrice ? ((p.currentStock || 0) * (p.purchasePrice || 0)) : '"***"',
      `"${(p.supplierName || '').replace(/"/g, '""')}"`,
      `"${p.storageZone}"`,
      `"${p.businessStatus || 'ACTIVE'}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WMS_Danh_Muc_Hang_Hoa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 ring-4 ring-blue-50 shrink-0">
            {activeTab === 'PRODUCTS' ? (
              <Package className="w-5 h-5 text-white" />
            ) : activeTab === 'CATEGORIES' ? (
              <Tags className="w-5 h-5 text-white" />
            ) : (
              <Building2 className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Danh Mục Sản Phẩm & Hàng Hóa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Quản lý mã hàng, mã vạch, đơn vị tính, kích thước, giá cả và định mức tồn kho
            </p>
          </div>
        </div>

        {/* Tab switchers & Action buttons */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'PRODUCTS'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Package className="w-4 h-4 text-blue-600" />
              <span>Sản Phẩm ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('CATEGORIES')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'CATEGORIES'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Tags className="w-4 h-4 text-blue-600" />
              <span>Danh mục</span>
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Nhà Cung Cấp ({suppliers.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút bật/tắt chế độ bảo mật giá vốn (chuẩn doanh nghiệp) */}
            <button
              onClick={() => setGlobalPriceMask(!maskPriceActive)}
              title={maskPriceActive ? 'Đang ẩn giá vốn (Chế độ bảo mật) - Nhấn để hiển thị' : 'Đang hiện giá vốn - Nhấn để che giấu giá vốn (Chế độ bảo mật kho)'}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                maskPriceActive
                  ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-100 shadow-xs'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
              }`}
            >
              {maskPriceActive ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4 text-slate-500" />}
              <span>{maskPriceActive ? 'Bảo Mật Giá: BẬT' : 'Bảo Mật Giá'}</span>
            </button>

            {activeTab === 'PRODUCTS' && products.length > 0 && (
              <button
                onClick={handleExportCsv}
                title="Xuất bảng danh mục hàng hóa ra file CSV/Excel"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Xuất CSV</span>
              </button>
            )}

            {activeTab === 'PRODUCTS' && onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                title="Nhập dữ liệu danh mục sản phẩm hàng loạt từ file Excel / CSV"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Nhập Excel / CSV</span>
              </button>
            )}

            {activeTab !== 'CATEGORIES' && (
              <button
                onClick={onOpenCreateModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-200 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{activeTab === 'PRODUCTS' ? 'Thêm Sản Phẩm Mới' : 'Thêm Nhà Cung Cấp'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5 KPI Metrics (Tương tác trực tiếp để lọc bảng danh mục) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total SKU */}
        <div
          onClick={() => onSelectHealthFilter && onSelectHealthFilter('ALL')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none ${
            selectedHealthFilter === 'ALL'
              ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
          }`}
          title="Toàn bộ danh mục sản phẩm"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tổng Sản Phẩm
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">
                {products.length}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${selectedHealthFilter === 'ALL' ? 'bg-blue-600 text-white border-blue-700' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            <span>Toàn bộ danh mục</span>
          </div>
        </div>

        {/* Card 2: Còn hàng an toàn */}
        <div
          onClick={() => onSelectHealthFilter && onSelectHealthFilter('NORMAL')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none ${
            selectedHealthFilter === 'NORMAL'
              ? 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
          }`}
          title="Mặt hàng có tồn kho an toàn"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                Còn Hàng Ổn Định
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1.5 tabular-nums">
                {inStockCount}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${selectedHealthFilter === 'NORMAL' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-medium">
            <span>Tồn trên mức an toàn</span>
          </div>
        </div>

        {/* Card 3: Cảnh báo ROP & Min */}
        <div
          onClick={() => onSelectHealthFilter && onSelectHealthFilter('WARNING')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none ${
            selectedHealthFilter === 'WARNING' || selectedHealthFilter === 'CRITICAL' || selectedHealthFilter === 'REORDER'
              ? 'ring-2 ring-amber-600 border-amber-600 bg-amber-50/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
          }`}
          title="Mặt hàng sắp hết hoặc chạm điểm đặt hàng"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">
                Sắp Hết Hàng
              </span>
              <div className="text-2xl font-extrabold text-amber-600 font-mono mt-1.5 tabular-nums">
                {warningStockCount}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${selectedHealthFilter === 'CRITICAL' || selectedHealthFilter === 'REORDER' ? 'bg-amber-600 text-white border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            <span>Cần nhập thêm</span>
          </div>
        </div>

        {/* Card 4: Hết hàng */}
        <div
          onClick={() => onSelectHealthFilter && onSelectHealthFilter('OUT_OF_STOCK')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer select-none ${
            selectedHealthFilter === 'OUT_OF_STOCK'
              ? 'ring-2 ring-rose-600 border-rose-600 bg-rose-50/20 shadow-sm'
              : 'border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-sm'
          }`}
          title="Mặt hàng có số lượng tồn bằng 0"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
                Đã Hết Hàng
              </span>
              <div className="text-2xl font-extrabold text-rose-600 font-mono mt-1.5 tabular-nums">
                {outOfStockCount}
              </div>
            </div>
            <div className={`p-2.5 rounded-xl border ${selectedHealthFilter === 'OUT_OF_STOCK' ? 'bg-rose-600 text-white border-rose-700' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-700 font-medium">
            <span>{outOfStockCount > 0 ? 'Cần nhập hàng ngay' : 'Không có mặt hàng trống'}</span>
          </div>
        </div>

        {/* Card 5: Total Valuation */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors col-span-2 md:col-span-1">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                Tổng Giá Trị Tồn Kho
              </span>
              <div className="text-2xl font-extrabold text-emerald-700 font-mono mt-1.5 tabular-nums">
                {formatCurrency(totalInventoryValuation)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-mono font-medium truncate" title={canSeePrice ? `${totalInventoryValuation.toLocaleString()} ₫` : 'Đã ẩn bảo mật'}>
            {canSeePrice ? `${totalInventoryValuation.toLocaleString()} ₫` : '*** (Bảo mật nội bộ)'}
          </div>
        </div>
      </div>
    </div>
  );
};
