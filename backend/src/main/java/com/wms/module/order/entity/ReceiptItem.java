package com.wms.module.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_receipt_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceiptItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receipt_id", nullable = false)
    private Receipt receipt;

    @Column(name = "inbound_order_item_id", nullable = false)
    private Long inboundOrderItemId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "accepted_qty", nullable = false)
    private Integer acceptedQty;

    @Column(name = "rejected_qty", nullable = false)
    @Builder.Default
    private Integer rejectedQty = 0;

    @Column(name = "reject_reason")
    private String rejectReason;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
