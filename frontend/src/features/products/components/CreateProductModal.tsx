import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  DollarSign,
  Ruler,
  Image as ImageIcon,
  Layers,
  Building2,
  Tag,
  CheckCircle2,
  Info,
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

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductItem) => void;
  suppliers: SupplierItem[];
}

const SAMPLE_IMAGES: { label: string; url: string }[] = [
  { label: 'Sữa tươi / Đồ uống', url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300&auto=format&fit=crop&q=80' },
  { label: 'Điện thoại Smartphone', url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&auto=format&fit=crop&q=80' },
  { label: 'Tai nghe AirPods', url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=300&auto=format&fit=crop&q=80' },
  { label: 'Nước giặt / Hóa phẩm', url: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300&auto=format&fit=crop&q=80' },
  { label: 'Bia / Đóng thùng', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300&auto=format&fit=crop&q=80' },
  { label: 'Cà phê hộp', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300&auto=format&fit=crop&q=80' },
];

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  suppliers,
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
  const [unit, setUnit] = useState('Thùng');
  const [weightKg, setWeightKg] = useState<number>(5);
  const [lengthCm, setLengthCm] = useState<number>(30);
  const [widthCm, setWidthCm] = useState<number>(20);
  const [heightCm, setHeightCm] = useState<number>(15);
  const [storageZone, setStorageZone] = useState<StorageZoneReq>('ZONE_A');
  const [storageCondition, setStorageCondition] = useState<StorageConditionType>('AMBIENT');
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id || '');
  
  // Inventory limits & Finance
  const [reorderPoint, setReorderPoint] = useState<number>(50);
  const [safetyStock, setSafetyStock] = useState<number>(20);
  const [maxStock, setMaxStock] = useState<number>(500);
  const [initialStock, setInitialStock] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(150000);
  const [sellingPrice, setSellingPrice] = useState<number>(195000);
  const [businessStatus, setBusinessStatus] = useState<ProductBusinessStatus>('ACTIVE');

  const activeSuppliers = suppliers.filter((supplier) => supplier.status === 'ACTIVE');

  useEffect(() => {
    if (!activeSuppliers.some((supplier) => supplier.id === supplierId)) {
      setSupplierId(activeSuppliers[0]?.id || '');
    }
  }, [suppliers, supplierId, activeSuppliers]);

  // Sync storage condition to storage zone
  useEffect(() => {
    if (storageZone === 'ZONE_B') setStorageCondition('COOL');
    else if (storageZone === 'ZONE_C') setStorageCondition('COLD');
    else if (storageZone === 'ZONE_D') setStorageCondition('SECURE');
    else setStorageCondition('AMBIENT');
  }, [storageZone]);

  const volumeCbm = useMemo(() => {
    const cbm = (lengthCm * widthCm * heightCm) / 1000000;
    return Math.round(cbm * 10000) / 10000;
  }, [lengthCm, widthCm, heightCm]);

  const profitMarginPct = useMemo(() => {
    if (sellingPrice <= 0 || purchasePrice <= 0) return 0;
    return Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100);
  }, [purchasePrice, sellingPrice]);

  if (!isOpen) return null;

  const handleAutoSku = () => {
    const prefix = category === 'ELECTRONICS' ? 'SKU-ELEC-' : category === 'CHEMICAL' ? 'SKU-CHEM-' : 'SKU-FOOD-';
    const random = Math.floor(100 + Math.random() * 900);
    setSku(prefix + random);
  };

  const handleAutoBarcode = () => {
    const randomCode = '893' + Math.floor(1000000000 + Math.random() * 9000000000);
    setBarcode(randomCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    const selectedSupplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];
    if (!selectedSupplier || selectedSupplier.status === 'INACTIVE') return;

    const newProduct: ProductItem = {
      id: 'prod_' + Date.now(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || '893' + Math.floor(1000000000 + Math.random() * 9000000000),
      name: name.trim(),
      description: description.trim(),
      category,
      unit,
      brand: brand.trim(),
      origin: origin.trim(),
      imageUrl: imageUrl.trim(),
      storageCondition,
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
      currentStock: Number(initialStock) || 0,
      storageZone,
      supplierCode: selectedSupplier?.code || 'SUP-001',
      supplierId: selectedSupplier.id,
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
      title="Thêm Mặt Hàng SKU Mới Vào Danh Mục WMS"
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
              {/* Mã SKU */}
              <InputField
                label="Mã SKU (Stock Keeping Unit)"
                required
                placeholder="VD: SKU-BEER-330"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                action={
                  <button
                    type="button"
                    onClick={handleAutoSku}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gợi ý mã SKU</span>
                  </button>
                }
              />

              {/* Mã Barcode */}
              <InputField
                label="Mã Vạch Barcode (GS1 / EAN-13)"
                placeholder="VD: 8935001234567"
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
                  placeholder="VD: Bia Heineken Sleek lon 330ml thùng 24 lon"
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
                options={activeSuppliers.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.code})`,
                }))}
              />

              {/* Thương hiệu */}
              <InputField
                label="Thương Hiệu / Hãng Sản Xuất"
                placeholder="VD: Heineken, Samsung, Vinamilk..."
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />

              {/* Xuất xứ */}
              <InputField
                label="Xuất Xứ (Quốc Gia / Vùng)"
                placeholder="VD: Việt Nam, Hà Lan, Hàn Quốc, Mỹ..."
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

              {/* Hình ảnh sản phẩm URL */}
              <div className="md:col-span-2 space-y-2">
                <InputField
                  label="URL Hình Ảnh Sản Phẩm"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  icon={<ImageIcon className="w-3.5 h-3.5 text-slate-400" />}
                />

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Chọn nhanh ảnh mẫu:</span>
                  {SAMPLE_IMAGES.map((img) => (
                    <button
                      key={img.label}
                      type="button"
                      onClick={() => setImageUrl(img.url)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors cursor-pointer"
                    >
                      {img.label}
                    </button>
                  ))}
                </div>

                {imageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200 w-fit">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100';
                      }}
                    />
                    <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xem trước ảnh hợp lệ</span>
                    </div>
                  </div>
                )}
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
                <p className="text-[11px] text-slate-500">
                  * Hệ thống WMS tự động tính thể tích CBM để kiểm soát sức chứa ô chứa hàng (Bin Volume Capacity).
                </p>
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
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeTab === 'BASIC' && 'Tiếp tục sang bước 2 để cấu hình quy cách và kích thước.'}
            {activeTab === 'LOGISTICS' && 'Tiếp tục sang bước 3 để thiết lập giá vốn và định mức tồn kho.'}
            {activeTab === 'FINANCE' && 'Sẵn sàng lưu sản phẩm mới vào Master Data.'}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" onClick={onClose}>
              Hủy bỏ
            </Button>
            {activeTab !== 'FINANCE' ? (
              <Button
                variant="primary"
                size="md"
                type="button"
                onClick={() => setActiveTab(activeTab === 'BASIC' ? 'LOGISTICS' : 'FINANCE')}
              >
                Bước Tiếp Theo &rarr;
              </Button>
            ) : (
              <Button variant="primary" size="md" type="submit" icon={<Plus className="w-4 h-4" />}>
                Thêm Vào Danh Mục
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
