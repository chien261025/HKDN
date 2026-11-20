import { apiClient } from '../../../services/api';
import { OutboundOrder, OutboundStock, OutboundStatus } from '../types';
import { SupplierItem } from '../../products/types';
import { PRIMARY_WAREHOUSE } from '../../../config/warehouse';

export const outboundService = {
  async getWarehousePartners(): Promise<Pick<SupplierItem, 'id' | 'code' | 'name'>[]> {
    const res = await apiClient.get('/orders/outbound/partners', { params: { warehouseId: PRIMARY_WAREHOUSE.id } });
    return res.data.data.map((p: any) => ({ id: String(p.id), code: p.code, name: p.name }));
  },
  async getAvailableProducts(includeUnavailable = false): Promise<OutboundStock[]> {
    const res = await apiClient.get('/orders/outbound/available-products', { params: { includeUnavailable } });
    return res.data.data;
  },
  async getOutboundOrders(): Promise<OutboundOrder[]> {
    try {
      const res = await apiClient.get('/orders/outbound');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((o: any) => ({
          id: String(o.id),
          warehouseId: o.warehouseId,
          partnerId: o.partnerId,
          soCode: o.orderCode || `SO-${o.id}`,
          customerName: o.customerName || 'Khách Hàng Doanh Nghiệp',
          shippingAddress: 'Kho Phân Phối Trung Tâm',
          orderDate: o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '',
          requiredDate: '2026-11-30 18:00',
          status: (o.status || 'PENDING') as OutboundStatus,
          priority: 'HIGH' as const,
          lockId: o.status === 'ALLOCATED' ? `LOCK-FEFO-${o.id}` : undefined,
          dispatchCarrier: 'Đội xe nội bộ WMS Logistics',
          notes: o.notes || '',
          items: (o.items && o.items.length > 0)
            ? o.items.map((i: any) => ({
                id: String(i.id),
                productId: i.productId,
                sku: i.sku || `SKU-${i.productId}`,
                productName: i.productName || `Sản phẩm #${i.productId}`,
                requestedQty: i.requestedQty || 0,
                allocatedQty: i.allocatedQty || 0,
                pickedQty: i.pickedQty || 0,
                unit: i.unit || 'Cái',
                allocations: (i.allocations || []).map((a: any) => ({
                  batchNumber: a.batchNumber || `BATCH-${a.batchId}`,
                  expiryDate: a.expiryDate ? String(a.expiryDate) : 'N/A',
                  locationBarcode: a.locationBarcode || `LOC-${a.locationId}`,
                  qtyAllocated: a.allocatedQty || 0,
                  isNearestExpiry: a.isNearestExpiry ?? true,
                })),
              }))
            : [],
        }));
      }
      return [];
    } catch (err) {
      console.warn('Backend outbound orders error:', err);
      return [];
    }
  },

  async createOutboundOrder(order: Partial<OutboundOrder>): Promise<OutboundOrder | null> {
    try {
      const payload = {
        orderCode: order.soCode || 'SO-' + Date.now(),
        warehouseId: order.warehouseId,
        customerName: order.customerName,
        partnerId: order.partnerId,
        status: 'PENDING',
        notes: order.notes,
        items: (order.items || []).map((it: any) => ({
          productId: it.productId,
          requestedQty: it.requestedQty,
          allocatedQty: 0,
          pickedQty: 0,
          unitPrice: 100000,
        })),
      };
      const res = await apiClient.post('/orders/outbound', payload);
      const saved = res.data?.data;
      if (!saved) return null;
      return {
        id: String(saved.id),
        warehouseId: saved.warehouseId,
        partnerId: saved.partnerId,
        soCode: saved.orderCode,
        customerName: saved.customerName,
        shippingAddress: order.shippingAddress || 'Kho Phân Phối',
        orderDate: new Date(saved.createdAt).toLocaleString('vi-VN'),
        requiredDate: order.requiredDate || '2026-11-30',
        status: (saved.status || 'PENDING') as OutboundStatus,
        priority: order.priority || 'HIGH',
        items: (saved.items || []).map((i: any) => ({
          id: String(i.id),
          productId: i.productId,
          sku: i.sku,
          productName: i.productName,
          requestedQty: i.requestedQty,
          allocatedQty: i.allocatedQty,
          pickedQty: i.pickedQty,
          unit: i.unit,
          allocations: (i.allocations || []).map((a: any) => ({
            batchNumber: a.batchNumber,
            expiryDate: a.expiryDate ? String(a.expiryDate) : 'N/A',
            locationBarcode: a.locationBarcode,
            qtyAllocated: a.allocatedQty,
            isNearestExpiry: a.isNearestExpiry ?? true,
          })),
        })),
        notes: saved.notes,
      };
    } catch (err) {
      console.warn('Could not save SO to backend:', err);
      throw err;
    }
  },

  async allocateOrderFefo(id: string): Promise<boolean> {
    try {
      await apiClient.put(`/orders/outbound/${id}/allocate-fefo`);
      return true;
    } catch (err) {
      console.warn('Could not allocate order FEFO:', err);
      throw err;
    }
  },

  async dispatchOrder(id: string): Promise<boolean> {
    try {
      await apiClient.put(`/orders/outbound/${id}/dispatch`);
      return true;
    } catch (err) {
      console.warn('Could not dispatch order on backend:', err);
      throw err;
    }
  },

  async generateFefoPickList(productId: number, requiredQty: number) {
    try {
      const res = await apiClient.post('/orders/outbound/fefo-pick-list', {
        productId,
        requiredQty,
      });
      return res.data?.data;
    } catch (err) {
      console.warn('Could not call fefo-pick-list API:', err);
      return null;
    }
  },
};
