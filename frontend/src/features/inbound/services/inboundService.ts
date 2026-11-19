import { apiClient } from '../../../services/api';
import { InboundOrder, InboundStatus } from '../types';

export const inboundService = {
  async getInboundOrders(): Promise<InboundOrder[]> {
    try {
      const res = await apiClient.get('/orders/inbound');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((o: any) => ({
          id: String(o.id),
          poCode: o.orderCode || `PO-${o.id}`,
          supplierCode: o.supplier?.code || `SUP-${o.supplierId}`,
          supplierName: o.supplier?.name || `Nhà cung cấp #${o.supplierId}`,
          expectedDeliveryDate: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '2026-09-25',
          createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '',
          status: (o.status || 'PENDING') as InboundStatus,
          approvedBy: 'Trần Trưởng Kho',
          notes: o.notes || '',
          items: (o.items && o.items.length > 0)
            ? o.items.map((i: any) => ({
                id: String(i.id),
                productId: i.productId,
                productBatchId: i.productBatchId,
                // ✅ Lấy tên/SKU từ quan hệ product thực tế của backend
                sku: i.product?.sku || i.sku || `SKU-${i.productId}`,
                productName: i.product?.name || i.productName || `Sản phẩm #${i.productId}`,
                expectedQty: i.expectedQty || 0,
                receivedQty: i.receivedQty || 0,
                stockedQty: o.status === 'STOCKED' ? (i.expectedQty || 0) : 0,
                status: i.status,
                batchNumber: i.batchNumber || 'BATCH-NEW',
                expiryDate: i.expiryDate || '',
                unit: i.product?.unit || i.unit || 'Cái',
              }))
            : [],
        }));
      }
      return [];
    } catch (err) {
      console.warn('Backend inbound orders error:', err);
      throw err;
    }
  },

  async createInboundOrder(order: Partial<InboundOrder> & { supplierId?: number }): Promise<InboundOrder> {
      const payload = {
        orderCode: order.poCode || 'PO-' + Date.now(),
        warehouseId: 1,
        supplierId: order.supplierId,
        status: 'PENDING',
        notes: order.notes,
        items: (order.items || []).map((it: any) => ({
          // ✅ Dùng productId thực từ item (đã được set từ CreatePoModal qua productService.getProducts())
          productId: it.productId,
          expectedQty: it.expectedQty,
          batchNumber: it.batchNumber || 'BATCH-' + Date.now().toString().slice(-4),
          expiryDate: it.expiryDate || '2026-12-31',
          unitPrice: 50000,
        })),
      };
      const res = await apiClient.post('/orders/inbound', payload);
      const saved = res.data?.data;
      if (!saved?.id) throw new Error('Backend did not return a saved inbound order');
      return {
        id: String(saved.id),
        poCode: saved.orderCode,
        supplierCode: order.supplierCode!,
        supplierName: order.supplierName!,
        expectedDeliveryDate: order.expectedDeliveryDate || '2026-09-30',
        createdAt: new Date().toLocaleString('vi-VN'),
        status: 'PENDING',
        items: (saved.items || []).map((item: any) => ({
          id: String(item.id), productId: item.productId,
          productBatchId: item.productBatchId,
          sku: item.product?.sku || `SKU-${item.productId}`,
          productName: item.product?.name || `Sản phẩm #${item.productId}`,
          expectedQty: item.expectedQty, receivedQty: item.receivedQty || 0,
          stockedQty: 0, batchNumber: item.batchNumber,
          status: item.status,
          expiryDate: item.expiryDate, unit: item.product?.unit || 'Cái',
        })),
        notes: order.notes,
        approvedBy: order.approvedBy || 'Trần Trưởng Kho',
      };

  },

  async receiveOrder(id: string): Promise<void> {
    await apiClient.put(`/orders/inbound/${id}/receive`);
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

  async executePutaway(payload: {
    orderId: number;
    productId: number;
    orderItemId: number;
    locationId: number;
    quantity: number;
    batchNumber?: string;
    expiryDate?: string;
  }): Promise<void> {
    await apiClient.post('/orders/inbound/putaway', payload);
  },
};
