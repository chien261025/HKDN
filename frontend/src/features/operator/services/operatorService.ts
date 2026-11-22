import { apiClient } from '../../../services/api';

export interface InboundOrderItemDto {
  id: number;
  productId: number;
  expectedQty: number;
  receivedQty: number;
  stockedQty: number;
  remainingQty: number;
  batchNumber?: string;
  expiryDate?: string;
  status: string;
}

export interface InboundOrderDto {
  id: number;
  orderCode: string;
  warehouseId: number;
  supplier?: { name: string };
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
  productSku?: string;
  productName?: string;
  requestedQty: number;
  allocatedQty?: number;
  pickedQty?: number;
  allocations?: any[];
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
  batchId?: number;
  batchNumber: string;
  expiryDate: string;
  daysUntilExpiry?: number;
  locationId?: number;
  binBarcode: string;
  zoneCode?: string;
  pickQty: number;
  picked?: boolean;
}


export interface AuditItemDto {
  id: number;
  auditId: number;
  locationId: number;
  locationBarcode: string;
  zoneCode?: string;
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
  productId: number;
  sku: string;
  barcode?: string;
  productName: string;
  categoryName?: string;
  unit: string;
  batchId?: number;
  batchNumber?: string;
  expiryDate?: string;
  systemQty?: number;
  countedQty?: number | null;
  differenceQty?: number | null;
  status: string; // PENDING, MATCHED, DISCREPANCY, ADJUSTED
  counterNotes?: string;
  countedAt?: string;
}

export interface AuditSessionDto {
  id: number;
  auditCode: string;
  warehouseId?: number;
  status: string;
  notes?: string;
  createdAt: string;
  totalBins?: number;
  countedBins?: number;
  discrepanciesCount?: number;
  items?: AuditItemDto[];
}

export interface ProductDto {
  id: number;
  sku: string;
  barcode: string;
  name: string;
  unit: string;
  category?: string;
  storageZone?: string;
  storageCondition?: string;
  weightKg?: number;
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
   * Gọi thuật toán gợi ý ô kệ cất hàng Put-away từ Backend
   */
  async suggestPutawayLocation(warehouseId: number, preferredZone: string, totalWeightKg: number): Promise<LocationDto> {
    const res = await apiClient.post<{ success: boolean; data: LocationDto }>('/orders/inbound/suggest-location', {
      preferredZone,
      warehouseId,
      totalWeightKg,
    });
    return res.data.data;
  },

  /**
   * Thực hiện cất hàng lên ô kệ (Put-away Execution)
   */
  async executePutaway(payload: {
    orderId: number;
    orderItemId?: number;
    productId: number;
    locationId: number;
    quantity: number;
    expectedStockedQty: number;
    batchNumber?: string;
    expiryDate?: string;
  }): Promise<InboundOrderDto> {
    const res = await apiClient.post<{ success: boolean; data: InboundOrderDto }>('/orders/inbound/putaway', payload);
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

  /**
   * Lấy số dư tồn kho chi tiết tại các ô kệ
   */
  async getInventories(): Promise<any[]> {
    const res = await apiClient.get<{ success: boolean; data: any[] }>('/inventory');
    return res.data.data || [];
  },

  /**
   * Thực hiện điều chuyển tồn kho giữa 2 ô kệ từ thiết bị PDA
   */
  async executeTransfer(payload: {
    productId: number;
    fromLocationId: number;
    toLocationId: number;
    batchId: number;
    quantity: number;
    notes?: string;
  }): Promise<any> {
    const res = await apiClient.post('/inventory/transfers', payload);
    return res.data.data;
  },

  /**
   * Ghi nhận số lượng đếm kiểm kê thực tế cho 1 ô kệ & sản phẩm
   */
  async recordAuditCount(
    auditId: number,
    locationId: number,
    productId: number,
    actualQuantity: number,
    notes?: string,
    itemId?: number
  ): Promise<any> {
    const res = await apiClient.post(`/inventory/audit/${auditId}/count`, {
      itemId,
      locationId,
      productId,
      actualQuantity,
      notes,
    });
    return res.data.data;
  },
};


