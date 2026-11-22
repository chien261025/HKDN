import React, { useMemo } from 'react';
import {
  X,
  Package,
  Barcode,
  Building2,
  Tag,
  Ruler,
  DollarSign,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Thermometer,
  Printer,
  Edit2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  TrendingUp,
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
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onEditProduct,
  onPrintBarcode,
  inventoryBalances = [],
}) => {
  if (!isOpen || !product) return null;

  const isUnderSafety = product.currentStock <= product.safetyStock;
  const isUnderReorder = product.currentStock <= product.reorderPoint && !isUnderSafety;
  const inventoryValue = product.currentStock * (product.purchasePrice || 0);

  // Filter all active warehouse batches belonging to this product
  const productBatches = useMemo(() => {
    if (!product || !inventoryBalances) return [];
    return inventoryBalances.filter(
      (b) =>
        b.sku === product.sku ||
        String(b.productId) === String(product.id) ||
        (b.name && b.name.toLowerCase() === product.name.toLowerCase())
    );
  }, [product, inventoryBalances]);

  // Compute total system stock across all warehouses
  const totalSystemStock = useMemo(() => {
    return productBatches.reduce((acc, b) => acc + (b.onHandQty || 0), 0);
  }, [productBatches]);

  // Helper to determine exact expiry status against system current date (2026-11-20)
  const getBatchExpiryInfo = (expiryDateStr?: string) => {
    if (!expiryDateStr) {
      return {
        status: 'VALID' as const,
        label: 'Không xác định',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        isExpired: false,
        qcNote: 'Không theo dõi HSD',
      };
    }
    const expDate = new Date(expiryDateStr);
    // Baseline system timestamp: 2026-11-20
    const now = new Date('2026-11-20T19:20:00+07:00');
    const expTime = new Date(expDate.getFullYear(), expDate.getMonth(), expDate.getDate()).getTime();
    const nowTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((expTime - nowTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'EXPIRED' as const,
        label: `ĐÃ HẾT HẠN (${Math.abs(diffDays)} ngày trước)`,
        badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
        isExpired: true,
        qcNote: 'Hết hạn - Chặn xuất kho',
      };
    } else if (diffDays <= 30) {
      return {
        status: 'EXPIRING_SOON' as const,
        label: `CẬN DATE (còn ${diffDays} ngày)`,
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
        isExpired: false,
        qcNote: 'Ưu tiên xuất FEFO',
      };
    } else {
      return {
        status: 'VALID' as const,
        label: `Hợp lệ (còn ${diffDays} ngày)`,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        isExpired: false,
        qcNote: 'Đạt chuẩn lưu kho',
      };
    }
  };

  const getWarehouseName = (batch: StockItem) => {
    if (batch.warehouseName) return batch.warehouseName;
    const barcode = batch.locationBarcode || '';
    if (barcode.startsWith('WH04')) return 'Kho Trung Chuyển Sóng Thần (WH04)';
    if (barcode.startsWith('WH02')) return 'Kho Vùng Đà Nẵng (WH02)';
    if (barcode.startsWith('WH03')) return 'Kho Miền Bắc - Hà Nội (WH03)';
    return 'Kho Tổng Tân Bình - TP.HCM (WH01)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Chi Tiết Sản Phẩm</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                  {product.sku}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Thông tin quy cách, giá cả, định mức tồn kho và lô hàng thực tế
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          {/* Top section: Image & Core Highlights */}
          <div className="flex flex-col md:flex-row gap-5 items-start bg-slate-50/70 p-4 rounded-2xl border border-slate-200/90">
            {/* Image Preview */}
            <div className="w-full md:w-44 h-44 rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-inner shrink-0 flex items-center justify-center">
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
            <div className="flex-1 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                {getCategoryBadge(product.category)}
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
                  <span className="text-slate-400">Nhà cung cấp:</span>{' '}
                  <span className="font-semibold text-slate-800">{product.supplierName}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1 font-mono">
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
                  <span className="text-slate-500">Kích thước (Dài x Rộng x Cao):</span>
                  <span className="font-mono text-slate-800">
                    {product.lengthCm || 20} x {product.widthCm || 15} x {product.heightCm || 10} cm
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-blue-700 font-semibold">Thể tích thùng:</span>
                  <span className="font-mono font-black text-blue-700">
                    {product.volumeCbm || 0.003} m³
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhiệt độ bảo quản:</span>
                  <span className="font-medium text-slate-800">
                    {product.storageCondition === 'COOL'
                      ? 'Kho mát (2-8°C)'
                      : product.storageCondition === 'COLD'
                      ? 'Kho đông lạnh (-18°C)'
                      : product.storageCondition === 'SECURE'
                      ? 'Kho khóa bảo mật (Hàng giá trị)'
                      : 'Nhiệt độ phòng (Kho khô)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Giá Nhập & Giá Bán */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Giá Nhập & Giá Bán</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá nhập tham khảo:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatMaskedPrice(product.purchasePrice, canViewCostPrice())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá bán dự kiến:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {formatMaskedPrice(product.sellingPrice, canViewCostPrice())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chênh lệch (Lợi nhuận gộp):</span>
                  <span className="font-mono text-slate-800 font-bold">
                    {formatMaskedPrice((product.sellingPrice || 0) - (product.purchasePrice || 0), canViewCostPrice())}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Tổng giá trị tồn kho:</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {formatMaskedPrice(inventoryValue, canViewCostPrice())}
                  </span>
                </div>
                {!canViewCostPrice() && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded-lg border border-amber-200 mt-1 leading-relaxed">
                    * Giá vốn và biên lợi nhuận được che giấu theo chính sách bảo mật cho nhân viên tác nghiệp kho.
                  </p>
                )}
                {canViewCostPrice() && (
                  <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-50 leading-relaxed">
                    * Giá nhập thực tế được ghi nhận chính xác theo từng hóa đơn nhập kho.
                  </p>
                )}
              </div>
            </div>

            {/* Box 3: Định mức tồn kho */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Tình Trạng Tồn Kho</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tồn tại kho hiện tại:</span>
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
                <div className="flex justify-between">
                  <span className="text-slate-500">Tổng tồn tất cả các kho:</span>
                  <span className="font-mono font-extrabold text-indigo-700">
                    {totalSystemStock.toLocaleString()} {product.unit}
                  </span>
                </div>
                {product.currentStock === 0 && totalSystemStock > 0 && (
                  <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[10.5px] text-amber-800 leading-snug">
                    ℹ️ Sản phẩm hiện có <strong>{totalSystemStock} {product.unit}</strong> tại chi nhánh kho khác trong hệ thống, chưa có hàng tại kho đang chọn.
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Tồn tối thiểu (Báo động):</span>
                  <span className="font-mono text-rose-600 font-bold">{product.safetyStock} {product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngưỡng cần nhập thêm:</span>
                  <span className="font-mono text-amber-600 font-bold">{product.reorderPoint} {product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mức tồn tối đa:</span>
                  <span className="font-mono text-indigo-600 font-bold">{product.maxStock || 500} {product.unit}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
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
                <span className="font-bold text-slate-800">Phương Thức Quản Lý Kho: </span>
                <span className="text-slate-600">
                  Theo Lô: <strong>{product.isBatchManaged !== false ? 'Bắt buộc nhập số Lô' : 'Không bắt buộc'}</strong> | 
                  Hạn sử dụng: <strong>{product.isExpiryManaged !== false ? `${product.shelfLifeDays || 45} ngày` : 'Không áp dụng'}</strong> | 
                  Ưu tiên xuất: <strong className="text-indigo-700">{product.outboundStrategy === 'FEFO' ? 'Hàng cận hạn trước (FEFO)' : 'Nhập trước xuất trước (FIFO)'}</strong>
                </span>
              </div>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold border border-indigo-200">
              Tự động điều phối xuất
            </span>
          </div>

          {/* Box 4: Phân biệt rõ Sản phẩm vs Lô Hàng & Hạn Sử Dụng */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>
                  {product.trackingMethod === 'SERIAL_IMEI'
                    ? 'Danh Sách Thiết Bị & Mã Serial / IMEI'
                    : product.trackingMethod === 'STANDARD'
                    ? 'Số Dư Tồn Kho Tiêu Chuẩn & Vị Trí Kệ'
                    : 'Danh Sách Lô Hàng Đang Lưu Kho & Hạn Sử Dụng'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                {product.trackingMethod === 'SERIAL_IMEI'
                  ? 'Theo dõi mã Serial/IMEI từng máy tại các ô kệ'
                  : product.trackingMethod === 'STANDARD'
                  ? 'Theo dõi số lượng tồn kho theo từng chi nhánh và ô kệ'
                  : 'Theo dõi chi tiết số lô, hạn dùng và kho lưu trữ'}
              </span>
            </div>

            {productBatches.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 italic">
                {product.trackingMethod === 'SERIAL_IMEI'
                  ? 'Hiện chưa có thiết bị / số Serial cụ thể nào được ghi nhận tồn kho cho mặt hàng này.'
                  : 'Hiện chưa có lô hàng cụ thể nào được phân bổ trong kho cho mặt hàng này.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                      <th className="py-2 px-2">Kho Lưu Trữ</th>
                      <th className="py-2 px-2">Số Lô</th>
                      <th className="py-2 px-2">Vị Trí Kệ</th>
                      <th className="py-2 px-2">Hạn Sử Dụng & Tình Trạng</th>
                      <th className="py-2 px-2 text-right">Tồn Thực Tế</th>
                      <th className="py-2 px-2 text-right">Có Thể Xuất</th>
                      <th className="py-2 px-2 text-center">Trạng Thái Xuất</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {productBatches.map((batch, idx) => {
                      const expInfo = getBatchExpiryInfo(batch.expiryDate);
                      const displayAvailableQty = expInfo.isExpired ? 0 : batch.availableQty;

                      return (
                        <tr key={idx} className={`hover:bg-slate-50 ${expInfo.isExpired ? 'bg-rose-50/40' : ''}`}>
                          <td className="py-2 px-2 text-[11px] font-sans font-medium text-slate-700">
                            {getWarehouseName(batch)}
                          </td>
                          <td className="py-2 px-2 font-bold text-indigo-700">
                            {batch.batchNumber || 'BATCH-STD-01'}
                          </td>
                          <td className="py-2 px-2 flex items-center gap-1 text-slate-700">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{batch.locationBarcode || 'Khu Lưu Trữ'}</span>
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
                          <td className={`py-2 px-2 text-right font-bold ${expInfo.isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {displayAvailableQty} {product.unit}
                          </td>
                          <td className="py-2 px-2 text-center">
                            {expInfo.isExpired ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-2xs">
                                Chặn xuất (Hết hạn)
                              </span>
                            ) : expInfo.status === 'EXPIRING_SOON' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Ưu tiên xuất trước
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
