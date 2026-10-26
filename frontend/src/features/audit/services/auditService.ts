import { apiClient } from '../../../services/api';
import { AuditSession, AuditStatus, AuditItemDiscrepancy } from '../types';

const LOCATION_LOOKUP: Record<number, string> = {
  1: 'WH01-ZA-A01-R01-S01-B01',
  2: 'WH01-ZA-A01-R01-S02-B02',
  3: 'WH01-ZA-A01-R02-S01-B03',
  4: 'WH01-ZA-A02-R01-S01-B04',
  5: 'WH01-ZB-B01-R01-S01-B05',
  6: 'WH01-ZB-B01-R01-S02-B06',
};

const PRODUCT_LOOKUP: Record<number, { sku: string; name: string; unit: string }> = {
  1: { sku: 'SKU-MILK-100', name: 'Sữa tươi tiệt trùng Vinamilk 100% 1L', unit: 'Hộp' },
  2: { sku: 'SKU-SAMS-S24', name: 'Điện thoại Samsung Galaxy S24 Ultra 256GB', unit: 'Chiếc' },
  3: { sku: 'SKU-OMO-MATIC', name: 'Nước giặt OMO Matic Cửa Trên 3.6kg', unit: 'Túi' },
};

const BATCH_LOOKUP: Record<number, string> = {
  1: 'BATCH-MILK-26A',
  2: 'BATCH-MILK-26B',
  3: 'BATCH-S24-01',
  4: 'BATCH-OMO-01',
  5: 'BATCH-S24-NOEXP',
  8: 'BATCH-S24-SEC',
};

function mapAuditSession(a: any): AuditSession {
  const items: AuditItemDiscrepancy[] = (a.items && Array.isArray(a.items))
    ? a.items.map((i: any) => {
        const prod = PRODUCT_LOOKUP[i.productId] || { sku: `SKU-PROD-${i.productId}`, name: `Sản phẩm #${i.productId}`, unit: 'Đơn vị' };
        const loc = LOCATION_LOOKUP[i.locationId] || `LOC-${i.locationId}`;
        const batch = BATCH_LOOKUP[i.batchId] || `LOT-${i.batchId || 'STD'}`;
        const diff = (i.countedQty !== null && i.countedQty !== undefined) ? (i.countedQty - i.systemQty) : 0;
        return {
          id: String(i.id),
          itemId: i.id,
          locationId: i.locationId,
          productId: i.productId,
          batchId: i.batchId,
          locationBarcode: loc,
          sku: prod.sku,
          productName: prod.name,
          batchNumber: batch,
          systemQty: i.systemQty ?? 0,
          countedQty: i.countedQty ?? null,
          differenceQty: diff,
          unit: prod.unit,
          countedBy: 'Lê Thủ Kho (PDA)',
          itemStatus: i.status,
          notes: i.counterNotes || '',
        };
      })
    : [];

  const total = items.length;
  const counted = items.filter((i) => i.countedQty !== null).length;
  const discCount = items.filter((i) => i.countedQty !== null && i.differenceQty !== 0).length;

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
    scope: 'ZONE_A & B (Toàn Kho Tổng)',
    startDate: a.createdAt ? new Date(a.createdAt).toLocaleString('vi-VN') : '',
    completedDate: a.completedAt ? new Date(a.completedAt).toLocaleString('vi-VN') : undefined,
    status: uiStatus,
    totalBins: total || 1,
    countedBins: counted,
    discrepanciesCount: discCount,
    assignedOperator: 'Lê Thủ Kho (PDA)',
    reconciledBy: a.status === 'APPROVED' ? 'Trần Trưởng Kho' : undefined,
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
