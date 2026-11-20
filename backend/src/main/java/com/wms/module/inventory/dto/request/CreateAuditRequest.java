package com.wms.module.inventory.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAuditRequest {

    @NotNull(message = "Kho kiểm kê không được để trống")
    private Long warehouseId;

    private String title;

    @Builder.Default
    private String auditType = "CYCLE_COUNT"; // CYCLE_COUNT, FULL_AUDIT, SPOT_CHECK

    @Builder.Default
    private String scopeType = "ALL"; // ALL, ZONE, BIN, SKU

    private String scopeValue;

    private String notes;

    @Builder.Default
    private Boolean blindCount = true;

    @Builder.Default
    private Boolean requireRecount = true;

    @Builder.Default
    private Boolean includeEmptyBins = false;

    private Long assignedOperatorId;
}

