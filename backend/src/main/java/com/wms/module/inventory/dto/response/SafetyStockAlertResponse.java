package com.wms.module.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyStockAlertResponse {
    private Long productId;
    private String sku;
    private String barcode;
    private String productName;
    private String categoryName;
    private String unit;
    private int currentOnHand;
    private int currentReserved;
    private int currentAvailable;
    private int safetyStock;
    private int reorderPoint;
    private int suggestedReorderQty;
    private String alertLevel; // "CRITICAL", "WARNING", "OUT_OF_STOCK", "NORMAL"
    private String message;
}
