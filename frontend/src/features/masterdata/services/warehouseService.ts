import { apiClient } from '../../../services/api';
import { WarehouseItem } from '../types';

const STORAGE_KEY = 'smart_wms_warehouses_list';

export const cleanWarehouseString = (str: string = ''): string => {
  if (!str) return '';
  if (str.includes('Tá»•ng') || str.includes('TÃ¢n BÃ¬nh')) return 'Kho Tổng Tân Bình - TP.HCM';
  if (str.includes('PhÃ¢n Phá»') || str.includes('Báº¯c Ninh')) return 'Kho Phân Phối VSIP Bắc Ninh';
  if (str.includes('Váº­n') || str.includes('Náºµng')) return 'Kho Vận Miền Trung - Đà Nẵng';
  if (str.includes('Trung Chuyá»') || str.includes('BÃ¬nh DÆ°Æ¡ng')) return 'Kho Trung Chuyển Sóng Thần - Bình Dương';
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
    address: '102 Trường Chinh, P.12, Q.Tân Bình, TP.HCM',
    contactPhone: '028 3811 2233',
    type: 'CENTRAL',
    capacityPallets: 5000,
    totalZones: 4,
    isActive: true,
  },
  {
    id: 2,
    code: 'WH02',
    name: 'Kho Phân Phối VSIP Bắc Ninh',
    shortName: 'Kho Bắc Ninh',
    address: 'Đại lộ Hữu Nghị, KCN VSIP, Từ Sơn, Bắc Ninh',
    contactPhone: '0222 388 9900',
    type: 'DISTRIBUTION',
    capacityPallets: 3200,
    totalZones: 3,
    isActive: true,
  },
  {
    id: 3,
    code: 'WH03',
    name: 'Kho Vận Miền Trung - Đà Nẵng',
    shortName: 'Kho Đà Nẵng',
    address: 'Đường số 3, KCN Hòa Khánh, Liên Chiểu, TP. Đà Nẵng',
    contactPhone: '0236 377 6688',
    type: 'HUB',
    capacityPallets: 2500,
    totalZones: 3,
    isActive: true,
  },
  {
    id: 4,
    code: 'WH04',
    name: 'Kho Trung Chuyển Sóng Thần - Bình Dương',
    shortName: 'Kho Bình Dương',
    address: 'KCN Sóng Thần 1, Dĩ An, Bình Dương',
    contactPhone: '0274 379 1234',
    type: 'HUB',
    capacityPallets: 4000,
    totalZones: 3,
    isActive: true,
  },
];

export const warehouseService = {
  async getWarehouses(): Promise<WarehouseItem[]> {
    try {
      const res = await apiClient.get('/masterdata/warehouses');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const remoteList: WarehouseItem[] = res.data.data.map((w: any) => {
          const cleanName = cleanWarehouseString(w.name);
          const cleanAddr = cleanWarehouseString(w.address || '');
          return {
            id: w.id,
            code: w.code,
            name: cleanName,
            shortName: cleanName.split('-')[0].trim(),
            address: cleanAddr,
            contactPhone: w.contactPhone || '',
            type: w.code === 'WH01' ? 'CENTRAL' : w.code === 'WH02' ? 'DISTRIBUTION' : 'HUB',
            capacityPallets: 3000,
            totalZones: 3,
            isActive: w.isActive !== false,
            createdAt: w.createdAt,
          };
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteList));
        return remoteList;
      }
    } catch {
      // Graceful fallback to cached or default
    }

    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((w: WarehouseItem) => ({
            ...w,
            name: cleanWarehouseString(w.name),
            shortName: cleanWarehouseString(w.shortName || w.name).split('-')[0].trim(),
            address: cleanWarehouseString(w.address || ''),
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          return cleaned;
        }
      } catch {
        // Ignore parse error
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_WAREHOUSES));
    return DEFAULT_WAREHOUSES;
  },

  async createWarehouse(item: Partial<WarehouseItem>): Promise<WarehouseItem> {
    try {
      const res = await apiClient.post('/masterdata/warehouses', {
        code: item.code,
        name: item.name,
        address: item.address,
        contactPhone: item.contactPhone,
      });
      if (res.data?.data) {
        const saved = res.data.data;
        const newWh: WarehouseItem = {
          id: saved.id,
          code: saved.code,
          name: saved.name,
          shortName: saved.name.split('-')[0].trim(),
          address: saved.address || '',
          contactPhone: saved.contactPhone || '',
          type: item.type || 'DISTRIBUTION',
          capacityPallets: item.capacityPallets || 2000,
          totalZones: item.totalZones || 2,
          isActive: true,
          createdAt: saved.createdAt,
        };
        const current = await this.getWarehouses();
        const updated = [...current.filter((w) => w.id !== newWh.id), newWh];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('smart_wms_warehouses_updated'));
        return newWh;
      }
    } catch (err) {
      console.warn('Backend warehouse creation failed, falling back to local storage', err);
    }

    const current = await this.getWarehouses();
    const newId = Date.now();
    const newWh: WarehouseItem = {
      id: newId,
      code: item.code || `WH0${current.length + 1}`,
      name: item.name || 'Chi nhánh kho mới',
      shortName: item.shortName || (item.name || '').split('-')[0].trim(),
      address: item.address || '',
      contactPhone: item.contactPhone || '',
      type: item.type || 'DISTRIBUTION',
      capacityPallets: item.capacityPallets || 2500,
      totalZones: item.totalZones || 3,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [...current, newWh];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('smart_wms_warehouses_updated'));
    return newWh;
  },

  async updateWarehouse(id: string | number, item: Partial<WarehouseItem>): Promise<WarehouseItem> {
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

