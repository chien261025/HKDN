package com.wms.module.inventory.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_stock_reservation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockReservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "outbound_order_id", nullable = false)
    private Long outboundOrderId;

    @Column(name = "outbound_order_item_id", nullable = false)
    private Long outboundOrderItemId;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "reserved_qty", nullable = false)
    private Integer reservedQty;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "RESERVED"; // RESERVED, PICKED, RELEASED

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
