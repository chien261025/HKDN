import { apiClient } from '../../../services/api';
import { AuditSession, AuditStatus, AuditItemDiscrepancy } from '../types';

function mapAuditSession(a: any): AuditSession {
  const items: AuditItemDiscrepancy[] = (a.items && Array.isArray(a.items))
    ? a.items.map((i: any) => {
        const diff = (i.countedQty !== null && i.countedQty !== undefined)
          ? (i.countedQty - i.systemQty)
          : (i.differenceQty ?? 0);

        return {
          id: String(i.id),
          itemId: i.id,
          locationId: i.locationId,
          productId: i.productId,
          batchId: i.batchId,
          locationBarcode: i.locationBarcode || `LOC-${i.locationId}`,
          sku: i.sku || `SKU-${i.productId}`,
          productName: i.productName || `Sản phẩm #${i.productId}`,
          batchNumber: i.batchNumber || (i.batchId ? `BATCH-${i.batchId}` : 'N/A'),
          systemQty: i.systemQty ?? 0,
          countedQty: i.countedQty ?? null,
          differenceQty: diff,
          unit: i.unit || 'Cái',
          countedBy: a.createdByName || 'Thủ kho phụ trách',
          itemStatus: i.status,
          notes: i.counterNotes || '',
        };
      })
    : [];

  const total = a.totalBins ?? items.length;
  const counted = a.countedBins ?? items.filter((i) => i.countedQty !== null).length;
  const discCount = a.discrepanciesCount ?? items.filter((i) => i.countedQty !== null && i.differenceQty !== 0).length;

  let uiStatus: AuditStatus = 'COUNTING';
  if (a.status === 'APPROVED') {
    uiStatus = 'RECONCILED';
  } else if (a.status === 'COMPLETED' || (total > 0 && counted === total)) {
    uiStatus = 'PENDING_REVIEW';
  } else {
    uiStatus = 'COUNTING';
  }

  return {
    id: String(a.id),
    auditCode: a.auditCode || `AUD-${a.id}`,
    title: `Đợt Kiểm Kê Kho ${a.auditCode || a.id}`,
    scope: 'ZONE_A & ZONE_B (Toàn Bộ Kho)',
    startDate: a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : '',
    completedDate: a.completedAt ? new Date(a.completedAt).toLocaleString('vi-VN') : undefined,
    status: uiStatus,
    totalBins: total || 1,
    countedBins: counted,
    discrepanciesCount: discCount,
    assignedOperator: a.createdByName || 'Thủ kho phụ trách',
    reconciledBy: a.approvedByName || (a.status === 'APPROVED' ? 'Trần Trưởng Kho' : undefined),
    notes: a.notes || 'Phiên kiểm kê mù định kỳ theo chuẩn kiểm soát chất lượng WMS',
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

  async createAuditSession(session: Partial<AuditSession>): Promise<AuditSession> {
    const payload = {
      auditCode: session.auditCode || 'AUD-' + Date.now(),
      warehouseId: 1,
      auditType: 'CYCLE_COUNT',
      notes: session.notes || 'Phiên kiểm kê mù định kỳ tự động snapshot tồn kho',
      createdBy: 1,
    };
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

  async reconcileAudit(id: string): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await apiClient.put(`/inventory/audit/${id}/reconcile`);
    return res.data;
  },
};
