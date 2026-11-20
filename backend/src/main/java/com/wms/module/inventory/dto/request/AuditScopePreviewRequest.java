package com.wms.module.inventory.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditScopePreviewRequest {

    @NotNull(message = "Kho kiểm kê không được để trống")
    private Long warehouseId;

    @Builder.Default
    private String scopeType = "ALL"; // ALL, ZONE, BIN, SKU

    private String scopeValue;

    @Builder.Default
    private Boolean includeEmptyBins = false;
}

