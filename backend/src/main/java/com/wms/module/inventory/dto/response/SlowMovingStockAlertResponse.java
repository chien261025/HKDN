package com.wms.module.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SlowMovingStockAlertResponse {
    private Long warehouseId;
    private String warehouseName;

    private Long productId;
    private String sku;
    private String productName;
    private String categoryName;
    private String unit;

    private Long batchId;
    private String batchNumber;

    private Long locationId;
    private String locationBarcode;

    private int onHandQty;
    private int availableQty;
    private BigDecimal purchasePrice;
    private BigDecimal holdingValue; // Vốn bị chôn đọng = onHandQty * purchasePrice
    private long daysInStock;
    private Instant lastMovementDate;

    private String alertLevel; // DEAD_STOCK, SLOW_MOVING
    private String message;
    private String suggestedAction;
}
