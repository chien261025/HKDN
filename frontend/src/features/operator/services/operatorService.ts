import { apiClient } from '../../../services/api';

export interface InboundOrderItemDto {
  id: number;
  productId: number;
  expectedQty: number;
  receivedQty: number;
  batchNumber?: string;
  status: string;
}

export interface InboundOrderDto {
  id: number;
  orderCode: string;
  warehouseId?: number;
  supplierId?: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  items?: InboundOrderItemDto[];
}

export interface OutboundOrderItemDto {
  id: number;
  productId: number;
  requestedQty: number;
  allocatedQty?: number;
}

export interface OutboundOrderDto {
  id: number;
  orderCode: string;
  customerName?: string;
  shippingAddress?: string;
  status: string;
  notes?: string;
  createdAt: string;
  items?: OutboundOrderItemDto[];
}

export interface LocationDto {
  id: number;
  warehouseId?: number;
  zoneCode: string;
  aisle: string;
  rack: string;
  shelf: string;
  bin: string;
  binBarcode: string;
  maxWeightKg: number;
  isActive: boolean;
}

export interface PickListItemResponseDto {
  stepOrder: number;
  productSku?: string;
  productName?: string;
  productId?: number;
  batchNumber: string;
  expiryDate: string;
  locationId?: number;
  binBarcode: string;
  pickQty: number;
  picked?: boolean;
}


export interface AuditSessionDto {
  id: number;
  auditCode: string;
  warehouseId?: number;
  status: string;
  notes?: string;
  createdAt: string;
}

export interface ProductDto {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  category?: string;
  storageZone?: string;
}

export const operatorService = {
  /**
   * Lấy danh sách các đơn nhập kho PO từ database
   */
  async getInboundOrders(): Promise<InboundOrderDto[]> {
    const res = await apiClient.get<{ success: boolean; data: InboundOrderDto[] }>('/orders/inbound');
    return res.data.data || [];
  },

  /**
   * Xác nhận thực nhận đơn PO vào kho Staging (chuyển trạng thái sang RECEIVED)
   */
  async confirmReceiveInboundOrder(orderId: number): Promise<InboundOrderDto> {
    const res = await apiClient.put<{ success: boolean; data: InboundOrderDto }>(`/orders/inbound/${orderId}/receive`);
    return res.data.data;
  },

  /**
   * Gọi thuật toán gợi ý ô kệ cất hàng Put-away từ Backend
   */
  async suggestPutawayLocation(preferredZone: string, totalWeightKg: number): Promise<LocationDto> {
    const res = await apiClient.post<{ success: boolean; data: LocationDto }>('/orders/inbound/suggest-location', {
      preferredZone,
      totalWeightKg,
    });
    return res.data.data;
  },

  /**
   * Lấy danh sách các đơn xuất kho SO từ database
   */
  async getOutboundOrders(): Promise<OutboundOrderDto[]> {
    const res = await apiClient.get<{ success: boolean; data: OutboundOrderDto[] }>('/orders/outbound');
    return res.data.data || [];
  },

  /**
   * Gọi thuật toán FEFO sinh danh sách bước nhặt hàng theo lô cận hạn nhất
   */
  async getFefoPickList(productId: number, requiredQty: number): Promise<PickListItemResponseDto[]> {
    const res = await apiClient.post<{ success: boolean; data: PickListItemResponseDto[] }>('/orders/outbound/fefo-pick-list', {
      productId,
      requiredQty,
    });
    return res.data.data || [];
  },

  /**
   * Xác nhận xuất kho và bàn giao vận chuyển đơn SO (chuyển sang DISPATCHED)
   */
  async confirmDispatchOrder(orderId: number): Promise<OutboundOrderDto> {
    const res = await apiClient.put<{ success: boolean; data: OutboundOrderDto }>(`/orders/outbound/${orderId}/dispatch`);
    return res.data.data;
  },

  /**
   * Lấy danh mục sản phẩm từ Master Data
   */
  async getProducts(): Promise<ProductDto[]> {
    const res = await apiClient.get<{ success: boolean; data: ProductDto[] }>('/masterdata/products');
    return res.data.data || [];
  },

  /**
   * Lấy danh sách sơ đồ ô kệ từ Master Data
   */
  async getLocations(): Promise<LocationDto[]> {
    const res = await apiClient.get<{ success: boolean; data: LocationDto[] }>('/masterdata/locations');
    return res.data.data || [];
  },

  /**
   * Lấy danh sách phiên kiểm kê đang mở
   */
  async getAuditSessions(): Promise<AuditSessionDto[]> {
    const res = await apiClient.get<{ success: boolean; data: AuditSessionDto[] }>('/inventory/audit');
    return res.data.data || [];
  },

  /**
   * Gửi kết quả kiểm kê mù từ PDA lên backend
   */
  async submitBlindCount(locationBarcode: string, countedQty: number, notes?: string): Promise<any> {
    const payload = {
      auditCode: `BLIND-${Date.now().toString().slice(-6)}`,
      auditType: 'CYCLE_COUNT',
      warehouseId: 1,
      createdBy: 1,
      notes: notes || `Kiểm kê mù tại ô ${locationBarcode}`,
    };
    const res = await apiClient.post('/inventory/audit', payload);
    return res.data;
  },
};

