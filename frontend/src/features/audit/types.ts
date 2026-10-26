export type AuditStatus = 'COUNTING' | 'PENDING_REVIEW' | 'RECONCILED' | 'CANCELLED';

export interface AuditItemDiscrepancy {
  id: string;
  itemId?: number;
  locationId?: number;
  productId?: number;
  batchId?: number;
  locationBarcode: string;
  sku: string;
  productName: string;
  batchNumber: string;
  systemQty: number;
  countedQty: number | null;
  differenceQty: number;
  unit: string;
  countedBy: string;
  itemStatus?: string;
  notes?: string;
}

export interface AuditSession {
  id: string;
  auditCode: string;
  title: string;
  scope: string;
  startDate: string;
  completedDate?: string;
  status: AuditStatus;
  totalBins: number;
  countedBins: number;
  discrepanciesCount: number;
  assignedOperator: string;
  items: AuditItemDiscrepancy[];
  reconciledBy?: string;
  notes?: string;
}
