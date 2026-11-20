import { apiClient } from '../../../services/api';
import {
  AuditSession,
  AuditStatus,
  AuditItemDiscrepancy,
  CreateAuditPayload,
  AuditScopePreviewPayload,
  AuditScopePreviewResult,
} from '../types';

function mapAuditSession(a: any): AuditSession {
  const items: AuditItemDiscrepancy[] = (a.items && Array.isArray(a.items))
    ? a.items.map((i: any) => {
        const diff = (i.countedQty !== null && i.countedQty !== undefined && i.systemQty !== null && i.systemQty !== undefined)
          ? (i.countedQty - i.systemQty)
          : (i.differenceQty !== undefined ? i.differenceQty : null);

        const adj = (i.adjustmentQty !== undefined)
          ? i.adjustmentQty
          : (diff !== null ? diff : 0);

        const balAfter = (i.balanceAfter !== undefined)
          ? i.balanceAfter
          : (i.countedQty !== null && i.countedQty !== undefined ? i.countedQty : i.systemQty);

        return {
          id: String(i.id),
          itemId: i.id,
          locationId: i.locationId,
          productId: i.productId,
          batchId: i.batchId,
          locationBarcode: i.locationBarcode || `LOC-${i.locationId}`,
          zoneCode: i.zoneCode || '',
          aisle: i.aisle || '',
          rack: i.rack || '',
          shelf: i.shelf || '',
          bin: i.bin || '',
          sku: i.sku || `SKU-${i.productId}`,
          productName: i.productName || `Sản phẩm #${i.productId}`,
          categoryName: i.categoryName,
          batchNumber: i.batchNumber || (i.batchId ? `BATCH-${i.batchId}` : 'N/A'),
          expiryDate: i.expiryDate,
          systemQty: i.systemQty !== undefined ? i.systemQty : null,
          countedQty: i.countedQty ?? null,
          differenceQty: diff,
          firstCountQty: i.firstCountQty,
          secondCountQty: i.secondCountQty,
          isVerified: i.isVerified,
          recountedByName: i.recountedByName,
          adjustmentQty: adj,
          balanceAfter: balAfter,
          unit: i.unit || 'Hộp',
          countedBy: a.assignedOperatorName || a.createdByName || 'Thủ kho phụ trách',
          itemStatus: i.status,
          notes: i.counterNotes || '',
        };
      })
    : [];

  const total = a.totalBins ?? items.length;
  const counted = a.countedBins ?? items.filter((i) => i.countedQty !== null).length;
  const discCount = a.discrepanciesCount ?? items.filter((i) => i.countedQty !== null && i.differenceQty !== null && i.differenceQty !== 0).length;

  let uiStatus: AuditStatus = 'COUNTING';
  if (a.status === 'APPROVED') {
    uiStatus = 'RECONCILED';
  } else if (a.status === 'COMPLETED' || (total > 0 && counted === total)) {
    uiStatus = 'PENDING_REVIEW';
  } else {
    uiStatus = 'COUNTING';
  }

  let scopeDesc = a.scopeType === 'ZONE'
    ? `Khu vực (${a.scopeValue || 'Zone'})`
    : a.scopeType === 'BIN'
    ? `Vị trí ô (${a.scopeValue || 'Bin'})`
    : a.scopeType === 'SKU'
    ? `Mặt hàng (${a.scopeValue || 'SKU'})`
    : `Toàn bộ ${a.warehouseName || `kho #${a.warehouseId}`}`;

  return {
    id: String(a.id),
    auditCode: a.auditCode || `AUD-${a.id}`,
    title: a.title || `Đợt Kiểm Kê Kho ${a.auditCode || a.id}`,
    warehouseId: a.warehouseId,
    warehouseName: a.warehouseName,
    scope: scopeDesc,
    scopeType: a.scopeType,
    scopeValue: a.scopeValue,
    startDate: a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : '',
    completedDate: a.completedAt ? new Date(a.completedAt).toLocaleString('vi-VN') : undefined,
    status: uiStatus,
    auditType: a.auditType || 'CYCLE_COUNT',
    blindCount: a.isBlindCount,
    requireRecount: a.isIndependentVerificationRequired,
    includeEmptyBins: a.includeEmptyBins,
    totalBins: total,
    countedBins: counted,
    discrepanciesCount: discCount,
    assignedOperator: a.assignedOperatorName || a.createdByName || 'Thủ kho phụ trách',
    assignedOperatorId: a.assignedOperatorId || a.createdBy,
    reconciledBy: a.approvedByName || (a.status === 'APPROVED' ? 'Trưởng kho / Kế toán' : undefined),
    adjustmentCode: a.adjustmentCode,
    notes: a.notes || 'Phiên kiểm kê theo chuẩn Enterprise WMS',
    items,
  };
}

