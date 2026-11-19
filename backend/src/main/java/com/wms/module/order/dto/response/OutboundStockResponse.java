package com.wms.module.order.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OutboundStockResponse {
    private Long productId;
    private Long warehouseId;
    private String sku;
    private String name;
    private String unit;
    private int onHandQty;
    private int availableQty;
}
