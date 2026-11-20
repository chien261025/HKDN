package com.wms.module.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditScopePreviewResponse {

    private Long warehouseId;
    private String warehouseName;
    private String scopeType;
    private String scopeValue;
    private Integer totalLocations;
    private Integer totalProducts;
    private Integer totalLines;
    private Integer totalExpectedStock;

    @Builder.Default
    private List<PreviewItem> sampleItems = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreviewItem {
        private Long locationId;
        private String locationBarcode;
        private String zoneCode;
        private Long productId;
        private String sku;
        private String productName;
        private String batchNumber;
        private Integer systemQty;
    }
}

