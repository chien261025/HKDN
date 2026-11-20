import { apiClient } from '../../../services/api';
import { StockItem, LedgerEntryData } from '../../labels/types';
import { OutboundStock } from '../../outbound/types';

export interface SafetyStockAlert {
  warehouseId?: number;
  warehouseName?: string;
  productId: number;
  sku: string;
  barcode: string;
  productName: string;
  categoryName: string;
  unit: string;
  currentOnHand: number;
  currentReserved: number;
  currentAvailable: number;
  safetyStock: number;
  reorderPoint: number;
  suggestedReorderQty: number;
  alertLevel: 'CRITICAL' | 'WARNING' | 'OUT_OF_STOCK' | 'NORMAL';
  message: string;
}

export interface ExpiringBatchAlert {
  warehouseId?: number;
  warehouseName?: string;
  productId: number;
  sku: string;
  productName: string;
  categoryName: string;
  unit: string;
  batchId: number;
  batchNumber: string;
  batchStatus?: string;
  manufactureDate?: string;
  expiryDate: string;
  daysRemaining: number;
  locationId: number;
  locationBarcode: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  alertLevel: 'EXPIRED' | 'CRITICAL' | 'WARNING';
  message: string;
}

export interface SlowMovingStockAlert {
  warehouseId?: number;
  warehouseName?: string;
  productId: number;
  sku: string;
  productName: string;
  categoryName: string;
  unit: string;
  batchId: number;
  batchNumber: string;
  locationId: number;
  locationBarcode: string;
  onHandQty: number;
  availableQty: number;
  purchasePrice?: number;
  holdingValue?: number;
  daysInStock: number;
  lastMovementDate?: string;
  alertLevel: 'DEAD_STOCK' | 'SLOW_MOVING';
  message: string;
  suggestedAction: string;
}

