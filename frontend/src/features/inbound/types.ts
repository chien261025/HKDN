export type InboundStatus = 'PENDING' | 'RECEIVED' | 'STOCKED' | 'CANCELLED';

export interface InboundOrderItem {
  id: string;
  sku: string;
  productName: string;
  expectedQty: number;
  receivedQty: number;
  stockedQty: number;
  batchNumber?: string;
  expiryDate?: string;
  putawayLocation?: string;
  unit: string;
}

export interface InboundOrder {
  id: string;
  poCode: string;
  supplierName: string;
  supplierCode: string;
  expectedDeliveryDate: string;
  createdAt: string;
  status: InboundStatus;
  items: InboundOrderItem[];
  notes?: string;
  approvedBy?: string;
}

export interface SupplierOption {
  code: string;
  name: string;
  phone: string;
  address: string;
}
