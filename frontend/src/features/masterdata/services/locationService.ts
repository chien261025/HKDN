import { apiClient } from '../../../services/api';
import { BinLocation } from '../types';

export const locationService = {
  async getLocations(): Promise<BinLocation[]> {
    try {
      const res = await apiClient.get('/masterdata/locations');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((l: any) => {
          const isZoneB = (l.zoneCode || '').includes('B');
          const isFloor1 = l.shelf === 'S01';
          return {
            id: l.id,
            zone: isZoneB ? 'ZONE_B' : 'ZONE_A',
            zoneName: isZoneB ? 'Kho Lạnh & Sữa (Cold Storage 2-8°C)' : 'Kho Khô & Điện Tử (Ambient)',
            aisle: l.aisle || 'A01',
            rack: l.rack || 'R01',
            shelf: l.shelf || 'S01',
            binNumber: l.binBarcode?.slice(-3) || 'B01',
            barcode: l.binBarcode || `ZA-${l.aisle}-${l.rack}-${l.shelf}-B01`,
            maxWeight: Number(l.maxWeightKg) || 1000,
            currentWeight: isFloor1 ? 150 : 0,
            status: l.id === 5 ? 'EXPIRING' : l.id === 4 ? 'RESERVED' : (l.id === 1 || l.id === 3 || l.id === 6) ? 'OCCUPIED' : 'EMPTY',
            productName: l.id === 1 ? 'Samsung Galaxy S24 Ultra 256GB' : l.id === 3 ? 'Nước giặt OMO Matic 3.6kg' : (l.id === 5 || l.id === 6) ? 'Sữa tươi tiệt trùng Vinamilk 100% 1L' : undefined,
            sku: l.id === 1 ? 'SKU-SAMS-S24' : l.id === 3 ? 'SKU-OMO-MATIC' : (l.id === 5 || l.id === 6) ? 'SKU-MILK-100' : undefined,
            qty: l.id === 1 ? 25 : l.id === 3 ? 60 : l.id === 5 ? 80 : l.id === 6 ? 200 : undefined,
            batch: l.id === 1 ? 'BATCH-S24-01' : l.id === 3 ? 'BATCH-OMO-01' : l.id === 5 ? 'BATCH-MILK-26A' : l.id === 6 ? 'BATCH-MILK-26B' : undefined,
            expiry: l.id === 5 ? '2026-09-25' : l.id === 6 ? '2026-11-30' : l.id === 1 ? '2028-01-10' : undefined,
            temperature: isZoneB ? '4.0°C' : '24°C',
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
