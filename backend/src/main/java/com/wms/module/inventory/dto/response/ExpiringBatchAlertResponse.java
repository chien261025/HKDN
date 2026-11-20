package com.wms.module.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringBatchAlertResponse {
    private Long warehouseId;
    private String warehouseName;

    private Long productId;
    private String sku;
    private String productName;
    private String categoryName;
    private String unit;

    private Long batchId;
    private String batchNumber;
    private String batchStatus; // ACTIVE, QUARANTINE, RECALLED, EXPIRED
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private long daysRemaining;

    private Long locationId;
    private String locationBarcode;

    private int onHandQty;
    private int reservedQty;
    private int availableQty;

    private String alertLevel; // EXPIRED, CRITICAL, WARNING
    private String message;
}
