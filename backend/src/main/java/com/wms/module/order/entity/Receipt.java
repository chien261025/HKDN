package com.wms.module.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wms_receipt")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Receipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_code", nullable = false, unique = true, length = 50)
    private String receiptCode;

    @Column(name = "inbound_order_id", nullable = false)
    private Long inboundOrderId;

    @Column(name = "warehouse_id", nullable = false)
    private Long warehouseId;

    @Column(name = "dock_number", length = 50)
    private String dockNumber;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "RECEIVING"; // RECEIVING, COMPLETED, CANCELLED

    @Column(name = "received_by", nullable = false)
    private Long receivedBy;

    @Column(name = "received_at")
    @Builder.Default
    private Instant receivedAt = Instant.now();

    private String notes;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ReceiptItem> items = new ArrayList<>();
}
