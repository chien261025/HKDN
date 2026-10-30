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
public class StockLedgerResponse {
    private Long id;
    private String transactionType;
    private String referenceCode;

    private Long locationId;
    private String locationBarcode;

    private Long productId;
    private String productSku;
    private String productName;

    private Long batchId;
    private String batchNumber;
    private LocalDate expiryDate;

    private Integer qtyChange;
    private Integer balanceBefore;
    private Integer balanceAfter;

    private Long performedBy;
    private String performedByName;
    private String notes;
    private Instant createdAt;
}

