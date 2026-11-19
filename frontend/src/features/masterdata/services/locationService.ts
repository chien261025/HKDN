import { apiClient } from '../../../services/api';
import { BinLocation } from '../types';

export const locationService = {
  async getLocations(): Promise<BinLocation[]> {
    try {
      const res = await apiClient.get('/masterdata/locations/occupancy');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((l: any) => {
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
            productName: l.productName || undefined,
            sku: l.sku || undefined,
            qty: l.qty || undefined,
            batch: l.batch || undefined,
            expiry: l.expiry || undefined,
            temperature: l.temperature || '24.0°C',
          };
        });
      }
      return [];
    } catch (err) {
      console.warn('Backend locations error:', err);
      return [];
    }
  },
};
