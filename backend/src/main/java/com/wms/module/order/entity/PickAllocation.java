package com.wms.module.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_pick_allocation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PickAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outbound_order_item_id", nullable = false)
    private OutboundOrderItem outboundOrderItem;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "allocated_qty", nullable = false)
    private Integer allocatedQty;

    @Column(name = "picked_qty", nullable = false)
    @Builder.Default
    private Integer pickedQty = 0;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "ALLOCATED"; // ALLOCATED, PICKED, CANCELLED

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "picked_at")
    private Instant pickedAt;
}
