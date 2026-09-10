package com.wms.module.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_putaway_task")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PutawayTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_code", nullable = false, unique = true, length = 50)
    private String taskCode;

    @Column(name = "receipt_item_id", nullable = false)
    private Long receiptItemId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "source_location_id")
    private Long sourceLocationId;

    @Column(name = "destination_location_id", nullable = false)
    private Long destinationLocationId;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED, CANCELLED

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
