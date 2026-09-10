export type ProductCategory = 'FOOD_BEVERAGE' | 'CHEMICAL' | 'ELECTRONICS' | 'PHARMA' | 'GENERAL';

export type StorageZoneReq = 'ZONE_A' | 'ZONE_B'; // ZONE_A: Khô & Điện tử, ZONE_B: Kho Mát 2-8°C

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  unit: string;
  weightKg: number;
  reorderPoint: number;
  safetyStock: number;
  currentStock: number;
  storageZone: StorageZoneReq;
  supplierCode: string;
  supplierName: string;
  status: 'ACTIVE' | 'DISCONTINUED';
}

export interface SupplierItem {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  suppliedCategories: string[];
  activeProductsCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}
