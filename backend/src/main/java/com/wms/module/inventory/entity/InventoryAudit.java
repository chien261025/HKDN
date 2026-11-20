package com.wms.module.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wms_inventory_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "audit_code", nullable = false, unique = true, length = 50)
    private String auditCode;

    @Column(length = 255)
    private String title;

    @Column(name = "warehouse_id", nullable = false)
    @Builder.Default
    private Long warehouseId = 1L;

    @Column(name = "audit_type", nullable = false, length = 30)
    @Builder.Default
    private String auditType = "CYCLE_COUNT"; // CYCLE_COUNT, FULL_AUDIT, SPOT_CHECK

    @Column(name = "scope_type", length = 50)
    @Builder.Default
    private String scopeType = "ALL"; // ALL, ZONE, BIN, SKU

    @Column(name = "scope_value", length = 255)
    private String scopeValue;

    @Column(name = "is_blind_count")
    @Builder.Default
    private Boolean isBlindCount = true;

    @Column(name = "is_independent_verification_required")
    @Builder.Default
    private Boolean isIndependentVerificationRequired = true;

    @Column(name = "include_empty_bins")
    @Builder.Default
    private Boolean includeEmptyBins = false;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, APPROVED, REJECTED, CANCELLED

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "assigned_operator_id")
    private Long assignedOperatorId;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "adjustment_code", length = 50)
    private String adjustmentCode;

    private String notes;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;

    @OneToMany(mappedBy = "audit", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InventoryAuditItem> items = new ArrayList<>();
}
