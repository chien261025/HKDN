import React, { useState, useEffect } from 'react';
import { X, Save, Package, Barcode, ShieldAlert, AlertTriangle, Layers } from 'lucide-react';
import { ProductItem, ProductCategory, StorageZoneReq, SupplierItem } from '../types';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onUpdateProduct: (product: ProductItem) => void;
  suppliers: SupplierItem[];
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdateProduct,
  suppliers,
}) => {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('FOOD_BEVERAGE');
  const [unit, setUnit] = useState('Hộp');
  const [weightKg, setWeightKg] = useState<number>(1);
  const [storageZone, setStorageZone] = useState<StorageZoneReq>('ZONE_A');
  const [supplierId, setSupplierId] = useState<string>('');
  const [reorderPoint, setReorderPoint] = useState<number>(50);
  const [safetyStock, setSafetyStock] = useState<number>(20);

  useEffect(() => {
    if (product) {
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setName(product.name || '');
      setCategory(product.category || 'FOOD_BEVERAGE');
      setUnit(product.unit || 'Hộp');
      setWeightKg(product.weightKg || 1);
      setStorageZone(product.storageZone || 'ZONE_A');
      setReorderPoint(product.reorderPoint || 50);
      setSafetyStock(product.safetyStock || 20);

      const matchedSupp = suppliers.find((s) => s.code === product.supplierCode);
      if (matchedSupp) setSupplierId(matchedSupp.id);
      else if (suppliers.length > 0) setSupplierId(suppliers[0].id);
    }
  }, [product, suppliers]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedSupplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];

    const updatedProduct: ProductItem = {
      ...product,
      barcode: barcode.trim() || product.barcode,
      name: name.trim(),
      category,
      unit: unit.trim(),
      weightKg: Number(weightKg) || 1,
      reorderPoint: Number(reorderPoint) || 50,
      safetyStock: Number(safetyStock) || 20,
      storageZone,
      supplierCode: selectedSupplier?.code || product.supplierCode,
      supplierName: selectedSupplier?.name || product.supplierName,
    };

    onUpdateProduct(updatedProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Cập Nhật Thông Tin Mặt Hàng (SKU)</h2>
              <p className="text-xs text-slate-500 font-medium">Mã SKU: <span className="font-mono font-bold text-indigo-600">{sku}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mã SKU (Khóa không sửa) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã SKU (Không đổi)
              </label>
              <input
                type="text"
                disabled
                value={sku}
                className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-mono cursor-not-allowed"
              />
            </div>

            {/* Mã Barcode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã Vạch Barcode (GS1 / EAN-13)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Barcode className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>

            {/* Tên sản phẩm */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên Sản Phẩm / Hàng Hóa <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Sữa tươi tiệt trùng Vinamilk 100% 1L"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Danh mục ngành hàng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngành Hàng (Category)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="FOOD_BEVERAGE">Thực Phẩm & Đồ Uống</option>
                <option value="ELECTRONICS">Linh Kiện & Điện Tử</option>
                <option value="CHEMICAL">Hóa Mỹ Phẩm & Tẩy Rửa</option>
                <option value="PHARMACEUTICAL">Dược Phẩm & Y Tế</option>
                <option value="FASHION">Thời Trang & Dệt May</option>
              </select>
            </div>

            {/* Đơn vị tính */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Đơn Vị Tính (Unit)
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Hộp">Hộp</option>
                <option value="Chiếc">Chiếc</option>
                <option value="Túi">Túi</option>
                <option value="Thùng">Thùng</option>
                <option value="Pallet">Pallet</option>
                <option value="Chai">Chai</option>
                <option value="Kg">Kg</option>
              </select>
            </div>

            {/* Trọng lượng */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Trọng Lượng Quy Cách (kg/đơn vị)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.01"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Phân khu cất giữ */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Phân Khu Lưu Trữ Ưu Tiên</span>
              </label>
              <select
                value={storageZone}
                onChange={(e) => setStorageZone(e.target.value as StorageZoneReq)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ZONE_A">ZONE A - Kho Thường / Khô (Ambient)</option>
                <option value="ZONE_B">ZONE B - Kho Mát (Cold 2-8°C)</option>
                <option value="ZONE_C">ZONE C - Kho Đông Lạnh (-18°C)</option>
                <option value="ZONE_D">ZONE D - Hàng Giá Trị Cao (High Value)</option>
              </select>
            </div>

            {/* Điểm đặt hàng lại */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span>Điểm Đặt Hàng Lại (ROP)</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={reorderPoint}
                onChange={(e) => setReorderPoint(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Định mức tồn an toàn */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>Tồn Kho An Toàn (Safety Stock)</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={safetyStock}
                onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm shadow-indigo-200 cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
