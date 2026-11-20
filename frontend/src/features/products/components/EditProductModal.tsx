import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Package,
  Barcode,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  Tag,
  Ruler,
  DollarSign,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  ProductItem,
  ProductCategory,
  StorageZoneReq,
  SupplierItem,
  StorageConditionType,
  ProductBusinessStatus,
} from '../types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';
import { ProductImageUploader } from './ProductImageUploader';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onUpdateProduct: (product: ProductItem) => void;
  suppliers: SupplierItem[];
  onDeleteProduct: (product: ProductItem) => void;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdateProduct,
  suppliers,
  onDeleteProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'BASIC' | 'LOGISTICS' | 'FINANCE'>('BASIC');

  // Basic info
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('FOOD_BEVERAGE');
  const [brand, setBrand] = useState('');
  const [origin, setOrigin] = useState('Việt Nam');
  const [imageUrl, setImageUrl] = useState('');

  // Logistics & dimensions
  const [unit, setUnit] = useState('Hộp');
  const [weightKg, setWeightKg] = useState<number>(1);
  const [lengthCm, setLengthCm] = useState<number>(20);
  const [widthCm, setWidthCm] = useState<number>(15);
  const [heightCm, setHeightCm] = useState<number>(10);
  const [storageZone, setStorageZone] = useState<StorageZoneReq>('ZONE_A');
  const [storageCondition, setStorageCondition] = useState<StorageConditionType>('AMBIENT');
  const [supplierId, setSupplierId] = useState<string>('');

  // Inventory limits & Finance
  const [reorderPoint, setReorderPoint] = useState<number>(50);
  const [safetyStock, setSafetyStock] = useState<number>(20);
  const [maxStock, setMaxStock] = useState<number>(500);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [businessStatus, setBusinessStatus] = useState<ProductBusinessStatus>('ACTIVE');
  const [status, setStatus] = useState<ProductItem['status']>('ACTIVE');

  useEffect(() => {
    if (product) {
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setName(product.name || '');
      setDescription(product.description || '');
      setCategory(product.category || 'FOOD_BEVERAGE');
      setBrand(product.brand || '');
      setOrigin(product.origin || 'Việt Nam');
      setImageUrl(product.imageUrl || '');
      setUnit(product.unit || 'Hộp');
      setWeightKg(product.weightKg || 1);
      setLengthCm(product.lengthCm || 20);
      setWidthCm(product.widthCm || 15);
      setHeightCm(product.heightCm || 10);
      setStorageZone(product.storageZone || 'ZONE_A');
      setStorageCondition(product.storageCondition || 'AMBIENT');
      setReorderPoint(product.reorderPoint || 50);
      setSafetyStock(product.safetyStock || 20);
      setMaxStock(product.maxStock || 500);
      setPurchasePrice(product.purchasePrice || 0);
      setSellingPrice(product.sellingPrice || 0);
      setBusinessStatus(product.businessStatus || 'ACTIVE');
      setStatus(product.status || 'ACTIVE');

      const matchedSupp = suppliers.find((s) => s.code === product.supplierCode);
      if (product.supplierId) setSupplierId(product.supplierId);
      else if (matchedSupp) setSupplierId(matchedSupp.id);
      else if (suppliers.length > 0) setSupplierId(suppliers[0].id);
    }
  }, [product, suppliers]);

  const volumeCbm = useMemo(() => {
    const cbm = (lengthCm * widthCm * heightCm) / 1000000;
    return Math.round(cbm * 10000) / 10000;
  }, [lengthCm, widthCm, heightCm]);

  const profitMarginPct = useMemo(() => {
    if (sellingPrice <= 0 || purchasePrice <= 0) return 0;
    return Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100);
  }, [purchasePrice, sellingPrice]);

  if (!isOpen || !product) return null;

  const handleAutoBarcode = () => {
    const randomCode = '893' + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(randomCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedSupplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];

    const updatedProduct: ProductItem = {
      ...product,
      barcode: barcode.trim() || product.barcode,
      name: name.trim(),
      description: description.trim(),
      category,
      brand: brand.trim(),
      origin: origin.trim(),
      imageUrl: imageUrl.trim(),
      unit: unit.trim(),
      weightKg: Number(weightKg) || 1,
      lengthCm: Number(lengthCm) || 20,
      widthCm: Number(widthCm) || 15,
      heightCm: Number(heightCm) || 10,
      volumeCbm,
      reorderPoint: Number(reorderPoint) || 50,
      safetyStock: Number(safetyStock) || 20,
      maxStock: Number(maxStock) || 500,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      businessStatus,
      storageZone,
      storageCondition,
      supplierCode: selectedSupplier?.code || product.supplierCode,
      supplierId: selectedSupplier?.id || product.supplierId,
      supplierName: selectedSupplier?.name || product.supplierName,
      status,
    };

    onUpdateProduct(updatedProduct);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cập Nhật Hồ Sơ Kỹ Thuật Mặt Hàng (SKU)"
      description={
        <span>
          Mã SKU: <strong className="font-mono text-blue-600 font-bold">{sku}</strong>
        </span>
      }
      icon={<Package className="w-5 h-5" />}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('BASIC')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BASIC'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>1. Định Danh & Thuộc Tính</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LOGISTICS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LOGISTICS'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>2. Quy Cách, Trọng Lượng & Kệ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FINANCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'FINANCE'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Giá Tiền, Tồn Kho & Trạng Thái</span>
          </button>
        </div>

        {/* TAB 1: BASIC INFO */}
        {activeTab === 'BASIC' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mã SKU (Khóa) */}
              <InputField
                label="Mã SKU (Khóa định danh duy nhất)"
                value={sku}
                disabled
                helperText="Mã SKU do hệ thống quản trị, không thể sửa sau khi khởi tạo"
              />

              {/* Mã Barcode */}
              <InputField
                label="Mã Vạch Barcode (GS1 / EAN-13)"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                action={
                  <button
                    type="button"
                    onClick={handleAutoBarcode}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Sinh mã chuẩn 893</span>
                  </button>
                }
              />

              {/* Tên sản phẩm */}
              <div className="md:col-span-2">
                <InputField
                  label="Tên Hàng Hóa / Sản Phẩm"
                  required
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
                  { value: 'FOOD_BEVERAGE', label: 'Thực Phẩm & Đồ Uống (F&B)' },
                  { value: 'ELECTRONICS', label: 'Thiết Bị & Linh Kiện Điện Tử' },
                  { value: 'CHEMICAL', label: 'Hóa Mỹ Phẩm & Tẩy Rửa' },
                  { value: 'PHARMACEUTICAL', label: 'Dược Phẩm & Y Tế' },
                  { value: 'FASHION', label: 'Thời Trang & Dệt May' },
                  { value: 'GENERAL', label: 'Hàng Tiêu Dùng Tổng Hợp' },
                ]}
              />

              {/* Nhà cung cấp */}
              <SelectField
                label="Nhà Cung Cấp Mặc Định"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                options={suppliers.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.code})`,
                }))}
              />

              {/* Thương hiệu */}
              <InputField
                label="Thương Hiệu / Hãng Sản Xuất"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />

              {/* Xuất xứ */}
              <InputField
                label="Xuất Xứ (Quốc Gia / Vùng)"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />

              {/* Mô tả sản phẩm */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô Tả Quy Cách Chi Tiết
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi chú chi tiết về thành phần, bao bì đóng gói, hướng dẫn bốc xếp..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Hình ảnh sản phẩm */}
              <div className="md:col-span-2">
                <ProductImageUploader
                  value={imageUrl}
                  onChange={setImageUrl}
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LOGISTICS, DIMENSIONS & ZONE */}
        {activeTab === 'LOGISTICS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Đơn vị tính */}
              <SelectField
                label="Đơn Vị Tính (Unit)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                options={[
                  { value: 'Thùng', label: 'Thùng (Carton / Box)' },
                  { value: 'Hộp', label: 'Hộp (Inner Box)' },
                  { value: 'Chai', label: 'Chai (Bottle)' },
                  { value: 'Lon', label: 'Lon (Can)' },
                  { value: 'Gói', label: 'Gói (Pack)' },
                  { value: 'Túi', label: 'Túi (Pouch)' },
                  { value: 'Lốc', label: 'Lốc (Multipack)' },
                  { value: 'Chiếc', label: 'Chiếc / Cái (Piece)' },
                  { value: 'Pallet', label: 'Pallet' },
                  { value: 'Bao', label: 'Bao (Bag 25-50kg)' },
                  { value: 'Cuộn', label: 'Cuộn (Roll)' },
                ]}
              />

              {/* Trọng lượng */}
              <InputField
                label="Trọng Lượng Quy Cách (kg/đơn vị)"
                type="number"
                step="0.01"
                min="0.01"
                value={weightKg}
                onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0)}
              />

              {/* Kích thước Dài x Rộng x Cao */}
              <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-blue-600" />
                    Kích Thước Bao Bì (Dài x Rộng x Cao cm)
                  </span>
                  <span className="text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Thể Tích: <strong>{volumeCbm} m³ (CBM)</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <InputField
                    label="Chiều Dài (cm)"
                    type="number"
                    step="0.1"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(parseFloat(e.target.value) || 0)}
                  />
                  <InputField
                    label="Chiều Rộng (cm)"
                    type="number"
                    step="0.1"
                    value={widthCm}
                    onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)}
                  />
                  <InputField
                    label="Chiều Cao (cm)"
                    type="number"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Phân khu lưu trữ ưu tiên */}
              <SelectField
                label="Phân Khu Lưu Trữ Ưu Tiên (Zone)"
                value={storageZone}
                onChange={(e) => setStorageZone(e.target.value as StorageZoneReq)}
                options={[
                  { value: 'ZONE_A', label: 'ZONE A - Hàng Khô & Tiêu Dùng (Ambient Dry)' },
                  { value: 'ZONE_B', label: 'ZONE B - Kho Mát & Thực Phẩm (Cold Storage 2-8°C)' },
                  { value: 'ZONE_C', label: 'ZONE C - Kho Đông Lạnh Sâu (-18°C Frozen)' },
                  { value: 'ZONE_D', label: 'ZONE D - Hàng Giá Trị Cao & Điện Tử (Secure High-Value)' },
                ]}
              />

              {/* Điều kiện nhiệt độ */}
              <SelectField
                label="Điều Kiện Bảo Quản Yêu Cầu"
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value as StorageConditionType)}
                options={[
                  { value: 'AMBIENT', label: 'Nhiệt độ phòng (18-25°C)' },
                  { value: 'COOL', label: 'Kho mát (2-8°C)' },
                  { value: 'COLD', label: 'Đông lạnh (-18°C)' },
                  { value: 'SECURE', label: 'Kho khóa bảo mật giá trị cao' },
                ]}
              />
            </div>
          </div>
        )}

        {/* TAB 3: FINANCE, INVENTORY LIMITS & STATUS */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Giá Nhập (Cost Price) */}
              <InputField
                label="Giá Vốn / Giá Nhập Chuẩn (VNĐ)"
                type="number"
                step="1000"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
              />

              {/* Giá Bán / Xuất (Selling Price) */}
              <InputField
                label="Giá Bán / Giá Xuất Đề Xuất (VNĐ)"
                type="number"
                step="1000"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                icon={<DollarSign className="w-3.5 h-3.5 text-blue-600" />}
              />

              <div className="md:col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-mono">
                <span>Chênh lệch giá xuất / nhập: <b>{(sellingPrice - purchasePrice).toLocaleString()} ₫</b></span>
                <span>Tỷ suất lợi nhuận biên: <b>{profitMarginPct}%</b></span>
              </div>

              {/* Định mức tồn an toàn (Safety Stock) */}
              <InputField
                label="Tồn Kho Tối Thiểu / An Toàn (Safety Stock)"
                type="number"
                min="0"
                value={safetyStock}
                onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
              />

              {/* Điểm đặt hàng lại (ROP) */}
              <InputField
                label="Điểm Đặt Hàng Lại (ROP - Reorder Point)"
                type="number"
                min="1"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(parseInt(e.target.value) || 0)}
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              />

              {/* Tồn tối đa (Max Stock) */}
              <InputField
                label="Tồn Kho Tối Đa (Max Capacity Level)"
                type="number"
                min="10"
                value={maxStock}
                onChange={(e) => setMaxStock(parseInt(e.target.value) || 0)}
                icon={<Layers className="w-3.5 h-3.5 text-indigo-500" />}
              />

              {/* Trạng thái kinh doanh */}
              <SelectField
                label="Trạng Thái Kinh Doanh (Product Lifecycle)"
                value={businessStatus}
                onChange={(e) => setBusinessStatus(e.target.value as ProductBusinessStatus)}
                options={[
                  { value: 'ACTIVE', label: 'ACTIVE - Đang kinh doanh & nhập xuất bình thường' },
                  { value: 'SUSPENDED', label: 'SUSPENDED - Tạm ngưng nhập hàng mới' },
                  { value: 'DISCONTINUED', label: 'DISCONTINUED - Ngừng kinh doanh (Xả hết tồn kho)' },
                ]}
              />

              {/* Trạng thái hoạt động hệ thống */}
              <SelectField
                label="Trạng Thái Hệ Thống"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductItem['status'])}
                options={[
                  { value: 'ACTIVE', label: 'Kích hoạt hoạt động' },
                  { value: 'INACTIVE', label: 'Vô hiệu hóa (Tắt hiển thị)' },
                ]}
              />
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Button
            type="button"
            variant="danger"
            size="md"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => {
              if (window.confirm(`Bạn có chắc chắn muốn xóa mặt hàng ${product.sku} khỏi danh mục?`)) {
                onDeleteProduct(product);
                onClose();
              }
            }}
          >
            Xóa Sản Phẩm
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button variant="primary" size="md" type="submit" icon={<Save className="w-4 h-4" />}>
              Lưu Thay Đổi
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
