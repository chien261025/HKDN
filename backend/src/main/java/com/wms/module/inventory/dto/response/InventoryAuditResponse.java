package com.wms.module.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryAuditResponse {
    private Long id;
    private String auditCode;
    private String title;
    private Long warehouseId;
    private String warehouseName;
    private String auditType; // CYCLE_COUNT, FULL_AUDIT, SPOT_CHECK
    private String scopeType; // ALL, ZONE, BIN, SKU
    private String scopeValue;
    private Boolean isBlindCount;
    private Boolean isIndependentVerificationRequired;
    private Boolean includeEmptyBins;
    private String status; // IN_PROGRESS, COMPLETED, APPROVED, REJECTED, CANCELLED

    private Long createdBy;
    private String createdByName;
    private Long assignedOperatorId;
    private String assignedOperatorName;
    private Long approvedBy;
    private String approvedByName;
    private String adjustmentCode;

    private String notes;
    private Instant createdAt;
    private Instant completedAt;

    private Integer totalBins;
    private Integer countedBins;
    private Integer discrepanciesCount;

    @Builder.Default
    private List<InventoryAuditItemResponse> items = new ArrayList<>();
}
