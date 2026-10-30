package com.wms.module.inventory.dto.response;

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
public class InventoryBalanceResponse {
    private Long id;
    private Long productId;
    private String sku;
    private String barcode;
    private String productName;
    private String categoryName;
    private String unit;

    private Long locationId;
    private String locationBarcode;
    private String zoneCode;
    private String aisle;
    private String rack;
    private String shelf;
    private String bin;

    private Long batchId;
    private String batchNumber;
    private LocalDate manufactureDate;
    private LocalDate expiryDate;
    private Boolean isExpiringSoon;

    private Integer onHandQty;
    private Integer reservedQty;
    private Integer availableQty;
    private Instant lastUpdatedAt;
}

