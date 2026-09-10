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

    @Column(name = "warehouse_id", nullable = false)
    @Builder.Default
    private Long warehouseId = 1L;

    @Column(name = "audit_type", nullable = false, length = 30)
    @Builder.Default
    private String auditType = "CYCLE_COUNT"; // CYCLE_COUNT, FULL_AUDIT, SPOT_CHECK

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "IN_PROGRESS"; // IN_PROGRESS, COMPLETED, APPROVED, REJECTED, CANCELLED

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "approved_by")
    private Long approvedBy;

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
