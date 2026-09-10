export type OutboundStatus = 'PENDING' | 'ALLOCATED' | 'PICKING' | 'DISPATCHED' | 'CANCELLED';

export interface FefoAllocation {
  batchNumber: string;
  expiryDate: string;
  locationBarcode: string;
  qtyAllocated: number;
  isNearestExpiry: boolean;
}

export interface OutboundItem {
  id: string;
  sku: string;
  productName: string;
  requestedQty: number;
  allocatedQty: number;
  pickedQty: number;
  unit: string;
  allocations: FefoAllocation[];
}

export interface OutboundOrder {
  id: string;
  soCode: string;
  customerName: string;
  shippingAddress: string;
  orderDate: string;
  requiredDate: string;
  status: OutboundStatus;
  items: OutboundItem[];
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  lockId?: string;
  notes?: string;
  dispatchCarrier?: string;
}

export interface CustomerOption {
  code: string;
  name: string;
  address: string;
  phone: string;
}
