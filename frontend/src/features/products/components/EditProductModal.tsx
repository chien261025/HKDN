import React, { useState, useEffect } from 'react';
import { Save, Package, Barcode, ShieldAlert, AlertTriangle, Layers } from 'lucide-react';
import { ProductItem, ProductCategory, StorageZoneReq, SupplierItem } from '../types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cập Nhật Thông Tin Mặt Hàng (SKU)"
      description={
        <span>
          Mã SKU: <strong className="font-mono text-indigo-600 font-bold">{sku}</strong>
        </span>
      }
      icon={<Package className="w-5 h-5" />}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mã SKU (Khóa) */}
          <InputField
            label="Mã SKU (Không đổi)"
            value={sku}
            disabled
          />

          {/* Mã Barcode */}
          <InputField
            label="Mã Vạch Barcode (GS1 / EAN-13)"
            required
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            iconRight={<Barcode className="w-4 h-4" />}
          />

          {/* Tên sản phẩm */}
          <div className="md:col-span-2">
            <InputField
              label="Tên Sản Phẩm / Hàng Hóa"
              required
              placeholder="VD: Sữa tươi tiệt trùng Vinamilk 100% 1L"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Danh mục ngành hàng */}
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
              { value: 'Hộp', label: 'Hộp' },
              { value: 'Chiếc', label: 'Chiếc' },
              { value: 'Túi', label: 'Túi' },
              { value: 'Thùng', label: 'Thùng' },
              { value: 'Pallet', label: 'Pallet' },
              { value: 'Chai', label: 'Chai' },
              { value: 'Kg', label: 'Kg' },
            ]}
          />

          {/* Trọng lượng */}
          <InputField
            label="Trọng Lượng Quy Cách (kg/đơn vị)"
            type="number"
            step="0.05"
            min="0.01"
            required
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

          {/* Điểm đặt hàng lại */}
          <InputField
            label="Điểm Đặt Hàng Lại (ROP)"
            type="number"
            min="1"
            required
            value={reorderPoint}
            onChange={(e) => setReorderPoint(parseInt(e.target.value) || 0)}
            icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
          />

          {/* Định mức tồn an toàn */}
          <InputField
            label="Tồn Kho An Toàn (Safety Stock)"
            type="number"
            min="0"
            required
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
          <Button variant="primary" size="md" type="submit" icon={<Save className="w-4 h-4" />}>
            Lưu Thay Đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
};
