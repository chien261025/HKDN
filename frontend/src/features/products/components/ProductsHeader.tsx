import React from 'react';
import { Package, Building2, AlertTriangle, Plus, ShieldAlert } from 'lucide-react';
import { ProductItem, SupplierItem } from '../types';

interface ProductsHeaderProps {
  activeTab: 'PRODUCTS' | 'SUPPLIERS';
  setActiveTab: (tab: 'PRODUCTS' | 'SUPPLIERS') => void;
  products: ProductItem[];
  suppliers: SupplierItem[];
  onOpenCreateModal: () => void;
}

export const ProductsHeader: React.FC<ProductsHeaderProps> = ({
  activeTab,
  setActiveTab,
  products,
  suppliers,
  onOpenCreateModal,
}) => {
  const lowStockCount = products.filter((p) => p.currentStock <= p.safetyStock).length;
  const reorderCount = products.filter((p) => p.currentStock <= p.reorderPoint && p.currentStock > p.safetyStock).length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs ring-4 ring-indigo-50 shrink-0">
            {activeTab === 'PRODUCTS' ? <Package className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                Danh Mục Sản Phẩm & Nhà Cung Cấp
              </h1>
              <span className="text-[11px] font-mono bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 font-semibold uppercase">
                Master Data
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Định mức an toàn (Safety Stock) • Điểm đặt hàng lại (Reorder Point) • Mã vạch Barcode chuẩn GS1
            </p>
          </div>
        </div>

        {/* Tab switchers & Create button */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'PRODUCTS'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Package className="w-4 h-4 text-indigo-600" />
              <span>Sản Phẩm ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Nhà Cung Cấp ({suppliers.length})</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'PRODUCTS' ? 'Thêm Sản Phẩm Mới' : 'Thêm Nhà Cung Cấp'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total SKU */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tổng Số Mặt Hàng</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">{products.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Danh mục SKU đang lưu kho</div>
        </div>

        {/* Safety Stock Alert */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">Dưới Tồn An Toàn</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono mt-1.5 tabular-nums">{lowStockCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-rose-700 font-medium">
            {lowStockCount > 0 ? 'Cảnh báo: Nguy cơ thiếu hụt hàng' : 'Tồn kho trên ngưỡng an toàn'}
          </div>
        </div>

        {/* Reorder Point Alert */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider block">Cần Đặt Thêm (PO)</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono mt-1.5 tabular-nums">{reorderCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-700 font-medium">
            Chạm ngưỡng điểm đặt hàng lại (ROP)
          </div>
        </div>

        {/* Total Suppliers */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">Đối Tác Cung Ứng</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 font-mono mt-1.5 tabular-nums">{suppliers.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">Nhà cung cấp đã ký hợp đồng</div>
        </div>
      </div>
    </div>
  );
};

