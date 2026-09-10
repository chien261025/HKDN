export type OperatorTab = 'STAGING' | 'PUTAWAY' | 'PICKING' | 'AUDIT';

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
