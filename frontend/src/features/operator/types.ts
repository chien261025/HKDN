export type OperatorTab = 'STAGING' | 'PUTAWAY' | 'PICKING' | 'TRANSFER' | 'AUDIT';

export interface InboundReceiptItem {
  id: string;
  poCode: string;
  sku: string;
  productName: string;
  expectedQty: number;
  receivedQty: number;
  batchNumber: string;
  expiryDate: string;
  status: 'PENDING' | 'RECEIVED';
}

export interface PutawayTask {
  id: string;
  sku: string;
  productName: string;
  batchNumber: string;
  qty: number;
  weightKg: number;
  suggestedLocation: string;
  suggestedZone: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface PickTask {
  id: string;
  orderCode: string;
  sku: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  locationBarcode: string;
  qtyToPick: number;
  pickedQty: number;
  status: 'PENDING' | 'PICKED';
  stepNumber: number;
}

export interface BlindCountRecord {
  id: string;
  locationBarcode: string;
  countedQty: number;
  timestamp: string;
  notes?: string;
  status: 'SUBMITTED';
}

export interface StockTransferTask {
  productId: number;
  productName?: string;
  sku?: string;
  fromLocationId: number;
  fromLocationBarcode: string;
  toLocationId: number;
  toLocationBarcode: string;
  batchId: number;
  batchNumber?: string;
  quantity: number;
  notes?: string;
}
