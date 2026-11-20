import { apiClient } from '../../../services/api';
import { InboundOrder, InboundStatus, ReceiptLine } from '../types';

export const inboundService = {
  async getInboundOrders(warehouseId?: number): Promise<InboundOrder[]> {
    try {
      const res = await apiClient.get('/orders/inbound', {
        params: warehouseId ? { warehouseId } : undefined,
      });
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((o: any) => {
          const items = (o.items && o.items.length > 0)
            ? o.items.map((i: any) => ({
                id: String(i.id),
                productId: i.productId,
                productBatchId: i.productBatchId,
                sku: i.product?.sku || i.sku || `SKU-${i.productId}`,
                productName: i.product?.name || i.productName || `Sản phẩm #${i.productId}`,
                expectedQty: i.expectedQty || 0,
                receivedQty: i.receivedQty || 0,
                rejectedQty: i.rejectedQty,
                stockedQty: i.stockedQty,
                weightKg: i.product?.weightKg,
                storageCondition: i.product?.storageCondition,
                status: i.status,
                batchNumber: i.batchNumber || '',
                expiryDate: i.expiryDate || '',
                unitPrice: Number(i.unitPrice || i.product?.purchasePrice || 0),
                unit: i.product?.unit || i.unit || 'Cái',
              }))
            : [];

          const totalValue = items.reduce((sum: number, it: any) => sum + (it.expectedQty * (it.unitPrice || 0)), 0);

          return {
            id: String(o.id),
            warehouseId: o.warehouseId,
            poCode: o.orderCode || `PO-${o.id}`,
            supplierCode: o.supplier?.code || `SUP-${o.supplierId}`,
            supplierName: o.supplier?.name || `Nhà cung cấp #${o.supplierId}`,
            expectedDeliveryDate: o.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : '2026-09-25',
            createdAt: o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '',
            status: (o.status || 'PENDING') as InboundStatus,
            approvedBy: 'Trần Trưởng Kho',
            notes: o.notes || '',
            items,
            totalValue,
          };
        });
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
      warehouseId: order.warehouseId || 1,
      supplierId: order.supplierId,
      status: 'PENDING',
      notes: order.notes,
      items: (order.items || []).map((it: any) => ({
        productId: it.productId,
        expectedQty: it.expectedQty,
        batchNumber: it.batchNumber || null,
        expiryDate: it.expiryDate || null,
        unitPrice: it.unitPrice || 0,
      })),
    };
    const res = await apiClient.post('/orders/inbound', payload);
    const saved = res.data?.data;
    if (!saved?.id) throw new Error('Backend did not return a saved inbound order');
    const items = (saved.items || []).map((item: any) => ({
      id: String(item.id),
      productId: item.productId,
      productBatchId: item.productBatchId,
      sku: item.product?.sku || `SKU-${item.productId}`,
      productName: item.product?.name || `Sản phẩm #${item.productId}`,
      expectedQty: item.expectedQty,
      receivedQty: item.receivedQty || 0,
      stockedQty: 0,
      batchNumber: item.batchNumber,
      status: item.status,
      unitPrice: Number(item.unitPrice || 0),
      expiryDate: item.expiryDate,
      unit: item.product?.unit || 'Cái',
    }));
    return {
      id: String(saved.id),
      poCode: saved.orderCode,
      supplierCode: order.supplierCode!,
      supplierName: order.supplierName!,
      expectedDeliveryDate: order.expectedDeliveryDate || '2026-09-30',
      createdAt: new Date().toLocaleString('vi-VN'),
      status: 'PENDING',
      items,
      totalValue: items.reduce((sum: number, it: any) => sum + (it.expectedQty * (it.unitPrice || 0)), 0),
      notes: order.notes,
      approvedBy: order.approvedBy || 'Trần Trưởng Kho',
    };
  },

  async receiveOrder(id: string, lines: ReceiptLine[]): Promise<void> {
    await apiClient.put(`/orders/inbound/${id}/receive`, {
      items: lines.map(line => ({ ...line, id: Number(line.id), expiryDate: line.expiryDate || null })),
    });
  },

  async suggestLocation(warehouseId: number, preferredZone: string, totalWeightKg: number) {
    try {
      const res = await apiClient.post('/orders/inbound/suggest-location', {
        warehouseId,
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
    orderItemId: number;
    productId: number;
    locationId: number;
    quantity: number;
    expectedStockedQty: number;
    batchNumber?: string;
    expiryDate?: string;
  }): Promise<void> {
    await apiClient.post('/orders/inbound/putaway', payload);
  },

  async closeOrder(orderId: string | number, reason: string = 'Vượt sức chứa kho / Đặt nhầm'): Promise<void> {
    await apiClient.put(`/orders/inbound/${orderId}/close?reason=${encodeURIComponent(reason)}`);
  },
};