export const auditService = {
  async getAuditSessions(): Promise<AuditSession[]> {
    try {
      const res = await apiClient.get('/inventory/audit');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map(mapAuditSession);
      }
      return [];
    } catch (err) {
      console.warn('Backend audit sessions error:', err);
      return [];
    }
  },

  async getAuditById(id: string): Promise<AuditSession | null> {
    try {
      const res = await apiClient.get(`/inventory/audit/${id}`);
      if (res.data?.data) {
        return mapAuditSession(res.data.data);
      }
      return null;
    } catch (err) {
      console.warn('Backend getAuditById error:', err);
      return null;
    }
  },

  async getWarehouseOptions() {
    const res = await apiClient.get<{ data: { id: number; name: string; isActive: boolean }[] }>('/masterdata/warehouses');
    return res.data.data.filter((w) => w.isActive);
  },

  async getWarehouseLocations(warehouseId: number) {
    const res = await apiClient.get<{ data: any[] }>('/masterdata/locations');
    return res.data.data.filter((l) => l.warehouseId === warehouseId);
  },

  async getProducts() {
    const res = await apiClient.get<{ data: any[] }>('/masterdata/products');
    return res.data.data;
  },

  async previewScope(payload: AuditScopePreviewPayload): Promise<AuditScopePreviewResult> {
    const res = await apiClient.post('/inventory/audit/preview', payload);
    return res.data?.data;
  },

  async createAuditSession(input: number | CreateAuditPayload, legacyNotes?: string): Promise<AuditSession> {
    let payload: CreateAuditPayload;
    if (typeof input === 'number') {
      payload = {
        warehouseId: input,
        title: legacyNotes || 'Kiểm kê định kỳ kho bãi',
        auditType: 'CYCLE_COUNT',
        scopeType: 'ALL',
        notes: legacyNotes,
        blindCount: true,
        requireRecount: true,
      };
    } else {
      payload = input;
    }

    const res = await apiClient.post('/inventory/audit', payload);
    const saved = res.data?.data;
    return mapAuditSession(saved);
  },

  async recordItemCount(auditId: string, itemId: number, countedQty: number, notes?: string): Promise<AuditSession> {
    const res = await apiClient.post(`/inventory/audit/${auditId}/count`, {
      itemId,
      countedQty,
      notes: notes || 'Ghi nhận kiểm đếm thực tế qua thiết bị quét PDA',
    });
    return mapAuditSession(res.data?.data);
  },

  async recountItem(auditId: string, itemId: number, recountQty: number, notes?: string): Promise<AuditSession> {
    const res = await apiClient.post(`/inventory/audit/${auditId}/recount`, {
      itemId,
      countedQty: recountQty,
      notes: notes || 'Xác minh lại số lượng kiểm kê vòng 2',
    });
    return mapAuditSession(res.data?.data);
  },

  async reconcileAudit(id: string): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await apiClient.put(`/inventory/audit/${id}/reconcile`);
    return res.data;
  },
};
