export type ZoneType = 'ZONE_A' | 'ZONE_B' | 'ZONE_C' | 'ALL';

export interface BinLocation {
  id: number;
  warehouseId?: number;
  warehouseCode?: string;
  zone: ZoneType;
  zoneName: string;
  aisle: string;
  rack: string;
  shelf: string;
  binNumber: string;
  barcode: string;
  maxWeight: number;
  currentWeight: number;
  status: 'EMPTY' | 'OCCUPIED' | 'RESERVED' | 'EXPIRING';
  productName?: string;
  sku?: string;
  qty?: number;
  batch?: string;
  expiry?: string;
  temperature?: string;
}

export interface WarehouseItem {
  id: string | number;
  code: string;
  name: string;
  shortName?: string;
  address?: string;
  contactPhone?: string;
  type?: 'HUB' | 'DISTRIBUTION' | 'CENTRAL' | 'COLD_STORAGE';
  capacityPallets?: number;
  totalZones?: number;
  isActive: boolean;
  createdAt?: string;
}
