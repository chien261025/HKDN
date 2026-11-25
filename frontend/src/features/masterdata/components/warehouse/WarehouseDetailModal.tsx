import React from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Boxes,
  Layers,
  Thermometer,
  Truck,
  CheckCircle2,
  Radio,
  Pencil,
  ExternalLink,
  ShieldCheck,
  User,
  Maximize2,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { WarehouseItem, WarehouseType, WarehouseRegion } from '../../types';

interface WarehouseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse: WarehouseItem | null;
  isActiveCurrent: boolean;
  onSelectActive: (code: string) => void;
  onEditWarehouse: (wh: WarehouseItem) => void;
}

export const getWarehouseTypeMeta = (type?: WarehouseType) => {
  switch (type) {
    case 'CENTRAL':
      return {
        label: 'Kho Tổng Trung Tâm',
        bg: 'bg-purple-50 text-purple-700 border-purple-200',
        badge: 'Kho Đầu Não',
        desc: 'Trung tâm phân phối đầu não, điều phối xuất nhập hàng toàn chuỗi cung ứng',
      };
    case 'HUB':
      return {
        label: 'Kho Trung Chuyển Liên Vùng',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        badge: 'Hub Vận Tải',
        desc: 'Trung tâm tiếp vận cross-docking, phân tuyến chia chọn hàng luân chuyển nhanh',
      };
    case 'COLD_STORAGE':
      return {
        label: 'Kho Lạnh Chuyên Dụng',
        bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        badge: 'Chuỗi Cung Ứng Lạnh',
        desc: 'Bảo quản nhiệt độ tiêu chuẩn kiểm soát nghiêm ngặt',
      };
    default:
      return {
        label: 'Kho Phân Phối Vùng',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        badge: 'Phân Phối Cấp Vùng',
        desc: 'Kho lưu trữ và phân phối hàng hóa khu vực cho các chi nhánh và đại lý',
      };
  }
};

export const getWarehouseRegionName = (region?: WarehouseRegion) => {
  switch (region) {
    case 'NORTH':
      return 'Khu Vực Miền Bắc';
    case 'CENTRAL_VN':
      return 'Khu Vực Miền Trung';
    case 'MEKONG':
      return 'Khu Vực Tây Nam Bộ';
    case 'SOUTH':
    default:
      return 'Khu Vực Miền Nam';
  }
};

