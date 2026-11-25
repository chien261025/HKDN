import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Package,
  ShieldAlert,
  AlertTriangle,
  Trash2,
  Tag,
  Ruler,
  DollarSign,
  Layers,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  CategoryItem,
  ProductItem,
  ProductCategory,
  StorageZoneReq,
  SupplierItem,
  StorageConditionType,
  ProductBusinessStatus,
  ProductTrackingMethod,
} from '../types';
import { StockItem } from '../../labels/types';
import { Modal, Button, InputField, SelectField } from '../../../components/common';
import { ProductImageUploader } from './ProductImageUploader';
import { generateInternalEan13, isValidEan13 } from '../utils/barcodeUtils';
import { inferCategoryGroup } from '../services/productService';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onUpdateProduct: (product: ProductItem) => Promise<void> | void;
  suppliers: SupplierItem[];
  categories?: CategoryItem[];
  onDeleteProduct: (product: ProductItem) => Promise<void> | void;
  inventoryBalances?: StockItem[];
  existingProducts?: ProductItem[];
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onUpdateProduct,
  suppliers,
  categories = [],
  onDeleteProduct,
  inventoryBalances = [],
  existingProducts = [],
}) => {
  const [activeTab, setActiveTab] = useState<'BASIC' | 'LOGISTICS' | 'FINANCE'>('BASIC');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);

  // Basic info
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('FOOD_BEVERAGE');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
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

  // Master Data Policies
  const [trackingMethod, setTrackingMethod] = useState<ProductTrackingMethod>('FEFO_BATCH');
  const [isBatchManaged, setIsBatchManaged] = useState<boolean>(true);
  const [isExpiryManaged, setIsExpiryManaged] = useState<boolean>(true);
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(45);
  const [outboundStrategy, setOutboundStrategy] = useState<'FEFO' | 'FIFO' | 'LIFO'>('FEFO');

  useEffect(() => {
    if (isOpen && product) {
      setActiveTab('BASIC');
      setFormError('');
      setIsSubmitting(false);
      setConfirmDeleteOpen(false);
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setName(product.name || '');
      setDescription(product.description || '');
      setCategory(product.category || 'FOOD_BEVERAGE');
      if (product.categoryId) {
        setSelectedCategoryId(String(product.categoryId));
      } else if (categories.length > 0) {
        const matchedCat = categories.find(
          (c) => inferCategoryGroup(Number(c.id), c.code, c.name) === product.category
        );
        setSelectedCategoryId(matchedCat ? String(matchedCat.id) : '');
      } else {
        setSelectedCategoryId('');
      }
      setBrand(product.brand || '');
      setOrigin(product.origin || 'Việt Nam');
      setImageUrl(product.imageUrl || '');
      setUnit(product.unit || 'Hộp');
      setWeightKg(product.weightKg ?? 1);
      setLengthCm(product.lengthCm ?? 20);
      setWidthCm(product.widthCm ?? 15);
      setHeightCm(product.heightCm ?? 10);
      setStorageZone(product.storageZone || 'ZONE_A');
      setStorageCondition(product.storageCondition || 'AMBIENT');
      setReorderPoint(product.reorderPoint ?? 50);
      setSafetyStock(product.safetyStock ?? 20);
      setMaxStock(product.maxStock ?? 500);
      setPurchasePrice(product.purchasePrice ?? 0);
      setSellingPrice(product.sellingPrice ?? 0);
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
      setShelfLifeDays(product.shelfLifeDays ?? (product.category === 'FOOD_BEVERAGE' ? 45 : 365));
      setOutboundStrategy(product.outboundStrategy || (product.category === 'FOOD_BEVERAGE' ? 'FEFO' : 'FIFO'));

      const matchedSupp = suppliers.find((s) => s.code === product.supplierCode);
      if (product.supplierId) setSupplierId(product.supplierId);
      else if (matchedSupp) setSupplierId(matchedSupp.id);
      else if (suppliers.length > 0) setSupplierId(suppliers[0].id);
    }
  }, [isOpen, product, suppliers]);

  const volumeCbm = useMemo(() => {
    const cbm = (lengthCm * widthCm * heightCm) / 1000000;
    return Math.round(cbm * 10000) / 10000;
  }, [lengthCm, widthCm, heightCm]);

  const profitMarginPct = useMemo(() => {
    if (sellingPrice <= 0 || purchasePrice <= 0) return 0;
    return Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100);
  }, [purchasePrice, sellingPrice]);

  const isBarcodeDuplicate = useMemo(() => {
    const clean = barcode.trim();
    if (!clean || !product) return false;
    return existingProducts.some(
      (other) => String(other.id) !== String(product.id) && (other.barcode || '').trim() === clean
    );
  }, [barcode, existingProducts, product]);

  const ean13CheckValid = useMemo(() => {
    const clean = barcode.trim();
    if (!clean) return null;
    if (/^\d{13}$/.test(clean)) return isValidEan13(clean);
    return null;
  }, [barcode]);

  const mrpValidationError = useMemo(() => {
    if (safetyStock < 0 || reorderPoint < 0 || maxStock < 1) {
      return 'Định mức tồn tối thiểu / ngưỡng đặt phải >= 0 và tồn tối đa >= 1.';
    }
    if (safetyStock > reorderPoint) {
      return `Tồn kho tối thiểu (${safetyStock}) không được lớn hơn Ngưỡng đặt hàng lại (${reorderPoint}).`;
    }
    if (reorderPoint > maxStock) {
      return `Ngưỡng đặt hàng lại (${reorderPoint}) không được vượt quá Mức tồn tối đa (${maxStock}).`;
    }
    return '';
  }, [safetyStock, reorderPoint, maxStock]);

  // Total stock across all warehouses (to enforce enterprise soft-delete protection)
  const totalSystemStockInfo = useMemo(() => {
    if (!product) return { onHand: 0, reserved: 0 };
    const matched = inventoryBalances.filter(
      (b) => String(b.productId) === String(product.id) || (b.sku && b.sku === product.sku)
    );
    if (matched.length === 0) {
      return { onHand: product.currentStock || 0, reserved: 0 };
    }
    return matched.reduce(
      (acc, b) => ({
        onHand: acc.onHand + (b.onHandQty || 0),
        reserved: acc.reserved + (b.reservedQty || 0),
      }),
      { onHand: 0, reserved: 0 }
    );
  }, [product, inventoryBalances]);

  if (!isOpen || !product) return null;

  const hasSystemStock = totalSystemStockInfo.onHand > 0 || totalSystemStockInfo.reserved > 0;

  const handleAutoBarcode = () => {
    setFormError('');
    let validEan13 = generateInternalEan13();
    while (
      existingProducts.some(
        (other) => String(other.id) !== String(product.id) && (other.barcode || '').trim() === validEan13
      )
    ) {
      validEan13 = generateInternalEan13();
    }
    setBarcode(validEan13);
  };

  const validateAll = (): string | null => {
    if (!name.trim() || name.trim().length < 2) {
      setActiveTab('BASIC');
      return 'Tên sản phẩm phải có ít nhất 2 ký tự!';
    }
    if (isBarcodeDuplicate) {
      setActiveTab('BASIC');
      return `Mã vạch "${barcode.trim()}" đã thuộc về một sản phẩm khác trong danh mục!`;
    }
    if (categories.length > 0 && selectedCategoryId && selectedCategoryId !== String(product.categoryId || '')) {
      const targetCat = categories.find((c) => c.id === selectedCategoryId);
      if (!targetCat || targetCat.status !== 'ACTIVE') {
        setActiveTab('BASIC');
        return 'Không thể chuyển sản phẩm sang danh mục đang Ngưng hoạt động hoặc Đã xóa!';
      }
    }
    if (weightKg <= 0 || lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
      setActiveTab('LOGISTICS');
      return 'Trọng lượng (kg) và Kích thước bao bì (Dài, Rộng, Cao cm) phải lớn hơn 0!';
    }
    if (isExpiryManaged && shelfLifeDays < 1) {
      setActiveTab('LOGISTICS');
      return 'Mặt hàng quản lý hạn sử dụng cần số ngày HSD tiêu chuẩn >= 1!';
    }
    if (purchasePrice < 0 || sellingPrice < 0) {
      setActiveTab('FINANCE');
      return 'Giá nhập và giá bán không được âm!';
    }
    if (mrpValidationError) {
      setActiveTab('FINANCE');
      return mrpValidationError;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateAll();
    if (err) {
      setFormError(err);
      return;
    }

    const selectedSupplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];
    const selectedCatObj = categories.find((c) => c.id === selectedCategoryId);

    const updatedProduct: ProductItem = {
      ...product,
      barcode: barcode.trim() || product.barcode,
      name: name.trim(),
      description: description.trim(),
      category,
      categoryId: selectedCatObj ? Number(selectedCatObj.id) : product.categoryId,
      categoryCode: selectedCatObj?.code || product.categoryCode,
      categoryName: selectedCatObj?.name || product.categoryName,
      brand: brand.trim(),
      origin: origin.trim(),
      imageUrl: imageUrl.trim(),
      unit: unit.trim(),
      weightKg: Number(weightKg),
      lengthCm: Number(lengthCm),
      widthCm: Number(widthCm),
      heightCm: Number(heightCm),
      volumeCbm,
      reorderPoint: Number(reorderPoint),
      safetyStock: Number(safetyStock),
      maxStock: Number(maxStock),
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
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

    setIsSubmitting(true);
    setFormError('');
    try {
      await onUpdateProduct(updatedProduct);
      onClose();
    } catch (apiErr: any) {
      setFormError(apiErr?.response?.data?.message || apiErr?.message || 'Không thể lưu thay đổi hồ sơ sản phẩm.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (hasSystemStock) {
      setFormError(
        `Không thể xóa SKU ${product.sku} vì toàn hệ thống vẫn còn ${totalSystemStockInfo.onHand} ${product.unit} tồn kho (giữ chỗ: ${totalSystemStockInfo.reserved}). Hãy chuyển Trạng Thái Kinh Doanh sang "Tạm ngưng nhập" hoặc "Ngừng kinh doanh".`
      );
      setConfirmDeleteOpen(false);
      return;
    }

    setIsSubmitting(true);
    setFormError('');
    try {
      await onDeleteProduct(product);
      setConfirmDeleteOpen(false);
      onClose();
    } catch (delErr: any) {
      setFormError(delErr?.response?.data?.message || delErr?.message || 'Không thể xóa sản phẩm.');
      setConfirmDeleteOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cập Nhật Sản Phẩm"
      description={
        <span>
          Mã SKU: <strong className="font-mono text-blue-600 font-bold">{sku}</strong>
        </span>
      }
      icon={<Package className="w-5 h-5" />}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inline Error Alert */}
        {formError && (
          <div role="alert" className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Inline Delete Confirmation Panel */}
        {confirmDeleteOpen && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-rose-900 space-y-0.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Xác nhận xóa mềm (Soft Delete) sản phẩm {product.sku}?</span>
              </div>
              <p className="text-rose-700">
                Mặt hàng hiện có tồn kho = 0. Sau khi xóa sẽ ẩn khỏi danh mục kinh doanh (vẫn bảo toàn lịch sử sổ cái).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleConfirmDelete}
              >
                Xác Nhận Xóa
              </Button>
            </div>
          </div>
        )}

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
              {/* Mã SKU */}
              <InputField
                label="Mã Sản Phẩm (SKU)"
                required
                disabled
                value={sku}
                helperText="Mã cố định, không thể thay đổi sau khi tạo."
              />

              {/* Mã Barcode */}
              <InputField
                label="Mã Vạch (Barcode)"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setFormError('');
                }}
                error={
                  isBarcodeDuplicate
                    ? `Mã vạch "${barcode.trim()}" đã thuộc về sản phẩm khác!`
                    : undefined
                }
                helperText={
                  ean13CheckValid === true
                    ? '✓ Mã vạch 13 số hợp lệ'
                    : ean13CheckValid === false
                    ? '⚠ Mã 13 số chưa đúng quy chuẩn'
                    : undefined
                }
                action={
                  <button
                    type="button"
                    onClick={handleAutoBarcode}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tạo mã vạch</span>
                  </button>
                }
              />

              {/* Tên sản phẩm */}
              <div className="md:col-span-2">
                <InputField
                  label="Tên Sản Phẩm"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError('');
                  }}
                />
              </div>

              {/* Ngành hàng */}
              {categories.length > 0 ? (
                <SelectField
                  label="Ngành Hàng"
                  value={selectedCategoryId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedCategoryId(nextId);
                    const catObj = categories.find((c) => c.id === nextId);
                    if (catObj) {
                      setCategory(inferCategoryGroup(Number(catObj.id), catObj.code, catObj.name));
                    }
                    setFormError('');
                  }}
                  options={categories
                    .filter((c) => c.status !== 'DELETED' || String(c.id) === String(product.categoryId || ''))
                    .map((c) => {
                      const isOriginal = String(c.id) === String(product.categoryId || '');
                      const suffix =
                        c.status === 'INACTIVE'
                          ? isOriginal
                            ? ' (Ngưng hoạt động - Giữ nguyên lịch sử)'
                            : ' (Ngưng hoạt động - Không thể gán mới)'
                          : c.status === 'DELETED'
                          ? ' (Đã xóa - Dữ liệu lịch sử)'
                          : '';
                      return {
                        value: c.id,
                        label: `[${c.code}] ${c.name}${suffix}`,
                        disabled: c.status !== 'ACTIVE' && !isOriginal,
                      };
                    })}
                />
              ) : (
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
              )}

              {/* Nhà cung cấp */}
              <SelectField
                label="Nhà Cung Cấp Mặc Định"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                options={suppliers
                  .filter((s) => !s.code?.toUpperCase().startsWith('CUST-') || s.id === supplierId)
                  .map((s) => ({
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
                <ProductImageUploader value={imageUrl} onChange={setImageUrl} />
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
                  { value: 'Thùng', label: 'Thùng' },
                  { value: 'Hộp', label: 'Hộp' },
                  { value: 'Chai', label: 'Chai' },
                  { value: 'Lon', label: 'Lon' },
                  { value: 'Gói', label: 'Gói' },
                  { value: 'Túi', label: 'Túi' },
                  { value: 'Lốc', label: 'Lốc' },
                  { value: 'Chiếc', label: 'Chiếc' },
                  { value: 'Cái', label: 'Cái' },
                  { value: 'Đôi', label: 'Đôi' },
                  { value: 'Can', label: 'Can' },
                  { value: 'Kiện', label: 'Kiện' },
                  { value: 'Khay', label: 'Khay' },
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
                error={weightKg <= 0 ? 'Trọng lượng phải > 0 kg' : undefined}
                onChange={(e) => {
                  setWeightKg(parseFloat(e.target.value) || 0);
                  setFormError('');
                }}
              />

              {/* Kích thước Dài x Rộng x Cao */}
              <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Ruler className="w-4 h-4 text-blue-600" />
                    Kích Thước Bao Bì (Dài x Rộng x Cao cm)
                  </span>
                  <span className="text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Thể tích: <strong>{volumeCbm} m³</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <InputField
                    label="Chiều Dài (cm)"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(parseFloat(e.target.value) || 0)}
                  />
                  <InputField
                    label="Chiều Rộng (cm)"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={widthCm}
                    onChange={(e) => setWidthCm(parseFloat(e.target.value) || 0)}
                  />
                  <InputField
                    label="Chiều Cao (cm)"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {/* Phân khu lưu trữ ưu tiên */}
              <SelectField
                label="Khu Vực Lưu Kho"
                value={storageZone}
                onChange={(e) => {
                  const nextZ = e.target.value as StorageZoneReq;
                  setStorageZone(nextZ);
                  if (nextZ === 'ZONE_B') setStorageCondition('COOL');
                  else if (nextZ === 'ZONE_C') setStorageCondition('COLD');
                  else if (nextZ === 'ZONE_D') setStorageCondition('SECURE');
                  else setStorageCondition('AMBIENT');
                }}
                options={[
                  { value: 'ZONE_A', label: 'Khu A - Hàng khô thường' },
                  { value: 'ZONE_B', label: 'Khu B - Kho mát (2°C - 8°C)' },
                  { value: 'ZONE_C', label: 'Khu C - Kho đông (-18°C)' },
                  { value: 'ZONE_D', label: 'Khu D - Hàng giá trị cao' },
                ]}
              />

              {/* Điều kiện nhiệt độ */}
              <SelectField
                label="Điều Kiện Bảo Quản"
                value={storageCondition}
                onChange={(e) => setStorageCondition(e.target.value as StorageConditionType)}
                options={[
                  { value: 'AMBIENT', label: 'Nhiệt độ phòng (18-25°C)' },
                  { value: 'COOL', label: 'Kho mát (2-8°C)' },
                  { value: 'COLD', label: 'Đông lạnh (-18°C)' },
                  { value: 'SECURE', label: 'Kho an ninh giá trị cao' },
                ]}
              />

              {/* Cách quản lý tồn kho */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Cách Quản Lý Tồn Kho</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                        Theo Lô &amp; Hạn Dùng
                      </span>
                      {trackingMethod === 'FEFO_BATCH' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Quản lý theo số lô và hạn sử dụng. Tự động xuất hàng cận hạn trước.
                    </p>
                  </div>

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
                        Theo Serial / IMEI
                      </span>
                      {trackingMethod === 'SERIAL_IMEI' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Quản lý từng số Serial/IMEI riêng khi nhập và xuất kho.
                    </p>
                  </div>

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
                        Tiêu Chuẩn (FIFO)
                      </span>
                      {trackingMethod === 'STANDARD' && <CheckCircle2 className="w-3.5 h-3.5 text-slate-800" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Theo dõi số lượng thông thường, nhập trước xuất trước.
                    </p>
                  </div>
                </div>
              </div>

              {trackingMethod === 'FEFO_BATCH' && (
                <div className="md:col-span-2 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    <span>Thiết Lập Lô &amp; Hạn Sử Dụng</span>
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
                        Bắt buộc nhập số lô hàng
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
                        Theo dõi hạn sử dụng
                      </label>
                    </div>

                    {isExpiryManaged && (
                      <InputField
                        label="Hạn Sử Dụng Tiêu Chuẩn (Ngày)"
                        type="number"
                        min="1"
                        value={shelfLifeDays}
                        onChange={(e) => setShelfLifeDays(parseInt(e.target.value, 10) || 0)}
                        helperText="VD: 45 ngày (sữa chua), 180 ngày (sữa tươi)"
                      />
                    )}

                    <SelectField
                      label="Thứ Tự Xuất Kho"
                      value={outboundStrategy}
                      onChange={(e) => setOutboundStrategy(e.target.value as any)}
                      options={[
                        { value: 'FEFO', label: 'FEFO - Cận hạn xuất trước' },
                        { value: 'FIFO', label: 'FIFO - Nhập trước xuất trước' },
                        { value: 'LIFO', label: 'LIFO - Nhập sau xuất trước' },
                      ]}
                    />
                  </div>
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
                onChange={(e) => {
                  setPurchasePrice(parseFloat(e.target.value) || 0);
                  setFormError('');
                }}
                icon={<DollarSign className="w-3.5 h-3.5 text-emerald-600" />}
              />

              {/* Giá Bán */}
              <InputField
                label="Giá Bán Đề Xuất (VNĐ)"
                type="number"
                step="1000"
                min="0"
                value={sellingPrice}
                onChange={(e) => {
                  setSellingPrice(parseFloat(e.target.value) || 0);
                  setFormError('');
                }}
                icon={<DollarSign className="w-3.5 h-3.5 text-blue-600" />}
              />

              <div
                className={`md:col-span-2 p-3 rounded-xl border text-xs flex items-center justify-between font-mono ${
                  sellingPrice > 0 && purchasePrice > sellingPrice
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <span>
                  Lợi nhuận dự kiến: <b>{(sellingPrice - purchasePrice).toLocaleString()} ₫</b>
                  {sellingPrice > 0 && purchasePrice > sellingPrice && (
                    <span className="ml-2 font-sans font-semibold text-rose-700">(⚠ Giá bán thấp hơn giá nhập)</span>
                  )}
                </span>
                <span>Biên lãi: <b>{profitMarginPct}%</b></span>
              </div>

              {/* Định mức tồn an toàn */}
              <InputField
                label="Tồn Tối Thiểu"
                type="number"
                min="0"
                value={safetyStock}
                error={safetyStock > reorderPoint ? 'Tồn tối thiểu phải <= Ngưỡng đặt hàng lại' : undefined}
                onChange={(e) => {
                  setSafetyStock(parseInt(e.target.value, 10) || 0);
                  setFormError('');
                }}
                icon={<ShieldAlert className="w-3.5 h-3.5 text-rose-500" />}
              />

              {/* Điểm đặt hàng lại */}
              <InputField
                label="Ngưỡng Đặt Hàng Lại"
                type="number"
                min="0"
                value={reorderPoint}
                error={
                  reorderPoint < safetyStock
                    ? 'Phải >= Tồn tối thiểu'
                    : reorderPoint > maxStock
                    ? 'Phải <= Tồn tối đa'
                    : undefined
                }
                onChange={(e) => {
                  setReorderPoint(parseInt(e.target.value, 10) || 0);
                  setFormError('');
                }}
                icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              />

              {/* Tồn tối đa */}
              <InputField
                label="Tồn Tối Đa"
                type="number"
                min="1"
                value={maxStock}
                error={maxStock < reorderPoint ? 'Phải >= Ngưỡng đặt hàng lại' : undefined}
                onChange={(e) => {
                  setMaxStock(parseInt(e.target.value, 10) || 0);
                  setFormError('');
                }}
                icon={<Layers className="w-3.5 h-3.5 text-indigo-500" />}
              />

              {/* Trạng thái kinh doanh */}
              <SelectField
                label="Trạng Thái Kinh Doanh"
                value={businessStatus}
                onChange={(e) => {
                  const next = e.target.value as ProductBusinessStatus;
                  setBusinessStatus(next);
                  setStatus(next === 'DISCONTINUED' ? 'INACTIVE' : 'ACTIVE');
                }}
                options={[
                  { value: 'ACTIVE', label: 'Đang kinh doanh' },
                  { value: 'SUSPENDED', label: 'Tạm ngưng nhập hàng' },
                  { value: 'DISCONTINUED', label: 'Ngừng kinh doanh' },
                ]}
              />

              {mrpValidationError && (
                <div className="md:col-span-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{mrpValidationError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="danger"
              size="md"
              disabled={isSubmitting || hasSystemStock}
              icon={<Trash2 className="w-4 h-4" />}
              title={
                hasSystemStock
                  ? `Đang còn ${totalSystemStockInfo.onHand} ${product.unit} tồn kho toàn hệ thống — không thể xóa`
                  : 'Xóa mềm sản phẩm này (tồn = 0)'
              }
              onClick={() => {
                setFormError('');
                setConfirmDeleteOpen(true);
              }}
            >
              Xóa Sản Phẩm
            </Button>
            {hasSystemStock && (
              <span className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                Còn {totalSystemStockInfo.onHand.toLocaleString()} {product.unit} tồn hệ thống (Khóa xóa)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
              Hủy bỏ
            </Button>
            <Button variant="primary" size="md" type="submit" isLoading={isSubmitting} icon={<Save className="w-4 h-4" />}>
              {isSubmitting ? 'Đang Lưu...' : 'Lưu Thay Đổi'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
