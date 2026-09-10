import React from 'react';
import { Package, Building2, AlertTriangle, CheckCircle2, Plus, Barcode, ShieldAlert } from 'lucide-react';
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
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 flex-shrink-0 ring-1 ring-white/20">
            {activeTab === 'PRODUCTS' ? <Package className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
                Danh Mục Sản Phẩm & Nhà Cung Cấp
              </h1>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold">
                MASTER DATA
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Định mức an toàn (Safety Stock) • Điểm đặt hàng lại (Reorder Point) • Mã vạch Barcode chuẩn GS1
            </p>
          </div>
        </div>

        {/* Tab switchers & Create button */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('PRODUCTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'PRODUCTS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Sản Phẩm ({products.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'SUPPLIERS'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Nhà Cung Cấp ({suppliers.length})</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === 'PRODUCTS' ? 'Thêm SKU Mới' : 'Thêm Nhà Cung Cấp'}</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total SKU */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tổng Số Mặt Hàng</div>
            <div className="text-lg font-extrabold text-white font-mono mt-0.5">{products.length} SKU</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Safety Stock Alert */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-rose-400 uppercase">Dưới Tồn An Toàn</div>
            <div className="text-lg font-extrabold text-rose-300 font-mono mt-0.5">{lowStockCount} SKU</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* Reorder Point Alert */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-amber-400 uppercase">Cần Đặt Thêm (PO)</div>
            <div className="text-lg font-extrabold text-amber-300 font-mono mt-0.5">{reorderCount} SKU</div>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Total Suppliers */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase">Đối Tác Cung Ứng</div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono mt-0.5">{suppliers.length} NCC</div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
