import React from 'react';
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
} from 'lucide-react';
import { ProductItem } from '../types';
import { getCategoryBadge, getZoneBadge } from '../utils/productBadges';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  onEditProduct: (product: ProductItem) => void;
  onPrintBarcode: (product: ProductItem) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  onEditProduct,
  onPrintBarcode,
}) => {
  if (!isOpen || !product) return null;

  const isUnderSafety = product.currentStock <= product.safetyStock;
  const isUnderReorder = product.currentStock <= product.reorderPoint && !isUnderSafety;
  const inventoryValue = product.currentStock * (product.purchasePrice || 0);

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
                <h2 className="text-lg font-bold text-slate-900">Hồ Sơ Kỹ Thuật Mặt Hàng (Master Data)</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold border border-blue-200">
                  {product.sku}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Quy cách đóng gói, thông số kích thước CBM, giá vốn & ngưỡng tồn kho
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
                      'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300';
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
                <div>
                  <span className="text-slate-400">Nhà cung cấp:</span>{' '}
                  <span className="font-semibold text-slate-800">{product.supplierName}</span>
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <Barcode className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-bold text-slate-800">{product.barcode}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3 Grid Sections */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Quy cách & Kích thước CBM */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                <Ruler className="w-4 h-4 text-blue-600" />
                <span>Quy Cách & Thể Tích CBM</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Đơn vị tính:</span>
                  <span className="font-bold text-slate-900">{product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trọng lượng net:</span>
                  <span className="font-bold text-slate-900">{product.weightKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kích thước (DxRxC):</span>
                  <span className="font-mono text-slate-800">
                    {product.lengthCm || 20} x {product.widthCm || 15} x {product.heightCm || 10} cm
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-blue-700 font-semibold">Thể tích CBM:</span>
                  <span className="font-mono font-black text-blue-700">
                    {product.volumeCbm || 0.003} m³
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Điều kiện lưu kho:</span>
                  <span className="font-medium text-slate-800">
                    {product.storageCondition === 'COOL'
                      ? 'Kho mát 2-8°C'
                      : product.storageCondition === 'COLD'
                      ? 'Đông lạnh (-18°C)'
                      : product.storageCondition === 'SECURE'
                      ? 'Kho khóa bảo mật'
                      : 'Nhiệt độ phòng (Ambient)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Giá Cả & Tài Chính */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Tài Chính & Định Giá</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá vốn / Giá nhập:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {(product.purchasePrice || 0).toLocaleString()} ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá xuất / Giá bán:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {(product.sellingPrice || 0).toLocaleString()} ₫
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Chênh lệch giá:</span>
                  <span className="font-mono text-slate-800">
                    {((product.sellingPrice || 0) - (product.purchasePrice || 0)).toLocaleString()} ₫
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Tổng giá trị tồn kho:</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {inventoryValue.toLocaleString()} ₫
                  </span>
                </div>
              </div>
            </div>

            {/* Box 3: Định mức tồn kho */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Kiểm Soát Tồn Kho</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tồn hiện tại:</span>
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
                  <span className="text-slate-500">Tồn an toàn (Min):</span>
                  <span className="font-mono text-rose-600">{product.safetyStock} {product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Điểm đặt hàng (ROP):</span>
                  <span className="font-mono text-amber-600">{product.reorderPoint} {product.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tồn tối đa (Max):</span>
                  <span className="font-mono text-indigo-600">{product.maxStock || 500} {product.unit}</span>
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
              <span>In Tem Nhãn Barcode & QR</span>
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
