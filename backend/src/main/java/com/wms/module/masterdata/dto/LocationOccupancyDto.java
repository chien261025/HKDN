package com.wms.module.masterdata.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationOccupancyDto {
    private Long id;
    private Long warehouseId;
    private String warehouseCode;
    private String zone;
    private String zoneName;
    private String aisle;
    private String rack;
    private String shelf;
    private String binNumber;
    private String barcode;
    private BigDecimal maxWeight;
    private BigDecimal currentWeight;
    private String status; // EMPTY, OCCUPIED, EXPIRING, RESERVED
    private Boolean isActive;
    private Long productId;
    private Long batchId;
    private String productName;
    private String sku;
    private Integer qty;
    private Integer onHandQty;
    private Integer reservedQty;
    private Integer availableQty;
    private Boolean isExpired;
    private String batch;
    private LocalDate expiry;
    private String temperature;
}
