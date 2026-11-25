import React, { useMemo, useState, useEffect } from 'react';
import {
  X,
  Package,
  Barcode,
  Ruler,
  DollarSign,
  Layers,
  Printer,
  Edit2,
  Calendar,
  MapPin,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ProductItem } from '../types';
import { getCategoryBadge, getZoneBadge } from '../utils/productBadges';
import { StockItem } from '../../labels/types';
import { canViewCostPrice, formatMaskedPrice } from '../../auth/utils/permissionUtils';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onEditProduct: (product: ProductItem) => void;
  onPrintBarcode: (product: ProductItem) => void;
  inventoryBalances?: StockItem[];
  activeWarehouseId?: string;
  activeWarehouseName?: string;
}

const resolveWarehouseNumericId = (whCodeOrId?: string): number | null => {
  if (!whCodeOrId || whCodeOrId === 'ALL') return null;
  if (whCodeOrId === 'WH01') return 1;
  if (whCodeOrId === 'WH02') return 2;
  if (whCodeOrId === 'WH03') return 3;
  if (whCodeOrId === 'WH04') return 4;
  const num = Number(whCodeOrId);
  return Number.isNaN(num) ? null : num;
};

const getWarehouseDisplayName = (batch: StockItem): string => {
  if (batch.warehouseName && !batch.warehouseName.startsWith('Kho #')) {
    return batch.warehouseName;
  }
  const barcode = batch.locationBarcode || '';
  const whId = batch.warehouseId;
  if (whId === 1 || barcode.startsWith('WH01')) return 'Kho Tổng Tân Bình - TP.HCM (WH01)';
  if (whId === 2 || barcode.startsWith('WH02')) return 'Kho Phân Phối VSIP Bắc Ninh (WH02)';
  if (whId === 3 || barcode.startsWith('WH03')) return 'Kho Vận Miền Trung - Đà Nẵng (WH03)';
  if (whId === 4 || barcode.startsWith('WH04')) return 'Kho Trung Chuyển Sóng Thần - Bình Dương (WH04)';
  return batch.warehouseName || 'Kho Tổng Tân Bình - TP.HCM (WH01)';
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onEditProduct,
  onPrintBarcode,
  inventoryBalances = [],
  activeWarehouseId = 'ALL',
  activeWarehouseName = 'Toàn Bộ Chi Nhánh Kho',
}) => {
  const targetWhId = resolveWarehouseNumericId(activeWarehouseId);
  const [batchScope, setBatchScope] = useState<'ACTIVE_WH' | 'ALL'>(targetWhId ? 'ACTIVE_WH' : 'ALL');
  const [showZeroStockBatches, setShowZeroStockBatches] = useState(false);

  // Sync batch scope when modal opens or warehouse context changes
  useEffect(() => {
    setBatchScope(targetWhId ? 'ACTIVE_WH' : 'ALL');
    setShowZeroStockBatches(false);
  }, [product?.id, targetWhId, isOpen]);

  // Strict SKU / productId match to prevent mixing distinct SKUs that share the same name
  const allProductBatches = useMemo(() => {
    if (!product || !inventoryBalances) return [];
    const matched = inventoryBalances.filter(
      (b) => String(b.productId) === String(product.id) || (b.sku && b.sku === product.sku)
    );
    return [...matched].sort((a, b) => {
      // 1. Prioritize active warehouse
      const aMatch = targetWhId !== null && a.warehouseId === targetWhId ? 0 : 1;
      const bMatch = targetWhId !== null && b.warehouseId === targetWhId ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      // 2. Non-zero stock before zero stock
      const aHasStock = (a.onHandQty || 0) > 0 ? 0 : 1;
      const bHasStock = (b.onHandQty || 0) > 0 ? 0 : 1;
      if (aHasStock !== bHasStock) return aHasStock - bHasStock;
      // 3. Earliest expiry (FEFO)
      const aExp = a.expiryDate && a.expiryDate !== 'N/A' ? new Date(a.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bExp = b.expiryDate && b.expiryDate !== 'N/A' ? new Date(b.expiryDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aExp - bExp;
    });
  }, [product, inventoryBalances, targetWhId]);

  const activeWhBatches = useMemo(() => {
    if (targetWhId === null) return allProductBatches;
    return allProductBatches.filter((b) => b.warehouseId === targetWhId || (!b.warehouseId && targetWhId === 1));
  }, [allProductBatches, targetWhId]);

  const scopedBatches = useMemo(() => {
    return batchScope === 'ACTIVE_WH' && targetWhId !== null ? activeWhBatches : allProductBatches;
  }, [batchScope, targetWhId, activeWhBatches, allProductBatches]);

  const visibleBatches = useMemo(() => {
    if (showZeroStockBatches) return scopedBatches;
    return scopedBatches.filter((b) => (b.onHandQty || 0) > 0 || (b.reservedQty || 0) > 0);
  }, [scopedBatches, showZeroStockBatches]);

  const zeroStockCount = useMemo(() => {
    return scopedBatches.filter((b) => (b.onHandQty || 0) === 0 && (b.reservedQty || 0) === 0).length;
  }, [scopedBatches]);

  const nonZeroActiveWhCount = useMemo(() => {
    return activeWhBatches.filter((b) => (b.onHandQty || 0) > 0 || (b.reservedQty || 0) > 0).length;
  }, [activeWhBatches]);

  const nonZeroAllWhCount = useMemo(() => {
    return allProductBatches.filter((b) => (b.onHandQty || 0) > 0 || (b.reservedQty || 0) > 0).length;
  }, [allProductBatches]);

  // Stock aggregates across current warehouse & all warehouses
  const stockSummary = useMemo(() => {
    const calc = (list: StockItem[]) =>
      list.reduce(
        (acc, b) => {
          const isQua = b.locationBarcode?.includes('ZQ-QUA');
          const isExp = Boolean(b.isExpired);
          const avail = isExp || isQua ? 0 : Math.max(0, b.availableQty ?? 0);
          return {
            onHand: acc.onHand + (b.onHandQty || 0),
            reserved: acc.reserved + (b.reservedQty || 0),
            available: acc.available + avail,
            blocked: acc.blocked + (isExp || isQua ? b.onHandQty || 0 : b.unavailableQty || 0),
          };
        },
        { onHand: 0, reserved: 0, available: 0, blocked: 0 }
      );

    return {
      currentWh: calc(activeWhBatches),
      systemAll: calc(allProductBatches),
    };
  }, [activeWhBatches, allProductBatches]);

  if (!isOpen || !product) return null;

  const isUnderSafety = product.currentStock <= product.safetyStock;
  const isUnderReorder = product.currentStock <= product.reorderPoint && !isUnderSafety;
  const inventoryValue = product.currentStock * (product.purchasePrice || 0);
  const systemValuation = stockSummary.systemAll.onHand * (product.purchasePrice || 0);
  const grossProfitPerUnit = (product.sellingPrice || 0) - (product.purchasePrice || 0);
  const grossMarginPct =
    product.sellingPrice && product.sellingPrice > 0
      ? ((grossProfitPerUnit / product.sellingPrice) * 100).toFixed(1)
      : '0.0';

  const getBatchExpiryInfo = (batch: StockItem) => {
    const expiryDateStr = batch.expiryDate;
    const isQuarantineBin = batch.locationBarcode?.includes('ZQ-QUA') || (batch.unavailableQty || 0) > 0;

    if (!expiryDateStr || expiryDateStr === 'N/A') {
      return {
        status: 'NO_EXPIRY' as const,
        label: product.isExpiryManaged ? 'Chưa gắn ngày HSD' : 'Không áp dụng HSD',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        isExpired: Boolean(batch.isExpired),
        isQuarantineBin,
      };
    }

    const expDate = new Date(expiryDateStr);
    if (Number.isNaN(expDate.getTime())) {
      return {
        status: 'NO_EXPIRY' as const,
        label: 'Không áp dụng HSD',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        isExpired: Boolean(batch.isExpired),
        isQuarantineBin,
      };
    }

    // Compare against current real-time system date
    const now = new Date();
    const expTime = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate()).getTime();
    const nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((expTime - nowTime) / (1000 * 60 * 60 * 24));

    if (batch.isExpired || diffDays < 0) {
      return {
        status: 'EXPIRED' as const,
        label: `ĐÃ HẾT HẠN (${Math.abs(diffDays)} ngày trước)`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        isExpired: true,
        isQuarantineBin,
      };
    } else if (diffDays <= 30) {
      return {
        status: 'EXPIRING_SOON' as const,
        label: `CẬN HẠN (còn ${diffDays} ngày)`,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        isExpired: false,
        isQuarantineBin,
      };
    } else {
      return {
        status: 'VALID' as const,
        label: product.trackingMethod === 'SERIAL_IMEI' ? `Bảo hành / Lưu kho (${diffDays} ngày)` : `Hợp lệ (còn ${diffDays} ngày)`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        isExpired: false,
        isQuarantineBin,
      };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900">Chi Tiết Hồ Sơ Sản Phẩm</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                  {product.sku}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                  <Building2 className="w-3 h-3" />
                  <span>{activeWarehouseName}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Thông tin sản phẩm, giá bán, tồn kho và danh sách lô hàng
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng chi tiết sản phẩm"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[76vh] overflow-y-auto font-sans">
          {/* Top section: Image & Core Highlights */}
          <div className="flex flex-col md:flex-row gap-5 items-start bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90">
            {/* Image Preview */}
            <div className="w-full md:w-40 h-40 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-inner shrink-0 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <Package className="w-12 h-12 stroke-[1.2]" />
                  <span className="text-[11px] mt-1">Chưa có ảnh</span>
                </div>
              )}
            </div>

            {/* Core Info Details */}
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {getCategoryBadge(product.category, product.categoryName)}
                {getZoneBadge(product.storageZone)}
                {product.trackingMethod === 'SERIAL_IMEI' ? (
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                    Serial/IMEI
                  </span>
                ) : product.trackingMethod === 'STANDARD' ? (
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Tiêu Chuẩn
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {product.outboundStrategy || (product.category === 'FOOD_BEVERAGE' ? 'FEFO' : 'FIFO')}
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                    product.businessStatus === 'ACTIVE' || !product.businessStatus
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : product.businessStatus === 'SUSPENDED'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {product.businessStatus === 'ACTIVE' || !product.businessStatus
                    ? 'Đang kinh doanh'
                    : product.businessStatus === 'SUSPENDED'
                    ? 'Tạm ngưng nhập hàng'
                    : 'Ngừng kinh doanh'}
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{product.name}</h3>

              {product.description && (
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-white p-2 rounded-xl border border-slate-200">
                  {product.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400">Thương hiệu:</span>{' '}
                  <span className="font-semibold text-slate-800">{product.brand || 'Chưa cập nhật'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Xuất xứ:</span>{' '}
                  <span className="font-semibold text-slate-800">{product.origin || 'Việt Nam'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400">Nhà cung cấp chính:</span>{' '}
                  <span className="font-semibold text-slate-800">{product.supplierName}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1.5 font-mono">
                  <Barcode className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-slate-800">{product.barcode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Quy cách & Kích thước */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                <Ruler className="w-4 h-4 text-blue-600" />
                <span>Quy Cách & Kích Thước</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Đơn vị tính:</span>
                  <span className="font-bold text-slate-900">{product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trọng lượng:</span>
                  <span className="font-bold text-slate-900">{product.weightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kích thước (DxRxC):</span>
                  <span className="font-mono text-slate-800">
                    {product.lengthCm || 20} x {product.widthCm || 15} x {product.heightCm || 10} cm
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-blue-700 font-semibold">Thể tích đơn vị:</span>
                  <span className="font-mono font-black text-blue-700">{product.volumeCbm || 0.003} m³</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Điều kiện bảo quản:</span>
                  <span className="font-medium text-slate-800 text-right">
                    {product.storageCondition === 'COOL'
                      ? 'Kho mát (2-8°C)'
                      : product.storageCondition === 'COLD'
                      ? 'Kho đông (-18°C)'
                      : product.storageCondition === 'SECURE'
                      ? 'Kho giá trị cao'
                      : 'Nhiệt độ phòng'}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Giá Nhập & Giá Bán */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Giá Vốn & Định Giá Tồn</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá nhập chuẩn:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatMaskedPrice(product.purchasePrice, canViewCostPrice())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá bán đề xuất:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {formatMaskedPrice(product.sellingPrice, canViewCostPrice())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Lợi nhuận gộp / ĐV:</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {canViewCostPrice()
                      ? `${grossProfitPerUnit.toLocaleString()} ₫ (+${grossMarginPct}%)`
                      : '***'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">
                    {targetWhId ? 'Giá trị tồn (kho hiện tại):' : 'Tổng giá trị tồn kho:'}
                  </span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {formatMaskedPrice(inventoryValue, canViewCostPrice())}
                  </span>
                </div>
                {targetWhId && systemValuation !== inventoryValue && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Giá trị toàn hệ thống:</span>
                    <span className="font-mono font-semibold text-indigo-700">
                      {formatMaskedPrice(systemValuation, canViewCostPrice())}
                    </span>
                  </div>
                )}
                {!canViewCostPrice() && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1 leading-relaxed">
                    * Giá vốn và biên lợi nhuận được che giấu theo chính sách bảo mật cho nhân viên tác nghiệp kho.
                  </p>
                )}
              </div>
            </div>

            {/* Box 3: Định mức tồn kho */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Tình Trạng Tồn Kho & Định Mức</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">
                    {targetWhId ? 'Tồn thực tế tại kho:' : 'Tổng tồn thực tế:'}
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isUnderSafety
                        ? 'text-rose-600'
                        : isUnderReorder
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {product.currentStock.toLocaleString()} {product.unit}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Khả dụng / Đang giữ chỗ:</span>
                  <span className="font-mono font-semibold">
                    <span className="text-emerald-700">{stockSummary.currentWh.available.toLocaleString()}</span>
                    {' / '}
                    <span className={stockSummary.currentWh.reserved > 0 ? 'text-amber-600 font-bold' : 'text-slate-400'}>
                      {stockSummary.currentWh.reserved.toLocaleString()}
                    </span>{' '}
                    {product.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tồn toàn hệ thống:</span>
                  <span className="font-mono font-extrabold text-indigo-700">
                    {stockSummary.systemAll.onHand.toLocaleString()} {product.unit}
                  </span>
                </div>
                {product.currentStock === 0 && stockSummary.systemAll.onHand > 0 && (
                  <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10.5px] text-amber-800 leading-snug">
                    ℹ️ Có <strong>{stockSummary.systemAll.onHand.toLocaleString()} {product.unit}</strong> tại chi nhánh khác, kho đang chọn hiện hết hàng.
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500">Tối thiểu / Ngưỡng đặt / Tối đa:</span>
                  <span className="font-mono font-bold text-slate-700">
                    <span className="text-rose-600">{product.safetyStock}</span>
                    {' / '}
                    <span className="text-amber-600">{product.reorderPoint}</span>
                    {' / '}
                    <span className="text-indigo-600">{product.maxStock || 500}</span>
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isUnderSafety
                        ? 'bg-rose-500'
                        : isUnderReorder
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((product.currentStock / ((product.maxStock || 500) * 1.0)) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banner: Phương thức quản lý hàng hóa */}
          <div className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">Cách Quản Lý: </span>
                <span className="text-slate-600">
                  {product.trackingMethod === 'SERIAL_IMEI' ? (
                    <>
                      <strong className="text-cyan-700">Serial / IMEI từng thiết bị</strong> |{' '}
                      Hạn dùng: <strong>{product.isExpiryManaged ? `${product.shelfLifeDays || 365} ngày` : 'Theo bảo hành'}</strong> |{' '}
                      Ưu tiên xuất: <strong className="text-indigo-700">Nhập trước xuất trước (FIFO)</strong>
                    </>
                  ) : (
                    <>
                      Số lô: <strong>{product.isBatchManaged !== false ? 'Bắt buộc' : 'Không bắt buộc'}</strong> |{' '}
                      Hạn dùng: <strong>{product.isExpiryManaged !== false ? `${product.shelfLifeDays || 45} ngày` : 'Không áp dụng'}</strong> |{' '}
                      Ưu tiên xuất: <strong className="text-indigo-700">{product.outboundStrategy === 'FEFO' ? 'Cận hạn xuất trước (FEFO)' : 'Nhập trước xuất trước (FIFO)'}</strong>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Box 4: Chi tiết Lô hàng / Vị trí ô kệ & Trạng thái xuất */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>
                  {product.trackingMethod === 'SERIAL_IMEI'
                    ? 'Danh Sách Lô Thiết Bị & Vị Trí Kệ Lưu Kho'
                    : product.trackingMethod === 'STANDARD'
                    ? 'Số Dư Tồn Kho Tiêu Chuẩn & Vị Trí Kệ'
                    : 'Danh Sách Lô Hàng Đang Lưu Kho & Hạn Sử Dụng'}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {targetWhId !== null && (
                  <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setBatchScope('ACTIVE_WH')}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        batchScope === 'ACTIVE_WH'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Kho hiện tại ({nonZeroActiveWhCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchScope('ALL')}
                      className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                        batchScope === 'ALL'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Tất cả các kho ({nonZeroAllWhCount})
                    </button>
                  </div>
                )}

                {zeroStockCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowZeroStockBatches((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                      showZeroStockBatches
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Ẩn/Hiện các lô lịch sử đã xuất hết hàng (Tồn = 0)"
                  >
                    {showZeroStockBatches ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showZeroStockBatches ? `Ẩn lô hết (${zeroStockCount})` : `Hiện lô lịch sử = 0 (${zeroStockCount})`}</span>
                  </button>
                )}
              </div>
            </div>

            {visibleBatches.length === 0 ? (
              <div className="py-5 text-center text-xs text-slate-500 space-y-1">
                <p className="font-medium">
                  {targetWhId !== null && batchScope === 'ACTIVE_WH' && nonZeroAllWhCount > 0
                    ? `Kho hiện tại không còn lô tồn kho khả dụng (còn ${nonZeroAllWhCount} lô đang lưu tại chi nhánh khác).`
                    : 'Hiện không có lô hàng tồn kho thực tế (> 0) cho mặt hàng này.'}
                </p>
                {zeroStockCount > 0 && !showZeroStockBatches && (
                  <p className="text-[11px] text-slate-400">
                    Có {zeroStockCount} lô lịch sử đã xuất hết hàng. Nhấn &quot;Hiện lô lịch sử = 0&quot; để tra cứu lịch sử phân bổ.
                  </p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                      <th className="py-2 px-2">Kho Lưu Trữ</th>
                      <th className="py-2 px-2">
                        {product.trackingMethod === 'SERIAL_IMEI' ? 'Lô / Đợt Nhập' : 'Số Lô'}
                      </th>
                      <th className="py-2 px-2">Vị Trí Kệ</th>
                      <th className="py-2 px-2">
                        {product.trackingMethod === 'SERIAL_IMEI'
                          ? 'Hạn Lưu Kho / BH'
                          : 'Hạn Sử Dụng & Tình Trạng'}
                      </th>
                      <th className="py-2 px-2 text-right">Tồn Thực Tế</th>
                      <th className="py-2 px-2 text-right">Đang Giữ Chỗ</th>
                      <th className="py-2 px-2 text-right">Có Thể Xuất</th>
                      <th className="py-2 px-2 text-center">Trạng Thái Xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleBatches.map((batch, idx) => {
                      const expInfo = getBatchExpiryInfo(batch);
                      const isQuarantine = expInfo.isQuarantineBin;
                      const displayAvailableQty =
                        expInfo.isExpired || isQuarantine ? 0 : Math.max(0, batch.availableQty ?? 0);
                      const reservedQty = batch.reservedQty || 0;
                      const isEmpty = (batch.onHandQty || 0) <= 0;

                      return (
                        <tr
                          key={`${batch.id || idx}-${batch.locationBarcode}-${batch.batchNumber}`}
                          className={`hover:bg-slate-50 ${
                            expInfo.isExpired || isQuarantine
                              ? 'bg-rose-50/40'
                              : isEmpty
                              ? 'bg-slate-50/60 opacity-75'
                              : ''
                          }`}
                        >
                          <td className="py-2 px-2 text-[11px] font-sans font-medium text-slate-700">
                            {getWarehouseDisplayName(batch)}
                          </td>
                          <td className="py-2 px-2 font-bold text-indigo-700">
                            {batch.batchNumber || 'BATCH-STD-01'}
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex items-center gap-1 text-slate-700">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{batch.locationBarcode || 'Khu Lưu Trữ'}</span>
                            </div>
                          </td>
                          <td className="py-2 px-2">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800">{batch.expiryDate || 'N/A'}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9.5px] w-fit border ${expInfo.badgeClass}`}>
                                {expInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-slate-900">
                            {batch.onHandQty} {product.unit}
                          </td>
                          <td
                            className={`py-2 px-2 text-right font-bold ${
                              reservedQty > 0 ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          >
                            {reservedQty} {product.unit}
                          </td>
                          <td
                            className={`py-2 px-2 text-right font-bold ${
                              displayAvailableQty <= 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {displayAvailableQty} {product.unit}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {expInfo.isExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                                Chặn xuất (Hết hạn)
                              </span>
                            ) : isQuarantine ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                Khu kiểm tra (Khóa xuất)
                              </span>
                            ) : isEmpty ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                Đã xuất hết
                              </span>
                            ) : displayAvailableQty <= 0 && reservedQty > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                Đang giữ chỗ hết
                              </span>
                            ) : expInfo.status === 'EXPIRING_SOON' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Ưu tiên xuất FEFO
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Đủ điều kiện xuất
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onPrintBarcode(product);
              }}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Tem Mã Vạch</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onClose();
                onEditProduct(product);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Chỉnh Sửa Sản Phẩm</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
