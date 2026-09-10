package com.wms.module.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "on_hand_qty", nullable = false)
    private Integer onHandQty;

    @Column(name = "reserved_qty", nullable = false)
    private Integer reservedQty;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @Column(name = "last_updated_at")
    @Builder.Default
    private Instant lastUpdatedAt = Instant.now();

    /**
     * Tồn kho khả dụng thực sự cho phép bán hoặc xuất tiếp
     */
    public int getAvailableQty() {
        return (onHandQty != null ? onHandQty : 0) - (reservedQty != null ? reservedQty : 0);
    }
}
