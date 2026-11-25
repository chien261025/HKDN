import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Boxes,
  CheckCircle2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Radio,
  ExternalLink,
  Search,
  Filter,
  X,
  LayoutGrid,
  Table as TableIcon,
  Pencil,
  Eye,
  AlertCircle,
  Truck,
  Thermometer,
  RotateCcw,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { WarehouseItem, WarehouseType, WarehouseRegion } from '../types';
import { warehouseService } from '../services/warehouseService';
import { userService } from '../../users/services/userService';
import { UserAccount } from '../../users/types';
import { CreateWarehouseModal } from '../components/warehouse/CreateWarehouseModal';
import {
  WarehouseDetailModal,
  getWarehouseTypeMeta,
  getWarehouseRegionName,
} from '../components/warehouse/WarehouseDetailModal';

type KpiFilter = 'ALL' | 'ACTIVE' | 'HIGH_OCCUPANCY' | 'REGION_NORTH' | 'REGION_CENTRAL' | 'REGION_SOUTH';

interface ToastState {
  type: 'success' | 'info' | 'error';
  message: string;
}

export const WarehousesManagementPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<WarehouseItem[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserAccount[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string>(() => warehouseService.getActiveWarehouseId());
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [kpiFilter, setKpiFilter] = useState<KpiFilter>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseItem | null>(null);
  const [viewingDetailWarehouse, setViewingDetailWarehouse] = useState<WarehouseItem | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchWarehouses = async () => {
    setLoading(true);
    const list = await warehouseService.getWarehouses();
    setWarehouses(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchWarehouses();
    userService.getAllUsers().then((res) => setAvailableUsers(res)).catch(() => {});

    const handleUpdated = () => {
      fetchWarehouses();
      setActiveWarehouseId(warehouseService.getActiveWarehouseId());
    };
    const handleChanged = (e: any) => {
      setActiveWarehouseId(e.detail || warehouseService.getActiveWarehouseId());
    };

    window.addEventListener('smart_wms_warehouses_updated', handleUpdated);
    window.addEventListener('smart_wms_warehouse_changed', handleChanged);

    return () => {
      window.removeEventListener('smart_wms_warehouses_updated', handleUpdated);
      window.removeEventListener('smart_wms_warehouse_changed', handleChanged);
    };
  }, []);

  const handleSelectActive = (codeOrId: string) => {
    warehouseService.setActiveWarehouseId(codeOrId);
    setActiveWarehouseId(codeOrId);
    const target = warehouses.find((w) => w.code === codeOrId || String(w.id) === codeOrId);
    setToast({
      type: 'success',
      message: `Đã kích hoạt kho ${target ? target.name : codeOrId} làm phạm vi làm việc của toàn hệ thống!`,
    });
  };

  const handleSaveWarehouse = async (
    data: Partial<WarehouseItem> & {
      newManagerAccount?: {
        username: string;
        fullName: string;
        email: string;
        phone: string;
        password?: string;
      };
    }
  ) => {
    let assignedManagerId = data.managerId;
    let assignedManagerUsername = data.managerUsername;
    let assignedManagerName = data.managerName;
    let assignedManagerPhone = data.managerPhone || data.contactPhone;

    // Nếu người dùng bổ nhiệm Trưởng kho mới (ví dụ: Khánh Kelvin):
    if (data.newManagerAccount) {
      try {
        const createdUser = await userService.createUser({
          username: data.newManagerAccount.username,
          password: data.newManagerAccount.password || '123456',
          fullName: data.newManagerAccount.fullName,
          email: data.newManagerAccount.email,
          phone: data.newManagerAccount.phone,
          role: 'ROLE_WAREHOUSE_MANAGER',
          assignedWarehouse: data.name,
        });
        assignedManagerId = createdUser.id;
        assignedManagerUsername = createdUser.username;
        assignedManagerName = createdUser.fullName;
        assignedManagerPhone = createdUser.phone || data.newManagerAccount.phone;
        setToast({
          type: 'success',
          message: `Đã khai báo kho ${data.name} và tự động khởi tạo tài khoản quản lý @${createdUser.username} thành công!`,
        });
      } catch (err: any) {
        console.warn('Auto-create manager account error:', err);
        assignedManagerUsername = data.newManagerAccount.username;
        assignedManagerName = data.newManagerAccount.fullName;
        assignedManagerPhone = data.newManagerAccount.phone;
        setToast({
          type: 'success',
          message: `Đã khai báo kho ${data.name} và liên kết với tài khoản quản lý @${data.newManagerAccount.username}!`,
        });
      }
    }

    const warehousePayload = {
      ...data,
      managerId: assignedManagerId,
      managerUsername: assignedManagerUsername,
      managerName: assignedManagerName,
      managerPhone: assignedManagerPhone,
    };

    if (data.id) {
      await warehouseService.updateWarehouse(data.id, warehousePayload);
      if (!data.newManagerAccount) {
        setToast({
          type: 'success',
          message: `Đã cập nhật thông tin chi nhánh kho ${data.name} thành công!`,
        });
      }
    } else {
      const created = await warehouseService.createWarehouse(warehousePayload);
      if (!data.newManagerAccount) {
        setToast({
          type: 'success',
          message: `Khai báo chi nhánh kho mới ${created.name} (${created.code}) thành công!`,
        });
      }
    }

    await fetchWarehouses();
    const updatedUsers = await userService.getAllUsers().catch(() => []);
    setAvailableUsers(updatedUsers);
    setIsCreateOpen(false);
    setEditingWarehouse(null);
  };

  /** Tự động đối chiếu nhân sự Trưởng Kho từ Danh Mục Nhân Sự theo vai trò & kho phụ trách */
  const resolveWarehouseManager = (wh: WarehouseItem) => {
    // 1. Khớp theo username hoặc ID người dùng nếu có
    if (wh.managerUsername) {
      const u = availableUsers.find((usr) => usr.username.toLowerCase() === wh.managerUsername?.toLowerCase());
      if (u) {
        return {
          managerName: u.fullName,
          managerUsername: u.username,
          managerPhone: u.phone || wh.managerPhone || wh.contactPhone || '0908000001',
          managerId: u.id,
        };
      }
    }

    // 2. Nếu tên trưởng kho được chỉ định rõ (như Khánh Kelvin) và khác fallback mặc định
    if (wh.managerName && wh.managerName !== 'Trần Trưởng Kho') {
      const u = availableUsers.find((usr) => usr.fullName.toLowerCase() === wh.managerName?.toLowerCase());
      return {
        managerName: wh.managerName,
        managerUsername: u?.username || wh.managerUsername,
        managerPhone: u?.phone || wh.managerPhone || wh.contactPhone || '0908000001',
        managerId: u?.id || wh.managerId,
      };
    }

    // 3. Khớp theo kho phụ trách (assignedWarehouse) trong danh sách người dùng khả dụng
    const matchedUser = availableUsers.find((u) => {
      const assigned = (u.assignedWarehouse || u.primaryWarehouse || '').toLowerCase();
      const whName = wh.name.toLowerCase();
      const whShort = (wh.shortName || '').toLowerCase();
      const whCode = wh.code.toLowerCase();
      return (
        assigned &&
        (assigned.includes(whName) ||
          whName.includes(assigned) ||
          (whShort && assigned.includes(whShort)) ||
          assigned.includes(whCode))
      );
    });

    if (matchedUser) {
      return {
        managerName: matchedUser.fullName,
        managerUsername: matchedUser.username,
        managerPhone: matchedUser.phone || wh.managerPhone || wh.contactPhone,
        managerId: matchedUser.id,
      };
    }

    // 4. Mặc định theo mã kho chuẩn
    return {
      managerName: wh.managerName || (wh.code === 'WH02' ? 'Quản Trị Viên 1' : wh.code === 'WH03' ? 'Nguyễn Quản Trị' : 'Trần Trưởng Kho'),
      managerUsername: wh.managerUsername || (wh.code === 'WH02' ? 'admin1' : wh.code === 'WH03' ? 'admin' : 'manager01'),
      managerPhone: wh.managerPhone || wh.contactPhone || '0900 000 002',
      managerId: wh.managerId,
    };
  };

  // KPI calculations
  const totalWarehouses = warehouses.length;
  const activeCount = warehouses.filter((w) => w.isActive !== false).length;
  const totalCapacity = warehouses.reduce((acc, w) => acc + (w.capacityPallets || 3000), 0);
  const totalOccupancy = warehouses.reduce((acc, w) => {
    const cap = w.capacityPallets || 3000;
    const occ = w.currentOccupancy !== undefined ? w.currentOccupancy : Math.round(cap * 0.72);
    return acc + occ;
  }, 0);
  const networkOccupancyPct = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  const northCount = warehouses.filter((w) => w.region === 'NORTH').length;
  const centralCount = warehouses.filter((w) => w.region === 'CENTRAL_VN').length;
  const southCount = warehouses.filter((w) => w.region === 'SOUTH' || w.region === 'MEKONG' || !w.region).length;

  const highOccupancyCount = warehouses.filter((w) => {
    const cap = w.capacityPallets || 3000;
    const occ = w.currentOccupancy !== undefined ? w.currentOccupancy : Math.round(cap * 0.72);
    return occ / cap >= 0.75;
  }).length;

  // Filter logic
  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      // 1. KPI Filter
      if (kpiFilter === 'ACTIVE' && wh.isActive === false) return false;
      if (kpiFilter === 'HIGH_OCCUPANCY') {
        const cap = wh.capacityPallets || 3000;
        const occ = wh.currentOccupancy !== undefined ? wh.currentOccupancy : Math.round(cap * 0.72);
        if (occ / cap < 0.75) return false;
      }
      if (kpiFilter === 'REGION_NORTH' && wh.region !== 'NORTH') return false;
      if (kpiFilter === 'REGION_CENTRAL' && wh.region !== 'CENTRAL_VN') return false;
      if (kpiFilter === 'REGION_SOUTH' && wh.region !== 'SOUTH' && wh.region !== 'MEKONG') return false;

      // 2. Search Term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const mgr = resolveWarehouseManager(wh);
        const matchCode = wh.code.toLowerCase().includes(q);
        const matchName = wh.name.toLowerCase().includes(q);
        const matchAddr = (wh.address || '').toLowerCase().includes(q);
        const matchManager = (mgr.managerName || '').toLowerCase().includes(q);
        const matchUsername = (mgr.managerUsername || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchAddr && !matchManager && !matchUsername) return false;
      }

      // 3. Region Filter Dropdown
      if (selectedRegion !== 'ALL') {
        if (selectedRegion === 'SOUTH' && wh.region !== 'SOUTH' && wh.region !== 'MEKONG') return false;
        if (selectedRegion !== 'SOUTH' && wh.region !== selectedRegion) return false;
      }

      // 4. Type Filter Dropdown
      if (selectedType !== 'ALL' && wh.type !== selectedType) return false;

      // 5. Status Filter Dropdown
      if (selectedStatus === 'ACTIVE' && wh.isActive === false) return false;
      if (selectedStatus === 'INACTIVE' && wh.isActive !== false) return false;

      return true;
    });
  }, [warehouses, kpiFilter, searchTerm, selectedRegion, selectedType, selectedStatus]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    selectedRegion !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    kpiFilter !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedRegion('ALL');
    setSelectedType('ALL');
    setSelectedStatus('ALL');
    setKpiFilter('ALL');
  };

  const handleSelectKpiFilter = (filter: KpiFilter) => {
    setKpiFilter((prev) => (prev === filter ? 'ALL' : filter));
  };

  const activeWarehouse = warehouses.find(
    (w) => w.code === activeWarehouseId || String(w.id) === String(activeWarehouseId)
  );

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 ring-4 ring-blue-50 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                Hệ Thống Chi Nhánh Kho & Trung Tâm Phân Phối
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 font-mono">
                {warehouses.length} Kho Toàn Quốc
              </span>
              {activeWarehouse && (
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đang làm việc: {activeWarehouse.shortName || activeWarehouse.name}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1">
              Quản lý mạng lưới kho tổng, kho phân phối vùng, trung tâm trung chuyển liên vùng và năng lực lưu trữ toàn chuỗi
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'GRID'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ xem dạng lưới thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Thẻ Kho</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'TABLE'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Chế độ xem bảng danh mục chi tiết"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Bảng Danh Mục</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingWarehouse(null);
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-200 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Chi Nhánh Kho Mới</span>
          </button>
        </div>
      </div>

      {/* 4 Interactive KPI Cards (Click to filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Tổng chi nhánh */}
        <button
          type="button"
          onClick={() => handleSelectKpiFilter('ALL')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            kpiFilter === 'ALL'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-100'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Tổng Chi Nhánh
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">
                {totalWarehouses}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Bắc - Trung - Nam</span>
            {kpiFilter === 'ALL' && <span className="font-bold text-blue-600">Đang chọn</span>}
          </div>
        </button>

        {/* Card 2: Đang hoạt động */}
        <button
          type="button"
          onClick={() => handleSelectKpiFilter('ACTIVE')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            kpiFilter === 'ACTIVE'
              ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-100'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block">
                Đang Hoạt Động
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-1.5 tabular-nums">
                {activeCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-emerald-600 flex items-center justify-between font-medium">
            <span>100% Sẵn sàng xuất nhập</span>
            {kpiFilter === 'ACTIVE' && <span className="font-bold">Đang lọc</span>}
          </div>
        </button>

        {/* Card 3: Tỷ lệ lấp đầy toàn mạng lưới */}
        <button
          type="button"
          onClick={() => handleSelectKpiFilter('HIGH_OCCUPANCY')}
          className={`p-4 sm:p-5 rounded-2xl border text-left transition-all cursor-pointer shadow-xs ${
            kpiFilter === 'HIGH_OCCUPANCY'
              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-100'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
                Tỷ Lệ Lấp Đầy Kho
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono mt-1.5 tabular-nums">
                {networkOccupancyPct}%
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between font-mono">
            <span>{totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()} Pallet</span>
            {highOccupancyCount > 0 && (
              <span className="text-amber-600 font-semibold">{highOccupancyCount} kho cao</span>
            )}
          </div>
        </button>

        {/* Card 4: Mạng lưới 3 miền */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider block">
                Mạng Lưới Vùng Miền
              </span>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 mt-1 flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleSelectKpiFilter('REGION_NORTH')}
                  className={`px-2 py-0.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                    kpiFilter === 'REGION_NORTH' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Bắc ({northCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectKpiFilter('REGION_CENTRAL')}
                  className={`px-2 py-0.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                    kpiFilter === 'REGION_CENTRAL' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Trung ({centralCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectKpiFilter('REGION_SOUTH')}
                  className={`px-2 py-0.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                    kpiFilter === 'REGION_SOUTH' ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Nam ({southCount})
                </button>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-xs text-indigo-600 font-medium">Bấm vào từng miền để lọc nhanh</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã kho (WH01...), tên chi nhánh, địa chỉ tỉnh thành hoặc trưởng kho..."
            className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Region */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Vùng miền:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="NORTH">Miền Bắc</option>
              <option value="CENTRAL_VN">Miền Trung</option>
              <option value="SOUTH">Miền Nam</option>
            </select>
          </div>

          {/* Type */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Loại hình:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="CENTRAL">Kho Tổng</option>
              <option value="DISTRIBUTION">Kho Phân Phối</option>
              <option value="HUB">Kho Trung Chuyển</option>
              <option value="COLD_STORAGE">Kho Lạnh</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <span className="text-slate-400 font-medium">Trạng thái:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Tạm dừng bảo trì</option>
            </select>
          </div>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              title="Đặt lại toàn bộ bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Status Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Hiển thị <strong className="font-bold text-slate-900">{filteredWarehouses.length}</strong> / {warehouses.length} chi nhánh kho
        </span>
        {hasActiveFilters && (
          <span className="text-blue-600 font-medium">
            (Đang lọc dữ liệu theo tiêu chí tìm kiếm)
          </span>
        )}
      </div>

      {/* Main Content View */}
      {filteredWarehouses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">Không tìm thấy chi nhánh kho phù hợp</h3>
          <p className="text-xs text-slate-400">
            Hãy thử tìm kiếm với từ khóa khác hoặc bấm nút đặt lại bộ lọc.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Đặt lại toàn bộ lọc
          </button>
        </div>
      ) : viewMode === 'GRID' ? (
        /* GRID VIEW: Thẻ Kho Trực Quan Doanh Nghiệp */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredWarehouses.map((wh) => {
            const typeMeta = getWarehouseTypeMeta(wh.type);
            const regionName = getWarehouseRegionName(wh.region);
            const isSelected = activeWarehouseId === wh.code || activeWarehouseId === String(wh.id);

            const capacity = wh.capacityPallets || 3000;
            const occupancy = wh.currentOccupancy !== undefined ? wh.currentOccupancy : Math.round(capacity * 0.72);
            const occupancyPct = Math.min(100, Math.round((occupancy / capacity) * 100));

            const isOverloaded = occupancyPct >= 85;
            const isWarning = occupancyPct >= 75 && occupancyPct < 85;

            return (
              <div
                key={wh.id}
                className={`bg-white rounded-3xl border p-5 transition-all relative overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/15'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Active Indicator Top Ribbon */}
                {isSelected && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl shadow-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Kho Đang Được Chọn Làm Việc</span>
                  </div>
                )}

                <div>
                  {/* Header Row: Icon, Code, Type, Name */}
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Building2 className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0 pr-12">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {wh.code}
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${typeMeta.bg}`}>
                          {typeMeta.label}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          {regionName.replace('Khu Vực ', '')}
                        </span>
                      </div>

                      <h3
                        onClick={() => setViewingDetailWarehouse(wh)}
                        className="text-base font-extrabold text-slate-900 mt-1.5 truncate hover:text-blue-600 transition-colors cursor-pointer"
                        title={`${wh.name}\n(Bấm để xem chi tiết hồ sơ kho)`}
                      >
                        {wh.name}
                      </h3>
                    </div>
                  </div>

                  {/* Chi tiết địa điểm & nhân sự quản lý */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{wh.address || 'Chưa cập nhật địa chỉ thực địa'}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 flex-wrap gap-2 pt-0.5">
                      {(() => {
                        const mgr = resolveWarehouseManager(wh);
                        return (
                          <>
                            <div className="flex items-center gap-1.5 font-medium">
                              <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>Trưởng kho: <strong className="text-slate-900 font-semibold">{mgr.managerName}</strong></span>
                              {mgr.managerUsername && (
                                <span className="text-[11px] font-mono text-blue-600">(@{mgr.managerUsername})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 font-mono text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{mgr.managerPhone}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Năng lực mặt bằng & Cửa tiếp vận Dock */}
                  <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-center text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Mặt Bằng</span>
                      <strong className="text-slate-900 font-mono text-xs">{(wh.areaM2 || 7500).toLocaleString()} m²</strong>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="text-slate-400 text-[10px] block">Cửa Xe</span>
                      <strong className="text-blue-600 font-mono text-xs">{wh.dockCount || 6} cửa</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Phân Khu</span>
                      <strong className="text-indigo-600 font-mono text-xs">{wh.totalZones || 3} khu</strong>
                    </div>
                  </div>

                  {/* Thanh Tiến Trình Tỷ Lệ Lấp Đầy Kho */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Sức chứa lưu trữ:</span>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {occupancy.toLocaleString()} / {capacity.toLocaleString()} Pallet ({occupancyPct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverloaded
                            ? 'bg-rose-500'
                            : isWarning
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Multi-Action Toolbar */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Xem chi tiết */}
                    <button
                      type="button"
                      onClick={() => {
                        const mgr = resolveWarehouseManager(wh);
                        setViewingDetailWarehouse({ ...wh, ...mgr });
                      }}
                      className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-200 transition-colors cursor-pointer"
                      title="Xem toàn bộ hồ sơ chi tiết kho"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Chuyển sang Sơ đồ ô kệ */}
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectActive(wh.code);
                        window.location.href = '/layout';
                      }}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                      title="Mở sơ đồ mặt bằng ô kệ 2D của kho này"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>

                    {/* Chỉnh sửa */}
                    <button
                      type="button"
                      onClick={() => {
                        const mgr = resolveWarehouseManager(wh);
                        setEditingWarehouse({ ...wh, ...mgr });
                        setIsCreateOpen(true);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      title="Chỉnh sửa thông tin chi nhánh"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Nút Kích Hoạt Làm Việc */}
                  <button
                    type="button"
                    onClick={() => handleSelectActive(wh.code)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span>{isSelected ? 'Đang kích hoạt' : 'Chọn chi nhánh này'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW: Bảng Danh Mục Doanh Nghiệp Chuẩn Mực */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã & Tên Chi Nhánh</th>
                  <th className="py-3 px-4">Vùng Miền</th>
                  <th className="py-3 px-4">Người Phụ Trách & SĐT</th>
                  <th className="py-3 px-4">Mặt Bằng & Cửa Giao Nhận</th>
                  <th className="py-3 px-4">Sức Chứa & Lấp Đầy</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredWarehouses.map((wh) => {
                  const typeMeta = getWarehouseTypeMeta(wh.type);
                  const isSelected = activeWarehouseId === wh.code || activeWarehouseId === String(wh.id);
                  const capacity = wh.capacityPallets || 3000;
                  const occupancy = wh.currentOccupancy !== undefined ? wh.currentOccupancy : Math.round(capacity * 0.72);
                  const occupancyPct = Math.min(100, Math.round((occupancy / capacity) * 100));

                  return (
                    <tr
                      key={wh.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => setViewingDetailWarehouse(wh)}
                            className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs flex items-center justify-center border border-blue-200 shrink-0 hover:bg-blue-100 cursor-pointer"
                          >
                            {wh.code}
                          </button>
                          <div>
                            <button
                              type="button"
                              onClick={() => setViewingDetailWarehouse(wh)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left cursor-pointer"
                            >
                              {wh.name}
                            </button>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${typeMeta.bg}`}>
                                {typeMeta.label}
                              </span>
                              {isSelected && (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                  ✓ Đang chọn
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {getWarehouseRegionName(wh.region).replace('Khu Vực ', '')}
                      </td>

                      <td className="py-3.5 px-4">
                        {(() => {
                          const mgr = resolveWarehouseManager(wh);
                          return (
                            <>
                              <div className="font-semibold text-slate-900">{mgr.managerName}</div>
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-600">
                                {mgr.managerUsername && <span>@{mgr.managerUsername}</span>}
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-500">{mgr.managerPhone}</span>
                              </div>
                            </>
                          );
                        })()}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-slate-900">
                          {(wh.areaM2 || 7500).toLocaleString()} m²
                        </div>
                        <div className="text-[11px] text-blue-600 font-medium">
                          {wh.dockCount || 6} cửa xe • {wh.totalZones || 3} phân khu
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {occupancy.toLocaleString()} / {capacity.toLocaleString()} Pallet ({occupancyPct}%)
                        </div>
                        <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden mt-1 border border-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              occupancyPct >= 85
                                ? 'bg-rose-500'
                                : occupancyPct >= 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${occupancyPct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Hoạt động
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const mgr = resolveWarehouseManager(wh);
                              setViewingDetailWarehouse({ ...wh, ...mgr });
                            }}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 cursor-pointer"
                            title="Xem chi tiết hồ sơ kho"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectActive(wh.code);
                              window.location.href = '/layout';
                            }}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 cursor-pointer"
                            title="Sơ đồ mặt bằng ô kệ"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const mgr = resolveWarehouseManager(wh);
                              setEditingWarehouse({ ...wh, ...mgr });
                              setIsCreateOpen(true);
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 cursor-pointer"
                            title="Chỉnh sửa kho"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectActive(wh.code)}
                            className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200'
                            }`}
                          >
                            {isSelected ? 'Đang chọn' : 'Chọn'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Warehouse Detail Modal */}
      <WarehouseDetailModal
        isOpen={!!viewingDetailWarehouse}
        onClose={() => setViewingDetailWarehouse(null)}
        warehouse={viewingDetailWarehouse}
        isActiveCurrent={
          !!viewingDetailWarehouse &&
          (activeWarehouseId === viewingDetailWarehouse.code ||
            activeWarehouseId === String(viewingDetailWarehouse.id))
        }
        onSelectActive={handleSelectActive}
        onEditWarehouse={(wh) => {
          setEditingWarehouse(wh);
          setIsCreateOpen(true);
        }}
      />

      {/* Create / Edit Warehouse Modal */}
      <CreateWarehouseModal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingWarehouse(null);
        }}
        onSaveWarehouse={handleSaveWarehouse}
        editingWarehouse={editingWarehouse}
        existingWarehouses={warehouses}
        availableUsers={availableUsers}
      />
    </div>
  );
};
