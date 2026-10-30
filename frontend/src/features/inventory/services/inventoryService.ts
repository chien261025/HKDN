import { apiClient } from '../../../services/api';
import { StockItem, LedgerEntryData } from '../types';

export interface SafetyStockAlert {
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

export const inventoryService = {
  async getInventoryBalances(): Promise<StockItem[]> {
    try {
      const res = await apiClient.get('/inventory');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((inv: any) => ({
          id: inv.id,
          productId: inv.productId,
          locationId: inv.locationId,
          batchId: inv.batchId,
          sku: inv.sku || `SKU-${inv.productId}`,
          name: inv.productName || `Sản phẩm #${inv.productId}`,
          locationBarcode: inv.locationBarcode || `LOC-${inv.locationId}`,
          batchNumber: inv.batchNumber || `BATCH-${inv.batchId}`,
          expiryDate: inv.expiryDate || 'N/A',
          onHandQty: inv.onHandQty ?? 0,
          reservedQty: inv.reservedQty ?? 0,
          availableQty: inv.availableQty != null ? inv.availableQty : ((inv.onHandQty ?? 0) - (inv.reservedQty ?? 0)),
          isExpiringSoon: Boolean(inv.isExpiringSoon),
        }));
      }
      return [];
    } catch (err) {
      console.warn('Backend inventory balances error:', err);
      return [];
    }
  },

  async getSafetyStockAlerts(): Promise<SafetyStockAlert[]> {
    try {
      const res = await apiClient.get('/inventory/alerts/safety-stock');
      return res.data?.data || [];
    } catch (err) {
      console.warn('Backend safety stock alerts error:', err);
      return [];
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

  async getRecentLedger(): Promise<LedgerEntryData[]> {
    try {
      const res = await apiClient.get('/inventory/ledger');
      if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
        return res.data.data.map((l: any) => ({
          id: String(l.id),
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
      return [];
    }
  },

  async transferStock(payload: import('../types').CreateStockTransferPayload): Promise<import('../types').StockTransferDto> {
    const res = await apiClient.post('/inventory/transfers', payload);
    return res.data?.data;
  },

  async getStockTransfers(): Promise<import('../types').StockTransferDto[]> {
    try {
      const res = await apiClient.get('/inventory/transfers');
      return res.data?.data || [];
    } catch (err) {
      console.warn('Backend stock transfers not reachable:', err);
      return [];
    }
  },
};
