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
    private Long productId;
    private String productName;
    private String sku;
    private Integer qty;
    private String batch;
    private LocalDate expiry;
    private String temperature;
}
