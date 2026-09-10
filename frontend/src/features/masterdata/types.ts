export type ZoneType = 'ZONE_A' | 'ZONE_B';

export interface BinLocation {
  id: number;
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
