package com.wms.module.order.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickAllocationResponse {
    private Long id;
    private Long outboundOrderItemId;
    private Long productId;
    private String productSku;
    private String productName;

    private Long locationId;
    private String locationBarcode;
    private String zoneCode;

    private Long batchId;
    private String batchNumber;
    private LocalDate expiryDate;
    private Long daysRemaining;
    private Boolean isNearestExpiry;

    private Integer allocatedQty;
    private Integer pickedQty;
    private String status; // ALLOCATED, PICKED, CANCELLED
    private Instant createdAt;
    private Instant pickedAt;
}

