import React, { useState } from 'react';
import { X, Plus, Package, Barcode, ShieldAlert, AlertTriangle, Layers } from 'lucide-react';
import { ProductItem, ProductCategory, StorageZoneReq, SupplierItem } from '../types';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductItem) => void;
  suppliers: SupplierItem[];
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  suppliers,
}) => {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('FOOD_BEVERAGE');
  const [unit, setUnit] = useState('Thùng');
  const [weightKg, setWeightKg] = useState<number>(5);
  const [storageZone, setStorageZone] = useState<StorageZoneReq>('ZONE_A');
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  const [reorderPoint, setReorderPoint] = useState<number>(50);
  const [safetyStock, setSafetyStock] = useState<number>(20);
  const [initialStock, setInitialStock] = useState<number>(100);

  if (!isOpen) return null;

  const handleAutoBarcode = () => {
    const randomCode = '893' + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(randomCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    const selectedSupplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];

    const newProduct: ProductItem = {
      id: 'prod_' + Date.now(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || '893' + Math.floor(1000000000 + Math.random() * 9000000000),
      name: name.trim(),
      category,
      unit,
      weightKg: Number(weightKg) || 1,
      reorderPoint: Number(reorderPoint) || 50,
      safetyStock: Number(safetyStock) || 20,
      currentStock: Number(initialStock) || 0,
      storageZone,
      supplierCode: selectedSupplier?.code || 'SUP-001',
      supplierName: selectedSupplier?.name || 'Nhà Cung Cấp Mặc Định',
      status: 'ACTIVE',
    };

    onAddProduct(newProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Thêm Mặt Hàng SKU Mới Vào Danh Mục</h2>
              <p className="text-xs text-slate-400 mt-0.5">Khởi tạo Master Data hàng hóa, định mức an toàn và barcode</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SKU */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Mã SKU <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: SKU-DRK-010"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Barcode */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Mã Vạch Barcode (GS1/EAN-13)</label>
                <button
                  type="button"
                  onClick={handleAutoBarcode}
                  className="text-[10px] text-cyan-400 hover:underline font-mono"
                >
                  + Tự động sinh mã
                </button>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="VD: 8935001234567"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Tên Sản Phẩm <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Sữa Tươi Tiệt Trùng Nguyên Chất 1L"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ngành Hàng</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="FOOD_BEVERAGE">Thực Phẩm & Đồ Uống</option>
                <option value="CHEMICAL">Hóa Chất / Dung Môi</option>
                <option value="ELECTRONICS">Linh Kiện Điện Tử</option>
                <option value="PHARMA">Dược Phẩm Y Tế</option>
                <option value="GENERAL">Hàng Tổng Hợp</option>
              </select>
            </div>

            {/* Storage Zone */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vùng Lưu Trữ</label>
              <select
                value={storageZone}
                onChange={(e) => setStorageZone(e.target.value as StorageZoneReq)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
              >
                <option value="ZONE_A">ZONE_A (Kho Khô / Thường)</option>
                <option value="ZONE_B">ZONE_B (Kho Mát 2-8°C)</option>
              </select>
            </div>

            {/* Unit */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Đơn Vị Tính (ĐVT)</label>
              <input
                type="text"
                placeholder="Thùng, Hộp, Chai, Bao..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Weight */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Trọng Lượng Đơn Vị (Kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Nhà Cung Cấp Đối Tác</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Metrics Row */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <div className="text-slate-400 font-mono text-[11px] font-bold uppercase">
              Thiết Lập Định Mức Tồn Kho & Cảnh Báo An Toàn
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-rose-400 font-semibold text-[11px] mb-1">
                  Tồn An Toàn (Safety Stock)
                </label>
                <input
                  type="number"
                  min="0"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-rose-500/30 rounded-lg text-rose-300 font-mono focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-amber-400 font-semibold text-[11px] mb-1">
                  Điểm Đặt Lại (Reorder Point)
                </label>
                <input
                  type="number"
                  min="0"
                  value={reorderPoint}
                  onChange={(e) => setReorderPoint(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-amber-500/30 rounded-lg text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-indigo-300 font-semibold text-[11px] mb-1">
                  Tồn Đầu Kỳ Khởi Tạo
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-900/40 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Lưu Vào Danh Mục</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
