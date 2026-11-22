import { apiClient } from '../../../services/api';
import { WarehouseItem } from '../types';

const STORAGE_KEY = 'smart_wms_warehouses_list_v2';
const MANAGER_META_KEY = 'smart_wms_warehouse_managers_meta';

export const getStoredManagerMeta = (): Record<string, { managerName: string; managerUsername?: string; managerPhone?: string; managerId?: string | number }> => {
  try {
    const raw = localStorage.getItem(MANAGER_META_KEY);
    return raw ? JSON.parse(raw) : {
      'WH01': { managerName: 'Trần Trưởng Kho', managerUsername: 'manager01', managerPhone: '0900 000 002', managerId: 2 },
      'WH02': { managerName: 'Quản Trị Viên 1', managerUsername: 'admin1', managerPhone: '0900 000 004', managerId: 4 },
      'WH03': { managerName: 'Nguyễn Quản Trị', managerUsername: 'admin', managerPhone: '0900 000 001', managerId: 1 },
      'WH04': { managerName: 'Trần Trưởng Kho', managerUsername: 'manager01', managerPhone: '0900 000 002', managerId: 2 },
      'WH0': { managerName: 'Khánh Kelvin', managerUsername: 'khanhkelvin', managerPhone: '0908000001', managerId: 105 },
      'WH05': { managerName: 'Khánh Kelvin', managerUsername: 'khanhkelvin', managerPhone: '0908000001', managerId: 105 },
    };
  } catch {
    return {};
  }
};

