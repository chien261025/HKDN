export interface StockItem {
  warehouseId?: number;
  warehouseName?: string;
  id: number;
  productId: number;
  locationId?: number;
  batchId?: number;
  sku: string;
  name: string;
  unit?: string;
  locationBarcode: string;
  batchNumber: string;
  expiryDate: string;
  onHandQty: number;
  reservedQty: number;
  unavailableQty?: number;
  availableQty: number;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  expiryStatus?: 'EXPIRED' | 'EXPIRING_SOON' | 'VALID' | 'NO_EXPIRY';
  daysRemaining?: number;
}

export interface StockTransferDto {
  id: number;
  transferCode: string;
  fromLocationId: number;
  fromLocationBarcode: string;
  toLocationId: number;
  toLocationBarcode: string;
  productId: number;
  productSku: string;
  productName: string;
  batchId: number;
  batchNumber: string;
  quantity: number;
  status: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateStockTransferPayload {
  productId: number;
  fromLocationId: number;
  toLocationId: number;
  batchId: number;
  quantity: number;
  notes?: string;
}


export interface OrderItem {
  id: string;
  code: string;
  customer: string;
  productSku: string;
  productName: string;
  qty: number;
  status: 'PENDING' | 'RESERVED' | 'SHIPPED';
  locationBarcode: string;
  batchNumber: string;
  expiryDate: string;
  daysRemaining: number;
  alternateBatch?: {
    batchNumber: string;
    expiryDate: string;
    daysRemaining: number;
    locationBarcode: string;
    onHand: number;
  };
}

export interface InventoryStats {
  onHand: number;
  reserved: number;
  available: number;
}

export interface LedgerEntryData {
  warehouseId?: number;
  id: string;
  transactionType: 'OUTBOUND' | 'INBOUND' | 'ADJUSTMENT' | 'TRANSFER' | 'INITIAL_BALANCE';
  referenceCode: string;
  locationBarcode: string;
  productSku: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  qtyChange: number;
  balanceBefore: number;
  balanceAfter: number;
  performedBy: string;
  notes: string;
  timestamp: string;
  hashSignature: string;
}
