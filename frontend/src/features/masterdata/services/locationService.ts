import { apiClient } from '../../../services/api';
import { BinLocation } from '../types';

let memoryLocationsCache: BinLocation[] = [];

export const locationService = {
  async getLocations(): Promise<BinLocation[]> {
    try {
      const res = await apiClient.get('/masterdata/locations/occupancy');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const mapped = res.data.data.map((l: any) => {
          const whCode = l.warehouseCode || (l.barcode?.startsWith('WH02') ? 'WH02' : l.barcode?.startsWith('WH03') ? 'WH03' : l.barcode?.startsWith('WH04') ? 'WH04' : 'WH01');
          const whId = l.warehouseId || (whCode === 'WH02' ? 2 : whCode === 'WH03' ? 3 : whCode === 'WH04' ? 4 : 1);
          return {
            id: l.id,
            warehouseId: whId,
            warehouseCode: whCode,
            zone: l.zone,
            zoneName: l.zoneName,
            aisle: l.aisle || 'A01',
            rack: l.rack || 'R01',
            shelf: l.shelf || 'S01',
            binNumber: l.binNumber || 'B01',
            barcode: l.barcode,
            maxWeight: Number(l.maxWeight) || 1000,
            currentWeight: Number(l.currentWeight) || 0,
            status: l.status || 'EMPTY',
            isActive: l.isActive !== false,
            productId: l.productId || undefined,
            batchId: l.batchId || undefined,
            productName: l.productName || undefined,
            sku: l.sku || undefined,
            qty: l.qty || undefined,
            onHandQty: l.onHandQty != null ? Number(l.onHandQty) : (l.qty ? Number(l.qty) : undefined),
            reservedQty: l.reservedQty != null ? Number(l.reservedQty) : 0,
            availableQty: l.availableQty != null ? Number(l.availableQty) : (l.qty ? Number(l.qty) : 0),
            isExpired: Boolean(l.isExpired),
            batch: l.batch || undefined,
            expiry: l.expiry || undefined,
            temperature: l.temperature || '24.0°C',
          };
        });
        memoryLocationsCache = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn('Backend locations occupancy error, using in-memory snapshot:', err);
    }

    if (memoryLocationsCache.length > 0) {
      return memoryLocationsCache;
    }

    return [];
  },

  async updateLocationStatus(id: number, isActive: boolean): Promise<boolean> {
    const res = await apiClient.patch(`/masterdata/locations/${id}/status`, null, {
      params: { isActive },
    });
    if (!res.data?.success) {
      throw new Error(res.data?.message || 'Không thể cập nhật trạng thái ô kệ');
    }
    memoryLocationsCache = memoryLocationsCache.map((l) =>
      l.id === id ? { ...l, isActive } : l
    );
    window.dispatchEvent(
      new CustomEvent('smart_wms_bin_status_changed', {
        detail: { id, isActive, locked: !isActive },
      })
    );
    return true;
  },
};