export const setStoredManagerMeta = (code: string, meta: { managerName: string; managerUsername?: string; managerPhone?: string; managerId?: string | number }) => {
  try {
    const data = getStoredManagerMeta();
    data[code] = meta;
    localStorage.setItem(MANAGER_META_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving manager meta:', e);
  }
};

export const cleanWarehouseString = (str: string = ''): string => {
  if (!str) return '';
  if (str.includes('Tá»•ng') || str.includes('TÃ¢n BÃ¬nh')) return 'Kho Tổng Tân Bình - TP.HCM';
  if (str.includes('PhÃ¢n Phá»') || str.includes('Báº¯c Ninh')) return 'Kho Phân Phối VSIP Bắc Ninh';
  if (str.includes('Váº­n') || str.includes('Náºµng')) return 'Kho Vận Miền Trung - Đà Nẵng';
  if (str.includes('Trung Chuyá»') || str.includes('BÃ¬nh DÆ°Æ¡ng')) return 'Kho Trung Chuyển Sóng Thần - Bình Dương';
  if (str.includes('Quy Nh') || str.includes('Quy Nh?n')) return 'Kho Quy Nhơn';
  if (str.includes('TrÆ°á»')) return '102 Trường Chinh, P.12, Q.Tân Bình, TP.HCM';
  if (str.includes('Há»¯u Nghá»‹')) return 'Đại lộ Hữu Nghị, KCN VSIP, Từ Sơn, Bắc Ninh';
  if (str.includes('HÃ²a KhÃ¡nh')) return 'Đường số 3, KCN Hòa Khánh, Liên Chiểu, TP. Đà Nẵng';
  if (str.includes('SÃ³ng Tháº§n')) return 'KCN Sóng Thần 1, Dĩ An, Bình Dương';
  return str;
};

export const DEFAULT_WAREHOUSES: WarehouseItem[] = [
  {
    id: 1,
    code: 'WH01',
    name: 'Kho Tổng Tân Bình - TP.HCM',
    shortName: 'Kho Tân Bình',
    region: 'SOUTH',
    type: 'CENTRAL',
    managerId: 2,
    managerUsername: 'manager01',
    managerName: 'Trần Trưởng Kho',
    managerPhone: '0900 000 002',
    address: '102 Trường Chinh, P.12, Q.Tân Bình, TP.HCM',
    contactPhone: '028 3811 2233',
    capacityPallets: 5000,
    currentOccupancy: 3650,
    areaM2: 10500,
    dockCount: 8,
    totalZones: 4,
    temperatureRange: '18°C - 25°C (Kho Tiêu Chuẩn)',
    zonesList: [
      'Khu đệm tiếp nhận & kiểm hàng',
      'Phân khu A: Hàng tiêu dùng nhanh',
      'Phân khu B: Hàng giá trị cao & niêm phong',
      'Phân khu C: Kệ Drive-in hàng nặng'
    ],
    isActive: true,
  },
  {
    id: 2,
    code: 'WH02',
    name: 'Kho Phân Phối VSIP Bắc Ninh',
    shortName: 'Kho Bắc Ninh',
    region: 'NORTH',
    type: 'DISTRIBUTION',
    managerId: 4,
    managerUsername: 'admin1',
    managerName: 'Quản Trị Viên 1',
    managerPhone: '0900 000 004',
    address: 'Đại lộ Hữu Nghị, KCN VSIP, Từ Sơn, Bắc Ninh',
    contactPhone: '0222 388 9900',
    capacityPallets: 3200,
    currentOccupancy: 2150,
    areaM2: 7200,
    dockCount: 6,
    totalZones: 3,
    temperatureRange: '18°C - 25°C (Kho Tiêu Chuẩn)',
    zonesList: [
      'Khu đệm tiếp nhận & kiểm hàng',
      'Phân khu A: Hàng linh kiện điện tử',
      'Phân khu B: Phụ tùng công nghiệp'
    ],
    isActive: true,
  },
  {
    id: 3,
    code: 'WH03',
    name: 'Kho Vận Miền Trung - Đà Nẵng',
    shortName: 'Kho Đà Nẵng',
    region: 'CENTRAL_VN',
    type: 'HUB',
    managerId: 1,
    managerUsername: 'admin',
    managerName: 'Nguyễn Quản Trị',
    managerPhone: '0900 000 001',
    address: 'Đường số 3, KCN Hòa Khánh, Liên Chiểu, TP. Đà Nẵng',
    contactPhone: '0236 377 6688',
    capacityPallets: 2500,
    currentOccupancy: 1480,
    areaM2: 5800,
    dockCount: 4,
    totalZones: 3,
    temperatureRange: '18°C - 25°C (Kho Tiêu Chuẩn)',
    zonesList: [
      'Khu tiếp nhận trung chuyển',
      'Phân khu A: Hàng bách hóa tiêu dùng',
      'Phân khu B: Hàng tạm lưu phân tuyến'
    ],
    isActive: true,
  },
  {
    id: 4,
    code: 'WH04',
    name: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    shortName: 'Kho Bình Dương',
    region: 'SOUTH',
    type: 'HUB',
    managerId: 2,
    managerUsername: 'manager01',
    managerName: 'Trần Trưởng Kho',
    managerPhone: '0900 000 002',
    address: 'KCN Sóng Thần 1, Dĩ An, Bình Dương',
    contactPhone: '0274 379 1234',
    capacityPallets: 4000,
    currentOccupancy: 3280,
    areaM2: 8900,
    dockCount: 8,
    totalZones: 3,
    temperatureRange: '18°C - 25°C (Kho Tiêu Chuẩn)',
    zonesList: [
      'Khu Cross-Dock gom kiện xuất',
      'Phân khu A: Hàng đóng gói luân chuyển',
      'Phân khu B: Hàng chia chọn tuyến liên tỉnh'
    ],
    isActive: true,
  },
];

const enrichWarehouseData = (base: any, fallback?: WarehouseItem): WarehouseItem => {
  const code = base.code || fallback?.code || '';
  const def = DEFAULT_WAREHOUSES.find((d) => d.code === code) || fallback;
  const cleanName = cleanWarehouseString(base.name || def?.name || '');
  const cleanAddr = cleanWarehouseString(base.address || def?.address || '');

  // Chuẩn hóa sức chứa thiết kế và lượng tồn kho thực tế
  const capacityPallets = def?.capacityPallets || base.capacityPallets || 3000;
  const currentOccupancy =
    def?.currentOccupancy !== undefined
      ? def.currentOccupancy
      : base.currentOccupancy !== undefined
      ? base.currentOccupancy
      : Math.round(capacityPallets * 0.72);

  const metaMap = getStoredManagerMeta();
  const meta = metaMap[code];

  const managerName = base.managerName || meta?.managerName || def?.managerName || 'Trần Trưởng Kho';
  const managerUsername = base.managerUsername || meta?.managerUsername || def?.managerUsername;
  const managerPhone = base.managerPhone || meta?.managerPhone || def?.managerPhone || '0900 000 002';
  const managerId = base.managerId || meta?.managerId || def?.managerId;

  return {
    id: base.id || def?.id || Date.now(),
    code,
    name: cleanName,
    shortName: base.shortName || def?.shortName || cleanName.split('-')[0].trim(),
    address: cleanAddr,
    contactPhone: base.contactPhone || def?.contactPhone || '',
    type: base.type || def?.type || (code === 'WH01' ? 'CENTRAL' : code === 'WH02' ? 'DISTRIBUTION' : 'HUB'),
    region: base.region || def?.region || (code === 'WH02' ? 'NORTH' : code === 'WH03' ? 'CENTRAL_VN' : 'SOUTH'),
    managerId,
    managerUsername,
    managerName,
    managerPhone,
    capacityPallets,
    currentOccupancy,
    areaM2: base.areaM2 || def?.areaM2 || 6500,
    dockCount: base.dockCount || def?.dockCount || 4,
    totalZones: base.totalZones || def?.totalZones || 3,
    temperatureRange: base.temperatureRange || def?.temperatureRange || '18°C - 25°C (Kho Tiêu Chuẩn)',
    zonesList: base.zonesList || def?.zonesList || ['Khu đệm tiếp nhận', 'Phân khu A', 'Phân khu B'],
    trustedIps: base.trustedIps || def?.trustedIps,
    isActive: base.isActive !== false,
    createdAt: base.createdAt || def?.createdAt,
  };
};

export const warehouseService = {
  async getWarehouses(): Promise<WarehouseItem[]> {
    let remoteList: WarehouseItem[] = [];
    try {
      const res = await apiClient.get('/masterdata/warehouses');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        remoteList = res.data.data.map((w: any) => enrichWarehouseData(w));
      }
    } catch {
      // Backend error fallback
    }

    const cached = localStorage.getItem(STORAGE_KEY);
    let cachedList: WarehouseItem[] = [];
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          cachedList = parsed.map((w: any) => enrichWarehouseData(w));
        }
      } catch {}
    }

    const finalWarehouses: WarehouseItem[] = [];
    const sourceList = remoteList.length > 0 ? remoteList : cachedList.length > 0 ? cachedList : DEFAULT_WAREHOUSES;

    sourceList.forEach((wh) => {
      const cachedWh = cachedList.find((c) => String(c.id) === String(wh.id) || c.code === wh.code);
      finalWarehouses.push(enrichWarehouseData(cachedWh ? { ...wh, ...cachedWh } : wh));
    });

    // Ensure our standard 4 warehouses exist
    DEFAULT_WAREHOUSES.forEach((def) => {
      if (!finalWarehouses.some((w) => w.code === def.code)) {
        finalWarehouses.push(def);
      }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalWarehouses));
    return finalWarehouses;
  },

  async createWarehouse(item: Partial<WarehouseItem>): Promise<WarehouseItem> {
    if (item.code && item.managerName) {
      setStoredManagerMeta(item.code, {
        managerName: item.managerName,
        managerUsername: item.managerUsername,
        managerPhone: item.managerPhone || item.contactPhone,
        managerId: item.managerId,
      });
    }

    const newWh = enrichWarehouseData(item);
    try {
      const res = await apiClient.post('/masterdata/warehouses', {
        code: newWh.code,
        name: newWh.name,
        address: newWh.address,
        contactPhone: newWh.contactPhone,
      });
      if (res.data?.data) {
        newWh.id = res.data.data.id;
        newWh.createdAt = res.data.data.createdAt;
      }
    } catch (err) {
      console.warn('Backend warehouse creation failed, falling back to local storage', err);
    }

    if (newWh.code && (item.managerName || newWh.managerName)) {
      setStoredManagerMeta(newWh.code, {
        managerName: item.managerName || newWh.managerName,
        managerUsername: item.managerUsername || newWh.managerUsername,
        managerPhone: item.managerPhone || newWh.managerPhone || newWh.contactPhone,
        managerId: item.managerId || newWh.managerId,
      });
    }

    const current = await this.getWarehouses();
    const updated = [...current.filter((w) => w.code !== newWh.code && w.id !== newWh.id), newWh];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('smart_wms_warehouses_updated'));
    return newWh;
  },

  async updateWarehouse(id: string | number, item: Partial<WarehouseItem>): Promise<WarehouseItem> {
    if (item.code && item.managerName) {
      setStoredManagerMeta(item.code, {
        managerName: item.managerName,
        managerUsername: item.managerUsername,
        managerPhone: item.managerPhone || item.contactPhone,
        managerId: item.managerId,
      });
    }

    try {
      await apiClient.put(`/masterdata/warehouses/${id}`, item);
    } catch (err) {
      console.warn('Backend warehouse update failed, saving locally', err);
    }

    const current = await this.getWarehouses();
    const updated = current.map((w) => (String(w.id) === String(id) ? { ...w, ...item } : w));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('smart_wms_warehouses_updated'));
    return updated.find((w) => String(w.id) === String(id)) || (item as WarehouseItem);
  },

  async deleteWarehouse(id: string | number): Promise<void> {
    try {
      await apiClient.patch(`/masterdata/warehouses/${id}/status`, { isActive: false });
    } catch {
      // Local fallback
    }

    const current = await this.getWarehouses();
    const updated = current.map((w) => (String(w.id) === String(id) ? { ...w, isActive: false } : w));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('smart_wms_warehouses_updated'));
  },

  getActiveWarehouseId(): string {
    return localStorage.getItem('smart_wms_active_warehouse') || 'ALL';
  },

  setActiveWarehouseId(id: string): void {
    localStorage.setItem('smart_wms_active_warehouse', id);
    window.dispatchEvent(new CustomEvent('smart_wms_warehouse_changed', { detail: id }));
  },
};

export const getWarehouseDisplayName = (warehouseId?: number | string | null): string => {
  if (!warehouseId) return 'Chưa xác định kho';
  const idNum = Number(warehouseId);
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const list = JSON.parse(cached);
      const match = list.find((w: any) => Number(w.id) === idNum);
      if (match && match.name) return match.name;
    } catch {}
  }
  const defaultMatch = DEFAULT_WAREHOUSES.find((w) => Number(w.id) === idNum);
  return defaultMatch ? defaultMatch.name : `Kho #${warehouseId}`;
};

export const getWarehouseDisplayAddress = (warehouseId?: number | string | null): string => {
  if (!warehouseId) return '';
  const idNum = Number(warehouseId);
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const list = JSON.parse(cached);
      const match = list.find((w: any) => Number(w.id) === idNum);
      if (match && match.address) return match.address;
    } catch {}
  }
  const defaultMatch = DEFAULT_WAREHOUSES.find((w) => Number(w.id) === idNum);
  return defaultMatch && defaultMatch.address ? defaultMatch.address : '';
};

