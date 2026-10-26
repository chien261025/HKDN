import { apiClient } from '../../../services/api';
import { BinLocation } from '../types';

export const locationService = {
  async getLocations(): Promise<BinLocation[]> {
    try {
      const res = await apiClient.get('/masterdata/locations/occupancy');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((l: any) => ({
          id: l.id,
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
        }));
      }
      return [];
    } catch (err) {
      console.warn('Backend locations error:', err);
      return [];
    }
  },
};
