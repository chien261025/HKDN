export type ProductCategory =
  | 'FOOD_BEVERAGE'
  | 'CHEMICAL'
  | 'ELECTRONICS'
  | 'PHARMA'
  | 'GENERAL'
  | 'PHARMACEUTICAL'
  | 'FASHION';

export type StorageZoneReq = 'ZONE_A' | 'ZONE_B' | 'ZONE_C' | 'ZONE_D' | 'UNASSIGNED'; 
// ZONE_A: Khô & Điện tử (Ambient Dry), ZONE_B: Kho Mát (Cool 2-8°C), ZONE_C: Kho Đông (-18°C), ZONE_D: Hàng Giá Trị Cao (Secure High Value)

export type StorageConditionType = 'AMBIENT' | 'COOL' | 'COLD' | 'SECURE';

export type ProductBusinessStatus = 'ACTIVE' | 'SUSPENDED' | 'DISCONTINUED';

export type ProductTrackingMethod = 'FEFO_BATCH' | 'SERIAL_IMEI' | 'STANDARD';

export interface ProductItem {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  category: ProductCategory;
  categoryId?: number;
  categoryCode?: string;
  categoryName?: string;
  unit: string;
  brand?: string;
  origin?: string;
  imageUrl?: string;
  storageCondition?: StorageConditionType;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  volumeCbm?: number; // CBM (m3) = (L * W * H) / 1,000,000
  reorderPoint: number;
  safetyStock: number;
  maxStock?: number;
  purchasePrice?: number; // Giá vốn / Giá nhập chuẩn (VNĐ)
  sellingPrice?: number;  // Giá bán / Giá xuất đề xuất (VNĐ)
  businessStatus?: ProductBusinessStatus;
  currentStock: number;
  storageZone: StorageZoneReq;
  supplierCode: string;
  supplierId?: string;
  supplierName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  isBatchManaged?: boolean; // Có quản lý theo số Lô (Batch/Lot) hay không
  isExpiryManaged?: boolean; // Có quản lý Hạn sử dụng (Shelf Life) hay không
  shelfLifeDays?: number; // Số ngày hạn sử dụng tiêu chuẩn (Master Data)
  outboundStrategy?: 'FEFO' | 'FIFO' | 'LIFO'; // Chiến lược xuất kho tự động
  trackingMethod?: ProductTrackingMethod; // Phương thức định danh: FEFO_BATCH, SERIAL_IMEI hoặc STANDARD
}

export interface CategoryItem {
  id: string;
  code: string;
  name: string;
  parentId?: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  productCount?: number;
  childCount?: number;
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
  categories?: { id: number | string; code: string; name: string }[];
  activeProductsCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}
