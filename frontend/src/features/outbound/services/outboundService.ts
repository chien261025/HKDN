import { apiClient } from '../../../services/api';
import { OutboundOrder, OutboundStock, OutboundStatus } from '../types';
import { SupplierItem } from '../../products/types';
import { PRIMARY_WAREHOUSE } from '../../../config/warehouse';

export const cleanOutboundText = (str: string = ''): string => {
  if (!str) return '';
  // Fix double/triple UTF-8 Mojibake from legacy seeds
  if (str.includes('WinMart') || str.includes('SiÃ')) {
    return str.includes('Cộng') || str.includes('CÃ') ? 'Siêu thị WinMart Cộng Hòa' : 'Hệ thống Siêu thị WinMart Thảo Điền';
  }
  if (str.includes('Co.opmart') || str.includes('Coop') || str.includes('Cá»')) {
    return str.includes('Tân Phú') || str.includes('TÃ') ? 'Đại Siêu thị Co.opmart Tân Phú' : 'Siêu thị Co.opmart Cống Quỳnh';
  }
  if (str.includes('FPT')) return 'Chuỗi bán lẻ FPT Shop';
  if (str.includes('Lotte') || str.includes('Lotte Mart')) return 'Đại siêu thị Lotte Mart Quận 7';
  if (str.includes('Thế Giới') || str.includes('TGDD') || str.includes('ThÃ') || str.includes('Hoàng Hoa Thám')) {
    return 'Thế Giới Di Động Hoàng Hoa Thám';
  }
  if (str.includes('Bách Hóa') || str.includes('BÃ¡ch') || str.includes('Trường Chinh')) {
    return 'Bách Hóa Xanh Trường Chinh';
  }
  if (str.includes('Điện Máy') || str.includes('Miền Đông')) {
    return 'Chuỗi Điện Máy Xanh Miền Đông';
  }
  return str;
};

export const outboundService = {
  async getWarehousePartners(warehouseId: number = PRIMARY_WAREHOUSE.id): Promise<Pick<SupplierItem, 'id' | 'code' | 'name'>[]> {
    const res = await apiClient.get('/orders/outbound/partners', { params: { warehouseId } });
    return (res.data.data || []).map((p: any) => ({
      id: String(p.id),
      code: p.code,
      name: cleanOutboundText(p.name),
    }));
  },
  async getAvailableProducts(includeUnavailable = false): Promise<OutboundStock[]> {
    const res = await apiClient.get('/orders/outbound/available-products', { params: { includeUnavailable } });
    return res.data.data;
  },
  async getOutboundOrders(warehouseId?: string | number): Promise<OutboundOrder[]> {
    try {
      const cleanWh = (!warehouseId || warehouseId === 'ALL')
        ? undefined
        : (String(warehouseId).match(/\d+/) ? parseInt(String(warehouseId).match(/\d+/)![0], 10) : undefined);

      const res = await apiClient.get('/orders/outbound', {
        params: cleanWh ? { warehouseId: cleanWh } : {},
      });
      if (res.data?.data && Array.isArray(res.data.data)) {
        let ordersList = res.data.data.map((o: any) => ({
          id: String(o.id),
          warehouseId: o.warehouseId || 1,
          soCode: o.orderCode || `SO-${o.id}`,
          customerName: cleanOutboundText(o.customerName || 'Khách Hàng Doanh Nghiệp'),
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

        if (cleanWh) {
          ordersList = ordersList.filter((o: any) => o.warehouseId === cleanWh);
        }
        return ordersList;
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

  async confirmPicking(id: string, payload?: any): Promise<boolean> {
    try {
      await apiClient.put(`/orders/outbound/${id}/confirm-picking`, payload || {});
      return true;
    } catch (err) {
      console.warn('Could not confirm picking on backend:', err);
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

  async cancelOrder(id: string): Promise<boolean> {
    try {
      await apiClient.put(`/orders/outbound/${id}/cancel`);
      return true;
    } catch (err) {
      console.warn('Could not cancel outbound order on backend:', err);
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