export const WarehouseDetailModal: React.FC<WarehouseDetailModalProps> = ({
  isOpen,
  onClose,
  warehouse,
  isActiveCurrent,
  onSelectActive,
  onEditWarehouse,
}) => {
  if (!isOpen || !warehouse) return null;

  const typeMeta = getWarehouseTypeMeta(warehouse.type);
  const regionName = getWarehouseRegionName(warehouse.region);

  const capacity = warehouse.capacityPallets || 3000;
  const occupancy = warehouse.currentOccupancy !== undefined ? warehouse.currentOccupancy : Math.round(capacity * 0.72);
  const occupancyPct = Math.min(100, Math.round((occupancy / capacity) * 100));

  const isOverloaded = occupancyPct >= 85;
  const isWarning = occupancyPct >= 75 && occupancyPct < 85;

  const zones = warehouse.zonesList && warehouse.zonesList.length > 0
    ? warehouse.zonesList
    : [
        'Khu đệm tiếp nhận & kiểm hàng',
        'Phân khu A: Kệ tiêu chuẩn hàng lưu chuyển nhanh',
        'Phân khu B: Kệ chuyên dụng hàng giá trị cao',
      ];

  const handleGoToLayout = () => {
    onSelectActive(warehouse.code);
    onClose();
    window.location.href = '/layout';
  };

  const handleGoToInventory = () => {
    onSelectActive(warehouse.code);
    onClose();
    window.location.href = '/inventory';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-white shadow-md ring-4 ${
                isActiveCurrent
                  ? 'bg-blue-600 shadow-blue-200 ring-blue-100'
                  : 'bg-slate-700 shadow-slate-200 ring-slate-100'
              }`}
            >
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-100/80 border border-blue-200 px-2 py-0.5 rounded-md">
                  {warehouse.code}
                </span>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeMeta.bg}`}>
                  {typeMeta.label}
                </span>
                <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  {regionName}
                </span>
                {isActiveCurrent && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Đang kích hoạt
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 mt-1">
                {warehouse.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Thanh Tiến Trình Lấp Đầy Kho */}
          <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 flex items-center gap-1.5">
                <Boxes className="w-4 h-4 text-blue-600" />
                <span>Năng Lực Lưu Trữ & Tỷ Lệ Lấp Đầy Hiện Tại</span>
              </span>
              <span className="font-mono font-bold text-slate-900">
                {occupancy.toLocaleString()} / {capacity.toLocaleString()} Pallet ({occupancyPct}%)
              </span>
            </div>

            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverloaded
                    ? 'bg-rose-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${occupancyPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
              <span>Còn trống: <strong className="font-mono text-slate-800">{(capacity - occupancy).toLocaleString()}</strong> pallet</span>
              <span className={`font-semibold ${isOverloaded ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                {isOverloaded
                  ? '⚠️ Cảnh báo sắp quá tải sức chứa'
                  : isWarning
                  ? '⚡ Mức chứa cao, theo dõi điều phối'
                  : '✓ Sức chứa an toàn, sẵn sàng tiếp nhận'}
              </span>
            </div>
          </div>

          {/* 4 Chỉ số nhanh */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-400 block text-[11px]">Diện tích sàn</span>
              <span className="font-extrabold text-slate-900 text-sm font-mono mt-0.5 block">
                {(warehouse.areaM2 || 7500).toLocaleString()} m²
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-400 block text-[11px]">Số cửa giao nhận</span>
              <span className="font-extrabold text-blue-600 text-sm font-mono mt-0.5 block">
                {warehouse.dockCount || 6} Cửa xe
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-400 block text-[11px]">Số phân khu</span>
              <span className="font-extrabold text-indigo-600 text-sm font-mono mt-0.5 block">
                {warehouse.totalZones || zones.length} Khu
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center">
              <span className="text-slate-400 block text-[11px]">Nhiệt độ chuẩn</span>
              <span className="font-bold text-slate-800 text-[11px] mt-0.5 block truncate" title={warehouse.temperatureRange || '18°C - 25°C'}>
                {warehouse.temperatureRange?.split('(')[0].trim() || '18°C - 25°C'}
              </span>
            </div>
          </div>

          {/* 2 Khối thông tin đối xứng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Thông tin hành chính & liên hệ */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Thông Tin Địa Điểm & Quản Lý</span>
              </span>

              <div className="space-y-1.5 text-slate-600">
                <div>
                  <span className="text-slate-400 text-[11px] block">Địa chỉ chi nhánh:</span>
                  <p className="font-medium text-slate-900 text-xs mt-0.5">{warehouse.address || 'Chưa cập nhật'}</p>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400">Trưởng kho phụ trách:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">{warehouse.managerName || 'Trần Trưởng Kho'}</span>
                    {warehouse.managerUsername && (
                      <span className="font-mono text-[11px] text-blue-600">@{warehouse.managerUsername}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hotline điều hành:</span>
                  <span className="font-mono font-bold text-slate-900">{warehouse.contactPhone || warehouse.managerPhone || 'Chưa có SĐT'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trạng thái vận hành:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    Đang mở cửa xuất nhập
                  </span>
                </div>
              </div>
            </div>

            {/* Danh sách phân khu Zone */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Danh Mục Phân Khu Chức Năng (Zones)</span>
              </span>

              <div className="space-y-1.5">
                {zones.map((z, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-slate-800 truncate mr-2">{z}</span>
                    <span className="font-mono text-2xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded shrink-0">
                      Zone {String.fromCharCode(65 + idx)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Chi nhánh kho đang hoạt động ổn định, sẵn sàng tiếp nhận đơn nhập, xuất và kiểm kê theo phân quyền chi nhánh.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {!isActiveCurrent ? (
              <button
                type="button"
                onClick={() => {
                  onSelectActive(warehouse.code);
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Chọn Làm Kho Làm Việc Hiện Tại</span>
              </button>
            ) : (
              <span className="px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đang là kho làm việc hiện tại</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                onEditWarehouse(warehouse);
              }}
              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Chỉnh sửa thông tin chi nhánh"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Chỉnh Sửa</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGoToLayout}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Xem trực quan sơ đồ 2D ô kệ"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Sơ Đồ Ô Kệ</span>
              <ArrowRight className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={handleGoToInventory}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Tra cứu số dư và vị trí tồn kho chi nhánh"
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Tồn Kho</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

