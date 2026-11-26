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
  isActive?: boolean;
  productId?: number;
  batchId?: number;
  productName?: string;
  sku?: string;
  qty?: number;
  onHandQty?: number;
  reservedQty?: number;
  availableQty?: number;
  isExpired?: boolean;
  batch?: string;
  expiry?: string;
  temperature?: string;
}

export type WarehouseRegion = 'NORTH' | 'CENTRAL_VN' | 'SOUTH' | 'MEKONG';
export type WarehouseType = 'CENTRAL' | 'DISTRIBUTION' | 'HUB' | 'COLD_STORAGE';

export interface WarehouseItem {
  id: string | number;
  code: string;
  name: string;
  shortName?: string;
  address?: string;
  contactPhone?: string;
  type?: WarehouseType;
  region?: WarehouseRegion;
  managerId?: string | number;
  managerUsername?: string;
  managerName?: string;
  managerPhone?: string;
  capacityPallets?: number;
  currentOccupancy?: number;
  totalZones?: number;
  zonesList?: string[];
  areaM2?: number;
  dockCount?: number;
  temperatureRange?: string;
  trustedIps?: string;
  isActive: boolean;
  createdAt?: string;
}
