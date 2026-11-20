package com.wms.module.masterdata.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiSkuSuggestionDto {
    private String sku;
    private String category;
    private String categoryLabel;
    private String storageZone;
    private String storageCondition;
    private String unit;
    private Boolean isExpiryManaged;
    private String outboundStrategy;
    private Integer shelfLifeDays;
    private String reason;
    private Boolean aiPowered;
}