export const inventoryService = {
  async getClosingBalances(warehouseId?: number): Promise<OutboundStock[]> {
    const res = await apiClient.get('/inventory/closing-balances', {
      params: warehouseId ? { warehouseId } : undefined,
    });
    return res.data?.data || [];
  },

  async getInventoryBalances(warehouseId?: number): Promise<StockItem[]> {
    try {
      const res = await apiClient.get('/inventory', {
        params: warehouseId ? { warehouseId } : undefined,
      });
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((inv: any) => {
          const whId = inv.warehouseId || (inv.locationBarcode?.startsWith('WH02') ? 2 : inv.locationBarcode?.startsWith('WH03') ? 3 : inv.locationBarcode?.startsWith('WH04') ? 4 : 1);
          const whName = inv.warehouseName || (whId === 2 ? 'Kho Phân Phối VSIP Bắc Ninh' : whId === 3 ? 'Kho Vận Miền Trung - Đà Nẵng' : whId === 4 ? 'Kho Trung Chuyển Sóng Thần - Bình Dương' : 'Kho Tổng Tân Bình - TP.HCM');
          return {
            id: inv.id,
            productId: inv.productId,
            warehouseId: whId,
            warehouseName: whName,
            locationId: inv.locationId,
            batchId: inv.batchId,
            sku: inv.sku || `SKU-${inv.productId}`,
            name: inv.productName || `Sản phẩm #${inv.productId}`,
            unit: inv.unit || 'Cái',
            locationBarcode: inv.locationBarcode || `LOC-${inv.locationId}`,
            batchNumber: inv.batchNumber || `BATCH-${inv.batchId}`,
            expiryDate: inv.expiryDate || 'N/A',
            onHandQty: inv.onHandQty ?? 0,
            reservedQty: inv.reservedQty ?? 0,
            unavailableQty: inv.unavailableQty ?? 0,
            availableQty: inv.isExpired ? 0 : (inv.availableQty != null ? inv.availableQty : Math.max(0, (inv.onHandQty ?? 0) - (inv.reservedQty ?? 0) - (inv.unavailableQty ?? 0))),
            isExpiringSoon: Boolean(inv.isExpiringSoon),
            isExpired: Boolean(inv.isExpired),
            expiryStatus: inv.expiryStatus || (inv.isExpired ? 'EXPIRED' : inv.isExpiringSoon ? 'EXPIRING_SOON' : 'VALID'),
            daysRemaining: inv.daysRemaining,
          };
        });
      }
      return [];
    } catch (err) {
      console.warn('Backend inventory balances error:', err);
      throw err;
    }
  },

  async getSafetyStockAlerts(warehouseId?: number): Promise<SafetyStockAlert[]> {
    const res = await apiClient.get('/inventory/alerts/safety-stock', {
      params: warehouseId ? { warehouseId } : undefined,
    });
    return res.data?.data || [];
  },

  async getExpiringBatchAlerts(warehouseId?: number): Promise<ExpiringBatchAlert[]> {
    const res = await apiClient.get('/inventory/alerts/expiring', {
      params: warehouseId ? { warehouseId } : undefined,
    });
    return res.data?.data || [];
  },

  async getSlowMovingStockAlerts(warehouseId?: number): Promise<SlowMovingStockAlert[]> {
    const res = await apiClient.get('/inventory/alerts/slow-moving', {
      params: warehouseId ? { warehouseId } : undefined,
    });
    return res.data?.data || [];
  },

  async quarantineBatch(batchId: number, reason?: string): Promise<boolean> {
    try {
      const res = await apiClient.put(`/inventory/batches/${batchId}/quarantine`, null, {
        params: reason ? { reason } : undefined,
      });
      return res.data?.success ?? true;
    } catch (err) {
      console.error('Error quarantining batch:', err);
      throw err;
    }
  },

  async reserveStock(productId: number, locationId: number, batchId: number, requestedQty: number) {
    try {
      const res = await apiClient.post('/inventory/reserve', {
        productId,
        locationId,
        batchId,
        requestedQty,
      });
      return res.data?.data;
    } catch (err) {
      console.warn('Could not call reserve stock API:', err);
      return null;
    }
  },

  async getRecentLedger(params?: {
    warehouseId?: number;
    productId?: number;
    locationId?: number;
    batchId?: number;
    transactionType?: string;
    limit?: number;
  }): Promise<LedgerEntryData[]> {
    try {
      const res = await apiClient.get('/inventory/ledger', { params });
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data.map((l: any) => ({
          id: String(l.id),
          warehouseId: l.warehouseId,
          transactionType: (l.transactionType || 'OUTBOUND') as any,
          referenceCode: l.referenceCode || `TX-${l.id}`,
          locationBarcode: l.locationBarcode || `LOC-${l.locationId}`,
          productSku: l.productSku || `SKU-${l.productId}`,
          productName: l.productName || `Sản phẩm #${l.productId}`,
          batchNumber: l.batchNumber || `BATCH-${l.batchId}`,
          expiryDate: l.expiryDate || 'N/A',
          qtyChange: l.qtyChange ?? 0,
          balanceBefore: l.balanceBefore != null ? l.balanceBefore : ((l.balanceAfter || 0) - (l.qtyChange || 0)),
          balanceAfter: l.balanceAfter ?? 0,
          performedBy: l.performedByName || (l.performedBy ? `Nhân viên #${l.performedBy}` : 'Hệ thống WMS'),
          notes: l.notes || 'Bút toán tự động ghi nhận vào sổ cái',
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
          hashSignature: `SHA256:LEDGER-${l.id}-${l.referenceCode || 'TX'}`,
        }));
      }
      return [];
    } catch (err) {
      console.warn('Backend stock ledger not reachable:', err);
      throw err;
    }
  },

  async getLedgerByReference(referenceCode: string): Promise<LedgerEntryData[]> {
    try {
      const res = await apiClient.get(`/inventory/ledger/reference/${encodeURIComponent(referenceCode)}`);
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((l: any) => ({
          id: String(l.id),
          warehouseId: l.warehouseId,
          transactionType: (l.transactionType || 'TRANSFER') as any,
          referenceCode: l.referenceCode,
          locationBarcode: l.locationBarcode || `LOC-${l.locationId}`,
          productSku: l.productSku || `SKU-${l.productId}`,
          productName: l.productName || `Sản phẩm #${l.productId}`,
          batchNumber: l.batchNumber || `BATCH-${l.batchId}`,
          expiryDate: l.expiryDate || 'N/A',
          qtyChange: l.qtyChange ?? 0,
          balanceBefore: l.balanceBefore != null ? l.balanceBefore : ((l.balanceAfter || 0) - (l.qtyChange || 0)),
          balanceAfter: l.balanceAfter ?? 0,
          performedBy: l.performedByName || 'Hệ thống WMS',
          notes: l.notes || '',
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
          hashSignature: `SHA256:REF-${l.id}`,
        }));
      }
      return [];
    } catch (err) {
      console.warn('Backend getLedgerByReference error:', err);
      return [];
    }
  },

  async transferStock(payload: import('../../labels/types').CreateStockTransferPayload): Promise<import('../../labels/types').StockTransferDto> {
    const res = await apiClient.post('/inventory/transfers', payload);
    return res.data?.data;
  },

  async getStockTransfers(): Promise<import('../../labels/types').StockTransferDto[]> {
    try {
      const res = await apiClient.get('/inventory/transfers');
      return res.data?.data || [];
    } catch (err) {
      console.warn('Backend stock transfers not reachable:', err);
      return [];
    }
  },
};
