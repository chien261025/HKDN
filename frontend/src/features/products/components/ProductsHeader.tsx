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
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100 flex-shrink-0">
            {activeTab === 'PRODUCTS' ? <Package className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Danh Mục Sản Phẩm & Nhà Cung Cấp
              </h1>
              <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 font-bold">
                MASTER DATA
              </span>
            </div>
            <p className="text-sm text-slate-600 font-medium mt-1">
              Định mức an toàn (Safety Stock) • Điểm đặt hàng lại (Reorder Point) • Mã vạch Barcode chuẩn GS1
            </p>
          </div>
        </div>

        {/* Tab switchers & Create button */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'PRODUCTS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Sản Phẩm ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Nhà Cung Cấp ({suppliers.length})</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all active:scale-95 flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>{activeTab === 'PRODUCTS' ? 'Thêm SKU Mới' : 'Thêm Nhà Cung Cấp'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKU */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase">Tổng Số Mặt Hàng</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{products.length} SKU</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Safety Stock Alert */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-700 uppercase">Dưới Tồn An Toàn</div>
            <div className="text-2xl font-black text-rose-700 font-mono mt-1">{lowStockCount} SKU</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Reorder Point Alert */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase">Cần Đặt Thêm (PO)</div>
            <div className="text-2xl font-black text-amber-700 font-mono mt-1">{reorderCount} SKU</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Total Suppliers */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-indigo-700 uppercase">Đối Tác Cung Ứng</div>
            <div className="text-2xl font-black text-indigo-700 font-mono mt-1">{suppliers.length} NCC</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};

