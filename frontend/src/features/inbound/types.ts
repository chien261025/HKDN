export type InboundStatus = 'PENDING' | 'RECEIVED' | 'STOCKED' | 'CLOSED_NO_STOCK' | 'CANCELLED';

export interface InboundOrderItem {
  id: string;
  /** Backend product identifier; this is the source of truth during put-away. */
  productId?: number;
  productBatchId?: number;
  sku: string;
  productName: string;
  expectedQty: number;
  receivedQty: number;
  rejectedQty?: number;
  weightKg?: number;
  storageCondition?: string;
  stockedQty: number;
  status?: 'PENDING' | 'RECEIVED' | 'PARTIAL' | 'COMPLETED';
  batchNumber?: string;
  expiryDate?: string;
  unitPrice?: number;
  putawayLocation?: string;
  unit: string;
}

export interface InboundOrder {
  id: string;
  warehouseId?: number;
  poCode: string;
  supplierName: string;
  supplierCode: string;
  expectedDeliveryDate: string;
  createdAt: string;
  status: InboundStatus;
  items: InboundOrderItem[];
  totalValue?: number;
  notes?: string;
  approvedBy?: string;
}

export interface ReceiptLine {
  id: string;
  receivedQty: number;
  rejectedQty: number;
  batchNumber?: string;
  expiryDate?: string;
}

export const remainingToStock = (item: InboundOrderItem) =>
  item.receivedQty - (item.rejectedQty ?? 0) - item.stockedQty;

export interface SupplierOption {
  code: string;
  name: string;
  phone: string;
  address: string;
}
