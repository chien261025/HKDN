export interface StockItem {
  id: number;
  productId: number;
  sku: string;
  name: string;
  locationBarcode: string;
  batchNumber: string;
  expiryDate: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  isExpiringSoon?: boolean;
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
  id: string;
  transactionType: 'OUTBOUND' | 'INBOUND' | 'ADJUSTMENT' | 'TRANSFER';
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
