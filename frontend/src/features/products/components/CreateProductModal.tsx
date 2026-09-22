import React, { useState } from 'react';
import { Plus, Package, Barcode, ShieldAlert, AlertTriangle, Layers, Sparkles } from 'lucide-react';
import { ProductItem, ProductCategory, StorageZoneReq, SupplierItem } from '../types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Mặt Hàng SKU Mới Vào Danh Mục"
      description="Khởi tạo Master Data hàng hóa, định mức an toàn và barcode"
      icon={<Package className="w-5 h-5" />}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mã SKU */}
          <InputField
            label="Mã SKU"
            required
            placeholder="VD: SKU-DRK-010"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />

          {/* Mã Barcode */}
          <InputField
            label="Mã Vạch Barcode (GS1/EAN-13)"
            placeholder="VD: 8935001234567"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            action={
              <button
                type="button"
                onClick={handleAutoBarcode}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Sinh mã ngẫu nhiên</span>
              </button>
            }
          />

          {/* Tên sản phẩm */}
          <div className="md:col-span-2">
            <InputField
              label="Tên Hàng Hóa / Sản Phẩm"
              required
              placeholder="VD: Nước Ép Cam Tươi Vfresh 1L"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Ngành hàng */}
          <SelectField
            label="Ngành Hàng (Category)"
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            options={[
              { value: 'FOOD_BEVERAGE', label: 'Thực Phẩm & Đồ Uống' },
              { value: 'ELECTRONICS', label: 'Linh Kiện & Điện Tử' },
              { value: 'CHEMICAL', label: 'Hóa Mỹ Phẩm & Tẩy Rửa' },
              { value: 'PHARMACEUTICAL', label: 'Dược Phẩm & Y Tế' },
              { value: 'FASHION', label: 'Thời Trang & Dệt May' },
            ]}
          />

          {/* Đơn vị tính */}
          <SelectField
            label="Đơn Vị Tính (Unit)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={[
              { value: 'Thùng', label: 'Thùng' },
              { value: 'Hộp', label: 'Hộp' },
              { value: 'Chai', label: 'Chai' },
              { value: 'Gói', label: 'Gói' },
              { value: 'Chiếc', label: 'Chiếc' },
              { value: 'Pallet', label: 'Pallet' },
            ]}
          />

          {/* Trọng lượng */}
          <InputField
            label="Trọng Lượng Quy Cách (kg/đơn vị)"
            type="number"
            step="0.1"
            min="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
          />

          {/* Phân khu cất giữ */}
          <SelectField
            label="Phân Khu Lưu Trữ Ưu Tiên"
            value={storageZone}
            onChange={(e) => setStorageZone(e.target.value as StorageZoneReq)}
            options={[
              { value: 'ZONE_A', label: 'ZONE A - Kho Thường / Khô (Ambient)' },
              { value: 'ZONE_B', label: 'ZONE B - Kho Mát (Cold 2-8°C)' },
              { value: 'ZONE_C', label: 'ZONE C - Kho Đông Lạnh (-18°C)' },
              { value: 'ZONE_D', label: 'ZONE D - Hàng Giá Trị Cao (High Value)' },
            ]}
          />

          {/* Nhà cung cấp */}
          <div className="md:col-span-2">
            <SelectField
              label="Nhà Cung Cấp Mặc Định"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={suppliers.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.code})`,
              }))}
            />
          </div>

          {/* Điểm đặt hàng lại */}
          <InputField
            label="Điểm Đặt Hàng Lại (ROP)"
            type="number"
            min="1"
            value={reorderPoint}
            onChange={(e) => setReorderPoint(parseInt(e.target.value) || 0)}
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          />

          {/* Định mức tồn an toàn */}
          <InputField
            label="Tồn Kho An Toàn (Safety Stock)"
            type="number"
            min="0"
            value={safetyStock}
            onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
            icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button variant="outline" size="md" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button variant="primary" size="md" type="submit" icon={<Plus className="w-4 h-4" />}>
            Thêm Vào Danh Mục
          </Button>
        </div>
      </form>
    </Modal>
  );
};
