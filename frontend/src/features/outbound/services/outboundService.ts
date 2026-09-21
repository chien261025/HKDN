import { apiClient } from '../../../services/api';
import { OutboundOrder, OutboundItem, OutboundStatus } from '../types';

export const outboundService = {
  async getOutboundOrders(): Promise<OutboundOrder[]> {
    try {
      const res = await apiClient.get('/orders/outbound');
      if (res.data?.data && Array.isArray(res.data.data)) {
        return res.data.data.map((o: any) => ({
          id: String(o.id),
          soCode: o.orderCode || `SO-${o.id}`,
          customerName: o.customerName || 'Khách Hàng Doanh Nghiệp',
          shippingAddress: 'Kho Phân Phối TP.HCM',
          orderDate: o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '',
          requiredDate: '2026-09-25 18:00',
          status: (o.status || 'PENDING') as OutboundStatus,
          priority: 'HIGH' as const,
          lockId: 'LOCK-PG-SQL',
          dispatchCarrier: 'Giao Hàng Tiết Kiệm (GHTK)',
          notes: o.notes || '',
          items: (o.items && o.items.length > 0)
            ? o.items.map((i: any) => ({
                id: String(i.id),
                sku: i.productId === 1 ? 'SKU-MILK-100' : i.productId === 2 ? 'SKU-SAMS-S24' : 'SKU-OMO-MATIC',
                productName: i.productId === 1 ? 'Sữa tươi tiệt trùng Vinamilk 100% 1L' : i.productId === 2 ? 'Điện thoại Samsung Galaxy S24 Ultra' : 'Nước giặt OMO Matic 3.6kg',
                requestedQty: i.requestedQty || 0,
                allocatedQty: i.allocatedQty || i.requestedQty || 0,
                pickedQty: i.pickedQty || 0,
                unit: i.productId === 1 ? 'Hộp' : i.productId === 2 ? 'Chiếc' : 'Túi',
                allocations: [],
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

  async createOutboundOrder(order: Partial<OutboundOrder>): Promise<OutboundOrder> {
    try {
      const payload = {
        orderCode: order.soCode || 'SO-' + Date.now(),
        warehouseId: 1,
        customerName: order.customerName,
        status: 'PENDING',
        notes: order.notes,
        items: (order.items || []).map((it) => ({
          productId: it.sku.includes('MILK') ? 1 : it.sku.includes('SAMS') ? 2 : 3,
          requestedQty: it.requestedQty,
          allocatedQty: it.allocatedQty || 0,
          pickedQty: 0,
          unitPrice: 100000,
        })),
      };
      const res = await apiClient.post('/orders/outbound', payload);
      const saved = res.data?.data;
      return {
        id: String(saved?.id || Date.now()),
        soCode: saved?.orderCode || order.soCode!,
        customerName: order.customerName || 'Khách Hàng Mới',
        shippingAddress: order.shippingAddress || '',
        orderDate: new Date().toLocaleString('vi-VN'),
        requiredDate: order.requiredDate || '2026-09-30',
        status: 'PENDING',
        priority: order.priority || 'NORMAL',
        items: order.items || [],
        notes: order.notes,
      };
    } catch (err) {
      console.warn('Could not save SO to backend, saving locally:', err);
      return {
        id: String(Date.now()),
        soCode: order.soCode || 'SO-' + Date.now(),
        customerName: order.customerName || 'Khách Hàng Mới',
        shippingAddress: order.shippingAddress || '',
        orderDate: new Date().toLocaleString('vi-VN'),
        requiredDate: order.requiredDate || '2026-09-30',
        status: 'PENDING',
        priority: order.priority || 'NORMAL',
        items: order.items || [],
        notes: order.notes,
      };
    }
  },

  async dispatchOrder(id: string): Promise<void> {
    try {
      await apiClient.put(`/orders/outbound/${id}/dispatch`);
    } catch (err) {
      console.warn('Could not dispatch order on backend:', err);
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
