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
      <div className="group relative bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50 flex-shrink-0">
            {activeTab === 'PRODUCTS' ? <Package className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Danh Mục Sản Phẩm & Nhà Cung Cấp
              </h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold uppercase">
                MASTER DATA
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Định mức an toàn (Safety Stock) • Điểm đặt hàng lại (Reorder Point) • Mã vạch Barcode chuẩn GS1
            </p>
          </div>
        </div>

        {/* Tab switchers & Create button */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end flex-wrap">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 gap-1">
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
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
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'PRODUCTS' ? 'Thêm SKU Mới' : 'Thêm Nhà Cung Cấp'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total SKU */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600 opacity-80" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tổng Số Mặt Hàng</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5">{products.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 group-hover:scale-105 transition-transform">
              <Package className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">Danh mục SKU đang lưu kho</div>
        </div>

        {/* Safety Stock Alert */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-600 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Dưới Tồn An Toàn</span>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono mt-1.5">{lowStockCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-rose-700 font-bold">
            {lowStockCount > 0 ? 'Nguy cơ đứt gãy chuỗi cung ứng' : '100% SKU trên ngưỡng an toàn'}
          </div>
        </div>

        {/* Reorder Point Alert */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Cần Đặt Thêm (PO)</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono mt-1.5">{reorderCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 font-bold">
            Chạm ngưỡng điểm đặt hàng lại (ROP)
          </div>
        </div>

        {/* Total Suppliers */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block">Đối Tác Cung Ứng</span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono mt-1.5">{suppliers.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:scale-105 transition-transform">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">Nhà cung cấp đã ký hợp đồng</div>
        </div>
      </div>
    </div>
  );
};

