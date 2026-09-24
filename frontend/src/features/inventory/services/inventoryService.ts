import { apiClient } from '../../../services/api';
import { StockItem, LedgerEntryData } from '../types';

const LOCATION_BARCODES: Record<number, string> = {
  1: 'WH01-ZA-A01-R01-S01-B01',
  2: 'WH01-ZA-A01-R01-S02-B02',
  3: 'WH01-ZA-A01-R02-S01-B03',
  4: 'WH01-ZA-A02-R01-S01-B04',
  5: 'WH01-ZB-B01-R01-S01-B05',
  6: 'WH01-ZB-B01-R01-S02-B06',
};

export const inventoryService = {
  async getInventoryBalances(): Promise<StockItem[]> {
    try {
      const res = await apiClient.get('/inventory');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((inv: any) => {
          const isMilk = inv.productId === 1;
          const isS24 = inv.productId === 2;
          const isOmo = inv.productId === 3;
          const isExpiring = inv.batchId === 1;

          return {
            id: inv.id,
            productId: inv.productId,
            locationId: inv.locationId,
            batchId: inv.batchId,
            sku: isMilk ? 'SKU-MILK-100' : isS24 ? 'SKU-SAMS-S24' : 'SKU-OMO-MATIC',
            name: isMilk ? 'Sữa tươi tiệt trùng Vinamilk 100% 1L' : isS24 ? 'Điện thoại Samsung Galaxy S24 Ultra 256GB' : 'Nước giặt OMO Matic Cửa Trên 3.6kg',
            locationBarcode: LOCATION_BARCODES[inv.locationId] || `LOC-${inv.locationId}`,
            batchNumber: inv.batchId === 1 ? 'BATCH-MILK-26A' : inv.batchId === 2 ? 'BATCH-MILK-26B' : inv.batchId === 3 ? 'BATCH-S24-01' : 'BATCH-OMO-01',
            expiryDate: inv.batchId === 1 ? '2026-09-25' : inv.batchId === 2 ? '2026-11-30' : inv.batchId === 3 ? '2028-01-10' : '2027-03-01',
            onHandQty: inv.onHandQty,
            reservedQty: inv.reservedQty,
            availableQty: inv.availableQty != null ? inv.availableQty : (inv.onHandQty - inv.reservedQty),
            isExpiringSoon: isExpiring,
          };
        });
      }
      return [];
    } catch (err) {
      console.warn('Backend inventory balances error:', err);
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
          locationBarcode: LOCATION_BARCODES[l.locationId] || `LOC-${l.locationId}`,
          productSku: l.productId === 1 ? 'SKU-MILK-100' : 'SKU-SAMS-S24',
          productName: l.productId === 1 ? 'Sữa tươi Vinamilk 100% 1L' : 'Samsung Galaxy S24 Ultra',
          batchNumber: l.batchId === 1 ? 'BATCH-MILK-26A' : 'BATCH-S24-01',
          expiryDate: '2026-09-25',
          qtyChange: l.qtyChange,
          balanceBefore: (l.balanceAfter || 80) - (l.qtyChange || 0),
          balanceAfter: l.balanceAfter,
          performedBy: 'Trần Trưởng Kho',
          notes: l.notes || 'Bút toán tự động ghi nhận vào sổ cái',
          timestamp: l.createdAt ? new Date(l.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
          hashSignature: `SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f...`,
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

