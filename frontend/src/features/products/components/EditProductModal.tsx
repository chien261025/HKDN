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
  ProductTrackingMethod,
} from '../types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';
import { ProductImageUploader } from './ProductImageUploader';
import { generateInternalEan13 } from '../utils/barcodeUtils';

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

  // Master Data Policies: Phương thức định danh, Lô, Hạn Sử Dụng & Xuất Kho
  const [trackingMethod, setTrackingMethod] = useState<ProductTrackingMethod>('FEFO_BATCH');
  const [isBatchManaged, setIsBatchManaged] = useState<boolean>(true);
  const [isExpiryManaged, setIsExpiryManaged] = useState<boolean>(true);
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(45);
  const [outboundStrategy, setOutboundStrategy] = useState<'FEFO' | 'FIFO' | 'LIFO'>('FEFO');

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

      setTrackingMethod(
        product.trackingMethod ||
          (product.category === 'ELECTRONICS'
            ? 'SERIAL_IMEI'
            : product.isBatchManaged !== false
            ? 'FEFO_BATCH'
            : 'STANDARD')
      );
      setIsBatchManaged(product.isBatchManaged !== false);
      setIsExpiryManaged(product.isExpiryManaged !== false);
      setShelfLifeDays(product.shelfLifeDays || (product.category === 'FOOD_BEVERAGE' ? 45 : 365));
      setOutboundStrategy(product.outboundStrategy || (product.category === 'FOOD_BEVERAGE' ? 'FEFO' : 'FIFO'));

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
    const validEan13 = generateInternalEan13();
    setBarcode(validEan13);
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
      trackingMethod,
      isBatchManaged,
      isExpiryManaged,
      shelfLifeDays: isExpiryManaged ? Number(shelfLifeDays) || 30 : 0,
      outboundStrategy,
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
            <span>Thông Tin Cơ Bản</span>
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
            <span>Quy Cách & Lưu Kho</span>
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
            <span>Giá Tiền & Tồn Kho</span>
          </button>
        </div>

        {/* TAB 1: BASIC INFO */}
        {activeTab === 'BASIC' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mã SKU (Khóa) */}
              <InputField
                label="Mã Sản Phẩm (Mã SKU)"
                value={sku}
                disabled
                helperText="Mã sản phẩm cố định, không thể chỉnh sửa."
              />

              {/* Mã Barcode */}
              <InputField
                label="Mã Vạch (Barcode)"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                helperText="* Mã vạch dùng để máy quét PDA nhận diện nhanh khi nhập xuất kho."
                action={
                  <button
                    type="button"
                    onClick={handleAutoBarcode}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Tạo mã vạch ngẫu nhiên"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tạo mã vạch ngẫu nhiên</span>
                  </button>
                }
              />

              {/* Tên sản phẩm */}
              <div className="md:col-span-2">
                <InputField
                  label="Tên Sản Phẩm"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Ngành hàng */}
              <SelectField
                label="Ngành Hàng"
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
                label="Đơn Vị Tính"
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
                  { value: 'Chiếc', label: 'Chiếc / Cái' },
                  { value: 'Pallet', label: 'Pallet' },
                  { value: 'Bao', label: 'Bao (25-50kg)' },
                  { value: 'Cuộn', label: 'Cuộn' },
                ]}
              />

              {/* Trọng lượng */}
              <InputField
                label="Trọng Lượng (kg/đơn vị)"
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

              {/* Chế độ định danh & Quản lý tồn kho (Tracking Method) */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Phương Thức Quản Lý & Định Danh (Tracking Method)</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    * Quyết định quy trình quét mã PDA & kiểm soát lô tại Dock Nhập/Xuất
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: FEFO_BATCH */}
                  <div
                    onClick={() => {
                      setTrackingMethod('FEFO_BATCH');
                      setIsBatchManaged(true);
                      setIsExpiryManaged(true);
                      setOutboundStrategy('FEFO');
                      if (shelfLifeDays <= 0) setShelfLifeDays(45);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      trackingMethod === 'FEFO_BATCH'
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-indigo-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        FEFO & Quản Lý Lô
                      </span>
                      {trackingMethod === 'FEFO_BATCH' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Bắt buộc số Lô (Batch) & Hạn dùng (EXP). Tự động xuất hàng cận hạn trước.
                    </p>
                    <span className="mt-2 text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded w-fit">
                      F&B / Dược phẩm / Mỹ phẩm
                    </span>
                  </div>

                  {/* Option 2: SERIAL_IMEI */}
                  <div
                    onClick={() => {
                      setTrackingMethod('SERIAL_IMEI');
                      setIsBatchManaged(false);
                      setIsExpiryManaged(false);
                      setOutboundStrategy('FIFO');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      trackingMethod === 'SERIAL_IMEI'
                        ? 'border-cyan-600 bg-cyan-50/70 ring-2 ring-cyan-500/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-cyan-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-600" />
                        Serial / IMEI Đơn Chiếc
                      </span>
                      {trackingMethod === 'SERIAL_IMEI' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Mỗi đơn vị có 1 Serial/IMEI độc nhất. Quét đối soát từng máy khi Pick & Pack.
                    </p>
                    <span className="mt-2 text-[10px] font-semibold text-cyan-700 bg-cyan-100/70 px-1.5 py-0.5 rounded w-fit">
                      Điện máy / Thiết bị / Phone
                    </span>
                  </div>

                  {/* Option 3: STANDARD */}
                  <div
                    onClick={() => {
                      setTrackingMethod('STANDARD');
                      setIsBatchManaged(false);
                      setIsExpiryManaged(false);
                      setOutboundStrategy('FIFO');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      trackingMethod === 'STANDARD'
                        ? 'border-slate-700 bg-slate-100 ring-2 ring-slate-400/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-600" />
                        Hàng Tiêu Chuẩn (FIFO)
                      </span>
                      {trackingMethod === 'STANDARD' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-800" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Theo dõi số lượng tồn kho thuần túy. Xuất kho theo thứ tự ngày nhập.
                    </p>
                    <span className="mt-2 text-[10px] font-semibold text-slate-700 bg-slate-200/70 px-1.5 py-0.5 rounded w-fit">
                      Vật tư / Gia dụng / Phụ kiện
                    </span>
                  </div>
                </div>
              </div>

              {/* Chính Sách Chi Tiết Theo Tracking Method */}
              {trackingMethod === 'FEFO_BATCH' && (
                <div className="md:col-span-2 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-indigo-900">
                      <ShieldAlert className="w-4 h-4 text-indigo-600" />
                      Chính Sách Quản Lý Lô (Batch) & Hạn Sử Dụng (FEFO)
                    </span>
                    <span className="text-[11px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full font-semibold">
                      FEFO Rules
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        id="edit-is-batch-managed"
                        type="checkbox"
                        checked={isBatchManaged}
                        onChange={(e) => setIsBatchManaged(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="edit-is-batch-managed" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Bắt buộc theo dõi theo Lô (Batch/Lot Number)
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="edit-is-expiry-managed"
                        type="checkbox"
                        checked={isExpiryManaged}
                        onChange={(e) => setIsExpiryManaged(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="edit-is-expiry-managed" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Theo dõi Ngày sản xuất & Hạn sử dụng (Shelf Life)
                      </label>
                    </div>

                    {isExpiryManaged && (
                      <InputField
                        label="Hạn Sử Dụng Tiêu Chuẩn (Số Ngày)"
                        type="number"
                        min="1"
                        value={shelfLifeDays}
                        onChange={(e) => setShelfLifeDays(parseInt(e.target.value, 10) || 0)}
                        helperText="VD: 45 ngày (sữa chua), 180 ngày (sữa tươi), 365 ngày (lon)"
                      />
                    )}

                    <SelectField
                      label="Chiến Lược Xuất Kho Tự Động"
                      value={outboundStrategy}
                      onChange={(e) => setOutboundStrategy(e.target.value as any)}
                      options={[
                        { value: 'FEFO', label: 'FEFO - Hết hạn trước xuất trước (Chuẩn F&B / Dược phẩm)' },
                        { value: 'FIFO', label: 'FIFO - Nhập trước xuất trước' },
                        { value: 'LIFO', label: 'LIFO - Nhập sau xuất trước' },
                      ]}
                    />
                  </div>
                </div>
              )}

              {trackingMethod === 'SERIAL_IMEI' && (
                <div className="md:col-span-2 bg-cyan-50/70 p-3.5 rounded-xl border border-cyan-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-cyan-950">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-600" />
                      Quản Lý Theo Mã Serial / IMEI Từng Chiếc
                    </span>
                    <span className="text-[11px] text-cyan-700 bg-cyan-100 px-2 py-0.5 rounded-full font-semibold">
                      Thiết Bị Điện Tử & Máy Móc
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dành cho sản phẩm công nghệ, máy móc. Khi nhập hoặc xuất kho, nhân viên sẽ dùng máy PDA quét từng mã Serial/IMEI để theo dõi bảo hành và nguồn gốc.
                  </p>
                  <div className="flex items-center gap-6 pt-1 text-xs text-slate-700 font-medium">
                    <div>Thứ tự xuất: <strong className="text-cyan-800">Nhập trước xuất trước (FIFO)</strong></div>
                    <div>Thao tác quét: <strong className="text-cyan-800">Quét mã khi Nhập & Xuất kho</strong></div>
                  </div>
                </div>
              )}

              {trackingMethod === 'STANDARD' && (
                <div className="md:col-span-2 bg-slate-100/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-slate-600" />
                      Quản Lý Theo Số Lượng Tiêu Chuẩn
                    </span>
                    <span className="text-[11px] text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full font-semibold">
                      Số Lượng Thông Thường
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sản phẩm được theo dõi số lượng tồn kho theo từng vị trí ô kệ. Xuất kho tự động theo thứ tự nhập trước xuất trước (FIFO), phù hợp cho hàng gia dụng, phụ kiện.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FINANCE, INVENTORY LIMITS & STATUS */}
        {activeTab === 'FINANCE' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Giá Nhập Chuẩn */}
              <InputField
                label="Giá Nhập Tham Khảo (VNĐ)"
                type="number"
                step="1000"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                helperText="* Giá mua thực tế sẽ được ghi nhận theo từng hóa đơn nhập kho."
                icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
              />

              {/* Giá Bán */}
              <InputField
                label="Giá Bán Đề Xuất (VNĐ)"
                type="number"
                step="1000"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                icon={<DollarSign className="w-3.5 h-3.5 text-blue-600" />}
              />

              <div className="md:col-span-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between font-mono">
                <span>Chênh lệch dự kiến: <b>{(sellingPrice - purchasePrice).toLocaleString()} ₫</b></span>
                <span>Tỷ suất lợi nhuận: <b>{profitMarginPct}%</b></span>
              </div>

              {/* Định mức tồn an toàn */}
              <InputField
                label="Tồn Kho Tối Thiểu (Cảnh báo)"
                type="number"
                min="0"
                value={safetyStock}
                onChange={(e) => setSafetyStock(parseInt(e.target.value) || 0)}
                icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
              />

              {/* Điểm đặt hàng lại */}
              <InputField
                label="Ngưỡng Cần Nhập Thêm (Đặt hàng)"
                type="number"
                min="1"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(parseInt(e.target.value) || 0)}
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              />

              {/* Tồn tối đa */}
              <InputField
                label="Mức Tồn Kho Tối Đa"
                type="number"
                min="10"
                value={maxStock}
                onChange={(e) => setMaxStock(parseInt(e.target.value) || 0)}
                icon={<Layers className="w-3.5 h-3.5 text-indigo-500" />}
              />

              {/* Trạng thái kinh doanh */}
              <SelectField
                label="Trạng Thái Kinh Doanh"
                value={businessStatus}
                onChange={(e) => setBusinessStatus(e.target.value as ProductBusinessStatus)}
                options={[
                  { value: 'ACTIVE', label: 'Đang kinh doanh (Nhập xuất bình thường)' },
                  { value: 'SUSPENDED', label: 'Tạm ngưng nhập hàng' },
                  { value: 'DISCONTINUED', label: 'Ngừng kinh doanh' },
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
