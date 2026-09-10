package com.wms.module.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_stock_adjustment_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockAdjustmentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adjustment_id", nullable = false)
    private StockAdjustment adjustment;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "system_qty", nullable = false)
    private Integer systemQty;

    @Column(name = "actual_qty", nullable = false)
    private Integer actualQty;

    @Column(name = "adjusted_qty", insertable = false, updatable = false)
    private Integer adjustedQty;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
