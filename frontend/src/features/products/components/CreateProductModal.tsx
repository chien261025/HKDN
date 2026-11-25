import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Loader2,
  DollarSign,
  Ruler,
  Layers,
  Tag,
  CheckCircle2,
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
import { Modal, Button, InputField, SelectField } from '../../../components/common';
import { ProductImageUploader } from './ProductImageUploader';
import { generateInternalEan13, isValidEan13 } from '../utils/barcodeUtils';
import { analyzeProductAndGenerateSku, ensureUniqueSkuClient } from '../utils/smartSkuGenerator';
import { inferCategoryGroup, productService } from '../services/productService';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProductItem) => Promise<void> | void;
  suppliers: SupplierItem[];
  categories?: CategoryItem[];
  existingSkus?: string[];
  existingBarcodes?: string[];
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
  suppliers,
  categories = [],
  existingSkus = [],
  existingBarcodes = [],
}) => {
  // Only genuine procurement suppliers (exclude B2B customers CUST-*)
  const activeSuppliers = useMemo(() => {
    const procurement = suppliers.filter(
      (s) => s.status === 'ACTIVE' && !s.code?.toUpperCase().startsWith('CUST-')
    );
    return procurement.length > 0 ? procurement : suppliers.filter((s) => s.status === 'ACTIVE');
  }, [suppliers]);

  const [activeTab, setActiveTab] = useState<'BASIC' | 'LOGISTICS' | 'FINANCE'>('BASIC');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const activeCategories = useMemo(
    () => categories.filter((c) => c.status === 'ACTIVE'),
    [categories]
  );

  const defaultCategoryObj = useMemo(() => {
    if (activeCategories.length === 0) return null;
    return (
      activeCategories.find((c) => inferCategoryGroup(Number(c.id), c.code, c.name) === 'FOOD_BEVERAGE') ||
      activeCategories[0]
    );
  }, [activeCategories]);

  // Basic info
  const [sku, setSku] = useState('');
  const [isSkuManual, setIsSkuManual] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('FOOD_BEVERAGE');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryObj?.id || '');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiPowered, setIsAiPowered] = useState<boolean | null>(null);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
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
  const [supplierId, setSupplierId] = useState<string>(activeSuppliers[0]?.id || '');

  // Inventory limits & Finance
  const [reorderPoint, setReorderPoint] = useState<number>(50);
  const [safetyStock, setSafetyStock] = useState<number>(20);
  const [maxStock, setMaxStock] = useState<number>(500);
  const [purchasePrice, setPurchasePrice] = useState<number>(150000);
  const [sellingPrice, setSellingPrice] = useState<number>(195000);
  const [businessStatus, setBusinessStatus] = useState<ProductBusinessStatus>('ACTIVE');

  // Master Data Policies
  const [trackingMethod, setTrackingMethod] = useState<ProductTrackingMethod>('FEFO_BATCH');
  const [isBatchManaged, setIsBatchManaged] = useState<boolean>(true);
  const [isExpiryManaged, setIsExpiryManaged] = useState<boolean>(true);
  const [shelfLifeDays, setShelfLifeDays] = useState<number>(365);
  const [outboundStrategy, setOutboundStrategy] = useState<'FEFO' | 'FIFO' | 'LIFO'>('FEFO');

  const resetForm = () => {
    setActiveTab('BASIC');
    setFormError('');
    setIsSubmitting(false);
    setSku('');
    setIsSkuManual(false);
    setBarcode('');
    setName('');
    setDescription('');
    setCategory(
      defaultCategoryObj
        ? inferCategoryGroup(Number(defaultCategoryObj.id), defaultCategoryObj.code, defaultCategoryObj.name)
        : 'FOOD_BEVERAGE'
    );
    setSelectedCategoryId(defaultCategoryObj?.id || '');
    setAiSuggestion(null);
    setIsAiPowered(null);
    setBrand('');
    setOrigin('Việt Nam');
    setImageUrl('');
    setUnit('Thùng');
    setWeightKg(5);
    setLengthCm(30);
    setWidthCm(20);
    setHeightCm(15);
    setStorageZone('ZONE_A');
    setStorageCondition('AMBIENT');
    setSupplierId(activeSuppliers[0]?.id || '');
    setReorderPoint(50);
    setSafetyStock(20);
    setMaxStock(500);
    setPurchasePrice(150000);
    setSellingPrice(195000);
    setBusinessStatus('ACTIVE');
    setTrackingMethod('FEFO_BATCH');
    setIsBatchManaged(true);
    setIsExpiryManaged(true);
    setShelfLifeDays(365);
    setOutboundStrategy('FEFO');
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeSuppliers.length > 0 && !activeSuppliers.some((s) => s.id === supplierId)) {
      setSupplierId(activeSuppliers[0].id);
    }
  }, [activeSuppliers, supplierId]);

  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some((c) => c.id === selectedCategoryId)) {
      if (defaultCategoryObj) {
        setSelectedCategoryId(defaultCategoryObj.id);
        setCategory(inferCategoryGroup(Number(defaultCategoryObj.id), defaultCategoryObj.code, defaultCategoryObj.name));
      }
    }
  }, [activeCategories, selectedCategoryId, defaultCategoryObj]);

  const applyZoneAndCategoryDefaults = (zone: StorageZoneReq, cat: ProductCategory) => {
    if (zone === 'ZONE_B') {
      setStorageCondition('COOL');
      setTrackingMethod('FEFO_BATCH');
      setIsBatchManaged(true);
      setIsExpiryManaged(true);
      setOutboundStrategy('FEFO');
      setShelfLifeDays((d) => (d > 0 ? d : 45));
    } else if (zone === 'ZONE_C') {
      setStorageCondition('COLD');
      setTrackingMethod('FEFO_BATCH');
      setIsBatchManaged(true);
      setIsExpiryManaged(true);
      setOutboundStrategy('FEFO');
      setShelfLifeDays((d) => (d > 0 ? d : 90));
    } else if (zone === 'ZONE_D') {
      setStorageCondition('SECURE');
      setTrackingMethod('SERIAL_IMEI');
      setIsBatchManaged(false);
      setIsExpiryManaged(false);
      setOutboundStrategy('FIFO');
      setShelfLifeDays(0);
    } else {
      setStorageCondition('AMBIENT');
      if (cat === 'FOOD_BEVERAGE' || cat === 'PHARMACEUTICAL' || cat === 'CHEMICAL') {
        setTrackingMethod('FEFO_BATCH');
        setIsBatchManaged(true);
        setIsExpiryManaged(true);
        setOutboundStrategy('FEFO');
        setShelfLifeDays((d) => (d > 0 ? d : 365));
      } else if (cat === 'ELECTRONICS') {
        setTrackingMethod('SERIAL_IMEI');
        setIsBatchManaged(false);
        setIsExpiryManaged(false);
        setOutboundStrategy('FIFO');
        setShelfLifeDays(0);
      } else {
        setTrackingMethod('STANDARD');
        setIsBatchManaged(false);
        setIsExpiryManaged(false);
        setOutboundStrategy('FIFO');
        setShelfLifeDays(0);
      }
    }
  };

  const applyAiAnalysisResult = (analysis: {
    sku: string;
    category: ProductCategory;
    storageZone: StorageZoneReq;
    storageCondition: StorageConditionType;
    unit: string;
    isExpiryManaged: boolean;
    outboundStrategy: 'FEFO' | 'FIFO';
    shelfLifeDays: number;
    reason: string;
    aiPowered?: boolean;
  }) => {
    const safeSku = ensureUniqueSkuClient(analysis.sku, existingSkus);
    setSku(safeSku);
    if (categories.length > 0) {
      const matchedActive = activeCategories.find(
        (c) => inferCategoryGroup(Number(c.id), c.code, c.name) === analysis.category
      );
      if (matchedActive) {
        setSelectedCategoryId(matchedActive.id);
        setCategory(analysis.category);
      } else {
        setCategory(
          defaultCategoryObj
            ? inferCategoryGroup(Number(defaultCategoryObj.id), defaultCategoryObj.code, defaultCategoryObj.name)
            : 'GENERAL'
        );
      }
    } else {
      setCategory(analysis.category);
    }
    setStorageZone(analysis.storageZone);
    setStorageCondition(analysis.storageCondition);
    setUnit(analysis.unit);
    setIsExpiryManaged(analysis.isExpiryManaged);
    setOutboundStrategy(analysis.outboundStrategy);
    setShelfLifeDays(analysis.isExpiryManaged ? Math.max(1, analysis.shelfLifeDays || 180) : 0);

    if (analysis.category === 'ELECTRONICS') {
      setTrackingMethod('SERIAL_IMEI');
      setIsBatchManaged(false);
    } else if (analysis.isExpiryManaged) {
      setTrackingMethod('FEFO_BATCH');
      setIsBatchManaged(true);
    } else {
      setTrackingMethod('STANDARD');
      setIsBatchManaged(false);
    }

    setAiSuggestion(analysis.reason);
    setIsAiPowered(analysis.aiPowered ?? false);
  };

  const volumeCbm = useMemo(() => {
    const cbm = (lengthCm * widthCm * heightCm) / 1000000;
    return Math.round(cbm * 10000) / 10000;
  }, [lengthCm, widthCm, heightCm]);

  const profitMarginPct = useMemo(() => {
    if (sellingPrice <= 0 || purchasePrice <= 0) return 0;
    return Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100);
  }, [purchasePrice, sellingPrice]);

  const isSkuDuplicate = useMemo(() => {
    if (!sku.trim()) return false;
    const clean = sku.trim().toUpperCase();
    return existingSkus.some((s) => s.trim().toUpperCase() === clean);
  }, [sku, existingSkus]);

  const isBarcodeDuplicate = useMemo(() => {
    if (!barcode.trim()) return false;
    const clean = barcode.trim();
    return existingBarcodes.some((b) => b.trim() === clean);
  }, [barcode, existingBarcodes]);

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

  if (!isOpen) return null;

  const handleAutoSku = async (nameToUse?: string) => {
    setFormError('');
    setIsSkuManual(false);
    const targetName = typeof nameToUse === 'string' ? nameToUse : name;
    if (!targetName.trim()) {
      const random = Math.floor(100 + Math.random() * 900);
      const safeSku = ensureUniqueSkuClient(`SKU-GEN-${random}`, existingSkus);
      setSku(safeSku);
      setAiSuggestion(null);
      setIsAiPowered(null);
      return;
    }
    setIsAiLoading(true);
    try {
      const analysis = await productService.suggestSkuByAi(targetName);
      applyAiAnalysisResult(analysis);
    } catch {
      const analysis = analyzeProductAndGenerateSku(targetName, existingSkus);
      applyAiAnalysisResult({ ...analysis, aiPowered: false });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAutoBarcode = () => {
    setFormError('');
    let validEan13 = generateInternalEan13();
    while (existingBarcodes.includes(validEan13)) {
      validEan13 = generateInternalEan13();
    }
    setBarcode(validEan13);
  };

  const validateTab = (tab: 'BASIC' | 'LOGISTICS' | 'FINANCE'): string => {
    if (tab === 'BASIC') {
      if (!name.trim() || name.trim().length < 2) {
        return 'Vui lòng nhập Tên hàng hóa / sản phẩm (tối thiểu 2 ký tự)!';
      }
      if (!sku.trim()) {
        return 'Vui lòng nhập hoặc bấm "Gợi ý mã SKU bằng AI" để sinh mã SKU!';
      }
      if (isSkuDuplicate) {
        return `Mã SKU "${sku.trim().toUpperCase()}" đã tồn tại trong danh mục WMS! Vui lòng đổi mã khác.`;
      }
      if (isBarcodeDuplicate) {
        return `Mã vạch Barcode "${barcode.trim()}" đã thuộc về sản phẩm khác trong kho!`;
      }
      if (categories.length > 0) {
        const chosenCat = categories.find((c) => c.id === selectedCategoryId);
        if (!chosenCat || chosenCat.status !== 'ACTIVE') {
          return 'Vui lòng chọn Danh mục ngành hàng Đang hoạt động (không chọn danh mục Ngưng hoạt động / Đã xóa)!';
        }
      }
      if (!activeSuppliers.some((s) => s.id === supplierId)) {
        return 'Vui lòng chọn Nhà cung cấp hợp lệ (không chọn khách hàng)!';
      }
      return '';
    }

    if (tab === 'LOGISTICS') {
      if (weightKg <= 0) return 'Trọng lượng sản phẩm phải lớn hơn 0 kg!';
      if (lengthCm <= 0 || widthCm <= 0 || heightCm <= 0) {
        return 'Kích thước bao bì (Dài, Rộng, Cao) phải lớn hơn 0 cm để tính CBM!';
      }
      if (isExpiryManaged && shelfLifeDays < 1) {
        return 'Sản phẩm theo dõi hạn sử dụng cần số ngày HSD tiêu chuẩn >= 1 ngày!';
      }
      return '';
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      return 'Giá nhập và giá bán đề xuất không được là số âm!';
    }
    if (mrpValidationError) {
      return mrpValidationError;
    }
    return '';
  };

  const handleNextStep = () => {
    const err = validateTab(activeTab);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError('');
    setActiveTab(activeTab === 'BASIC' ? 'LOGISTICS' : 'FINANCE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errBasic = validateTab('BASIC');
    if (errBasic) {
      setActiveTab('BASIC');
      setFormError(errBasic);
      return;
    }
    const errLogistics = validateTab('LOGISTICS');
    if (errLogistics) {
      setActiveTab('LOGISTICS');
      setFormError(errLogistics);
      return;
    }
    const errFinance = validateTab('FINANCE');
    if (errFinance) {
      setActiveTab('FINANCE');
      setFormError(errFinance);
      return;
    }

    const selectedSupplier = activeSuppliers.find((s) => s.id === supplierId) || activeSuppliers[0];
    if (!selectedSupplier) {
      setFormError('Không tìm thấy nhà cung cấp hợp lệ đang hoạt động.');
      return;
    }

    const finalBarcode = barcode.trim() || generateInternalEan13();
    const chosenCatObj = categories.find((c) => c.id === selectedCategoryId);

    const newProduct: ProductItem = {
      id: 'prod_' + Date.now(),
      sku: sku.trim().toUpperCase(),
      barcode: finalBarcode,
      name: name.trim(),
      description: description.trim(),
      category,
      categoryId: chosenCatObj ? Number(chosenCatObj.id) : undefined,
      categoryCode: chosenCatObj?.code,
      categoryName: chosenCatObj?.name,
      unit,
      brand: brand.trim(),
      origin: origin.trim(),
      imageUrl: imageUrl.trim(),
      storageCondition,
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
      currentStock: 0,
      storageZone,
      supplierCode: selectedSupplier.code,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      status: 'ACTIVE',
    };

    setIsSubmitting(true);
    setFormError('');
    try {
      await onAddProduct(newProduct);
      resetForm();
      onClose();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Không thể lưu sản phẩm mới vào hệ thống.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thêm Sản Phẩm Mới Vào Danh Mục"
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

        {/* Navigation Tabs inside Modal */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => {
              setFormError('');
              setActiveTab('BASIC');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'BASIC'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>1. Thông Tin Cơ Bản</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const err = validateTab('BASIC');
              if (err && activeTab === 'BASIC') {
                setFormError(err);
                return;
              }
              setFormError('');
              setActiveTab('LOGISTICS');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LOGISTICS'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>2. Quy Cách & Lưu Kho</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const errB = validateTab('BASIC');
              if (errB) {
                setActiveTab('BASIC');
                setFormError(errB);
                return;
              }
              const errL = validateTab('LOGISTICS');
              if (errL && activeTab === 'LOGISTICS') {
                setFormError(errL);
                return;
              }
              setFormError('');
              setActiveTab('FINANCE');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'FINANCE'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>3. Giá Tiền & Tồn Kho</span>
          </button>
        </div>

        {/* TAB 1: BASIC INFO */}
        {activeTab === 'BASIC' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mã SKU */}
              <InputField
                label="Mã Sản Phẩm (Mã SKU)"
                required
                placeholder="VD: SKU-FURN-BAN-101"
                value={sku}
                onChange={(e) => {
                  setIsSkuManual(true);
                  setSku(e.target.value);
                  setFormError('');
                }}
                error={
                  isSkuDuplicate
                    ? `Mã hàng "${sku.trim().toUpperCase()}" đã tồn tại trong kho! Vui lòng đổi mã khác hoặc bấm "Tạo mã tự động".`
                    : undefined
                }
                action={
                  <button
                    type="button"
                    disabled={isAiLoading}
                    onClick={() => handleAutoSku()}
                    className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Tự động tạo mã sản phẩm phù hợp"
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                    )}
                    <span>{isAiLoading ? 'Đang tạo mã...' : 'Tạo mã tự động'}</span>
                  </button>
                }
              />

              {/* Mã Barcode */}
              <InputField
                label="Mã Vạch (Barcode)"
                placeholder="VD: 8935001234567"
                value={barcode}
                onChange={(e) => {
                  setBarcode(e.target.value);
                  setFormError('');
                }}
                error={
                  isBarcodeDuplicate
                    ? `Mã vạch "${barcode.trim()}" đã tồn tại trên sản phẩm khác!`
                    : undefined
                }
                helperText={
                  ean13CheckValid === true
                    ? '✓ Mã vạch 13 số hợp lệ'
                    : ean13CheckValid === false
                    ? '⚠ Mã 13 số chưa đúng quy chuẩn, nên bấm Tự tạo mã.'
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
              <div className="md:col-span-2 space-y-2">
                <InputField
                  label="Tên Sản Phẩm"
                  required
                  placeholder="VD: Nước mắm Nam Ngư, Bàn làm việc chữ L, Ghế công thái học..."
                  value={name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setName(newName);
                    setFormError('');
                    if (newName.trim().length >= 2 && !isSkuManual) {
                      const analysis = analyzeProductAndGenerateSku(newName, existingSkus);
                      applyAiAnalysisResult({ ...analysis, aiPowered: false });
                    } else if (!newName.trim()) {
                      setAiSuggestion(null);
                      setIsAiPowered(null);
                    }
                  }}
                />

                {aiSuggestion && (
                  <div className="flex items-center justify-between gap-2 text-xs text-indigo-800 bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50/60 border border-indigo-200/80 px-3.5 py-2.5 rounded-xl shadow-xs transition-all">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 animate-pulse" />
                      <span><strong>Gợi ý tự động:</strong> {aiSuggestion}</span>
                    </div>
                    {isAiPowered !== null && (
                      <span
                        className={`shrink-0 ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                          isAiPowered ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isAiPowered ? 'Đề xuất thông minh' : 'Tự động'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Ngành hàng */}
              {categories.length > 0 ? (
                <SelectField
                  label="Ngành Hàng"
                  required
                  value={selectedCategoryId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedCategoryId(nextId);
                    const catObj = categories.find((c) => c.id === nextId);
                    const nextGroup = catObj
                      ? inferCategoryGroup(Number(catObj.id), catObj.code, catObj.name)
                      : category;
                    setCategory(nextGroup);
                    applyZoneAndCategoryDefaults(storageZone, nextGroup);
                    setFormError('');
                  }}
                  options={categories
                    .filter((c) => c.status !== 'DELETED')
                    .map((c) => ({
                      value: c.id,
                      label: `[${c.code}] ${c.name}${
                        c.status === 'INACTIVE' ? ' (Tạm ngưng)' : ''
                      }`,
                      disabled: c.status !== 'ACTIVE',
                    }))}
                  helperText="Danh mục đang Tạm ngưng không thể gán cho sản phẩm mới."
                />
              ) : (
                <SelectField
                  label="Ngành Hàng"
                  value={category}
                  onChange={(e) => {
                    const nextCat = e.target.value as ProductCategory;
                    setCategory(nextCat);
                    applyZoneAndCategoryDefaults(storageZone, nextCat);
                  }}
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

              {/* Nhà cung cấp (Chỉ NCC SUP-*, lọc bỏ Khách hàng CUST-*) */}
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
                  const nextZone = e.target.value as StorageZoneReq;
                  setStorageZone(nextZone);
                  applyZoneAndCategoryDefaults(nextZone, category);
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

              {/* Phương thức quản lý tồn kho */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Cách Quản Lý Tồn Kho</span>
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
                        Theo Lô &amp; Hạn Dùng
                      </span>
                      {trackingMethod === 'FEFO_BATCH' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Quản lý theo số lô và hạn sử dụng. Tự động xuất hàng cận hạn trước.
                    </p>
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
                        Theo Serial / IMEI
                      </span>
                      {trackingMethod === 'SERIAL_IMEI' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Quản lý từng số Serial/IMEI riêng khi nhập và xuất kho.
                    </p>
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

              {/* Thiết lập chi tiết khi quản lý theo Lô & HSD */}
              {trackingMethod === 'FEFO_BATCH' && (
                <div className="md:col-span-2 bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                    <ShieldAlert className="w-4 h-4 text-indigo-600" />
                    <span>Thiết Lập Lô &amp; Hạn Sử Dụng</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        id="create-is-batch-managed"
                        type="checkbox"
                        checked={isBatchManaged}
                        onChange={(e) => setIsBatchManaged(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="create-is-batch-managed" className="text-xs font-semibold text-slate-700 cursor-pointer">
                        Bắt buộc nhập số lô hàng
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        id="create-is-expiry-managed"
                        type="checkbox"
                        checked={isExpiryManaged}
                        onChange={(e) => setIsExpiryManaged(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label htmlFor="create-is-expiry-managed" className="text-xs font-semibold text-slate-700 cursor-pointer">
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
                onChange={(e) => setBusinessStatus(e.target.value as ProductBusinessStatus)}
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
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <Button variant="outline" size="md" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          {activeTab !== 'BASIC' && (
            <Button
              variant="outline"
              size="md"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setFormError('');
                setActiveTab(activeTab === 'FINANCE' ? 'LOGISTICS' : 'BASIC');
              }}
            >
              &larr; Quay lại
            </Button>
          )}
          {activeTab !== 'FINANCE' ? (
            <Button variant="primary" size="md" type="button" onClick={handleNextStep}>
              Bước Tiếp Theo &rarr;
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              type="submit"
              isLoading={isSubmitting}
              icon={<Plus className="w-4 h-4" />}
            >
              {isSubmitting ? 'Đang Lưu...' : 'Thêm Sản Phẩm'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
