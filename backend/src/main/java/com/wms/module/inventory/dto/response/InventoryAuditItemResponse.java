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
public class InventoryAuditItemResponse {
    private Long id;
    private Long auditId;

    private Long locationId;
    private String locationBarcode;
    private String zoneCode;
    private String aisle;
    private String rack;
    private String shelf;
    private String bin;

    private Long productId;
    private String sku;
    private String barcode;
    private String productName;
    private String categoryName;
    private String unit;

    private Long batchId;
    private String batchNumber;
    private LocalDate expiryDate;

    private Integer systemQty;
    private Integer countedQty;
    private Integer differenceQty;
    private String status; // PENDING, MATCHED, DISCREPANCY, ADJUSTED
    private String counterNotes;
    private Instant countedAt;
}

