package com.wms.module.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundOrderItemResponse {
    private Long id;
    private Long productId;
    private String sku;
    private String barcode;
    private String productName;
    private String categoryName;
    private String unit;

    private Integer requestedQty;
    private Integer allocatedQty;
    private Integer pickedQty;
    private BigDecimal unitPrice;
    private String status;
    private Instant createdAt;

    @Builder.Default
    private List<PickAllocationResponse> allocations = new ArrayList<>();
}

