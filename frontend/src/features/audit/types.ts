export type AuditStatus = 'COUNTING' | 'PENDING_REVIEW' | 'RECONCILED' | 'CANCELLED';

export interface AuditItemDiscrepancy {
  id: string;
  itemId?: number;
  locationId?: number;
  productId?: number;
  batchId?: number;
  locationBarcode: string;
  zoneCode?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  sku: string;
  productName: string;
  categoryName?: string;
  batchNumber: string;
  expiryDate?: string;
  systemQty: number | null; // null if blind count active & not yet counted
  countedQty: number | null;
  differenceQty: number | null;
  firstCountQty?: number | null;
  secondCountQty?: number | null;
  isVerified?: boolean;
  recountedByName?: string | null;
  adjustmentQty?: number;
  balanceAfter?: number;
  unit: string;
  countedBy: string;
  itemStatus?: string;
  notes?: string;
}

export interface AuditSession {
  id: string;
  auditCode: string;
  title: string;
  warehouseId?: number;
  warehouseName?: string;
  scope: string;
  scopeType?: 'ALL' | 'ZONE' | 'BIN' | 'SKU';
  scopeValue?: string;
  startDate: string;
  completedDate?: string;
  status: AuditStatus;
  auditType?: 'CYCLE_COUNT' | 'FULL_AUDIT' | 'SPOT_CHECK';
  blindCount?: boolean;
  requireRecount?: boolean;
  includeEmptyBins?: boolean;
  totalBins: number;
  countedBins: number;
  discrepanciesCount: number;
  assignedOperator: string;
  assignedOperatorId?: number;
  items: AuditItemDiscrepancy[];
  reconciledBy?: string;
  adjustmentCode?: string;
  notes?: string;
}

export interface CreateAuditPayload {
  warehouseId: number;
  title: string;
  auditType: 'CYCLE_COUNT' | 'FULL_AUDIT' | 'SPOT_CHECK';
  scopeType: 'ALL' | 'ZONE' | 'BIN' | 'SKU';
  scopeValue?: string;
  notes?: string;
  blindCount?: boolean;
  requireRecount?: boolean;
  includeEmptyBins?: boolean;
  assignedOperatorId?: number;
}

export interface AuditScopePreviewPayload {
  warehouseId: number;
  scopeType: 'ALL' | 'ZONE' | 'BIN' | 'SKU';
  scopeValue?: string;
  includeEmptyBins?: boolean;
}

export interface AuditScopePreviewResult {
  warehouseId: number;
  warehouseName: string;
  scopeType: string;
  scopeValue: string;
  totalLocations: number;
  totalProducts: number;
  totalLines: number;
  totalExpectedStock: number;
  sampleItems: Array<{
    locationId: number;
    locationBarcode: string;
    zoneCode: string;
    productId: number;
    sku: string;
    productName: string;
    batchNumber: string;
    systemQty: number;
  }>;
}
