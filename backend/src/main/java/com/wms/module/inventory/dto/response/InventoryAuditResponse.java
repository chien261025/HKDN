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
    private Long warehouseId;
    private String auditType;
    private String status; // IN_PROGRESS, COMPLETED, APPROVED, REJECTED, CANCELLED

    private Long createdBy;
    private String createdByName;
    private Long approvedBy;
    private String approvedByName;

    private String notes;
    private Instant createdAt;
    private Instant completedAt;

    private Integer totalBins;
    private Integer countedBins;
    private Integer discrepanciesCount;

    @Builder.Default
    private List<InventoryAuditItemResponse> items = new ArrayList<>();
}

