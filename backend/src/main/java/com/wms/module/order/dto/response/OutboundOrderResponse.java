package com.wms.module.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundOrderResponse {
    private Long id;
    private String orderCode;
    private Long warehouseId;
    private String customerName;
    private String status;
    private Long createdBy;
    private String createdByName;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    @Builder.Default
    private List<OutboundOrderItemResponse> items = new ArrayList<>();
}

