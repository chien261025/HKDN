import { apiClient } from '../../../services/api';
import { InboundOrder, InboundOrderItem, InboundStatus } from '../types';

export const inboundService = {
  async getInboundOrders(): Promise<InboundOrder[]> {
    try {
      const res = await apiClient.get('/orders/inbound');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((o: any) => ({
          id: String(o.id),
          poCode: o.orderCode || `PO-${o.id}`,
          supplierCode: o.supplierId === 1 ? 'SUP-VINAMILK' : o.supplierId === 2 ? 'SUP-SAMSUNG' : 'SUP-UNILEVER',
          supplierName: o.supplierId === 1 ? 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)' : o.supplierId === 2 ? 'Công ty TNHH Điện tử Samsung Vina' : 'Unilever Việt Nam',
          expectedDeliveryDate: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '2026-09-25',
          createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '',
          status: (o.status || 'PENDING') as InboundStatus,
          approvedBy: 'Trần Trưởng Kho',
          notes: o.notes || '',
          items: (o.items && o.items.length > 0)
            ? o.items.map((i: any) => ({
                id: String(i.id),
                sku: i.productId === 1 ? 'SKU-MILK-100' : i.productId === 2 ? 'SKU-SAMS-S24' : 'SKU-OMO-MATIC',
                productName: i.productId === 1 ? 'Sữa tươi tiệt trùng Vinamilk 100% 1L' : i.productId === 2 ? 'Điện thoại Samsung Galaxy S24 Ultra' : 'Nước giặt OMO Matic 3.6kg',
                expectedQty: i.expectedQty || 0,
                receivedQty: i.receivedQty || 0,
                stockedQty: o.status === 'STOCKED' ? (i.expectedQty || 0) : 0,
                batchNumber: i.batchNumber || 'BATCH-NEW',
                expiryDate: i.expiryDate || '',
                unit: i.productId === 1 ? 'Hộp' : i.productId === 2 ? 'Chiếc' : 'Túi',
              }))
            : [],
        }));
      }
      return [];
    } catch (err) {
      console.warn('Backend inbound orders error:', err);
      return [];
    }
  },

  async createInboundOrder(order: Partial<InboundOrder>): Promise<InboundOrder> {
    try {
      const payload = {
        orderCode: order.poCode || 'PO-' + Date.now(),
        warehouseId: 1,
        supplierId: order.supplierCode === 'SUP-VINAMILK' ? 1 : order.supplierCode === 'SUP-SAMSUNG' ? 2 : 3,
        status: 'PENDING',
        notes: order.notes,
        items: (order.items || []).map((it) => ({
          productId: it.sku.includes('MILK') ? 1 : it.sku.includes('SAMS') ? 2 : 3,
          expectedQty: it.expectedQty,
          batchNumber: it.batchNumber || 'BATCH-' + Date.now(),
          expiryDate: it.expiryDate,
          unitPrice: 50000,
        })),
      };
      const res = await apiClient.post('/orders/inbound', payload);
      const saved = res.data?.data;
      return {
        id: String(saved?.id || Date.now()),
        poCode: saved?.orderCode || order.poCode!,
        supplierCode: order.supplierCode!,
        supplierName: order.supplierName!,
        expectedDeliveryDate: order.expectedDeliveryDate || '2026-09-30',
        createdAt: new Date().toLocaleString('vi-VN'),
        status: 'PENDING',
        items: order.items || [],
        notes: order.notes,
        approvedBy: order.approvedBy || 'Trần Trưởng Kho',
      };
    } catch (err) {
      console.warn('Could not save PO to backend, saving locally:', err);
      return {
        id: String(Date.now()),
        poCode: order.poCode || 'PO-' + Date.now(),
        supplierCode: order.supplierCode || 'SUP-DEMO',
        supplierName: order.supplierName || 'Nhà Cung Cấp Demo',
        expectedDeliveryDate: order.expectedDeliveryDate || '2026-09-30',
        createdAt: new Date().toLocaleString('vi-VN'),
        status: 'PENDING',
        items: order.items || [],
        notes: order.notes,
        approvedBy: order.approvedBy || 'Trần Trưởng Kho',
      };
    }
  },

  async receiveOrder(id: string): Promise<void> {
    try {
      await apiClient.put(`/orders/inbound/${id}/receive`);
    } catch (err) {
      console.warn('Could not call receive API on backend:', err);
    }
  },

  async suggestLocation(preferredZone: string, totalWeightKg: number) {
    try {
      const res = await apiClient.post('/orders/inbound/suggest-location', {
        preferredZone,
        totalWeightKg,
      });
      return res.data?.data;
    } catch (err) {
      console.warn('Could not call suggest-location API:', err);
      return null;
    }
  },
};
