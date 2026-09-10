package com.wms.module.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wms_inbound_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    @Column(name = "warehouse_id", nullable = false)
    @Builder.Default
    private Long warehouseId = 1L;

    @Column(name = "supplier_id")
    private Long supplierId;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PENDING"; // PENDING, RECEIVED, STOCKED, CANCELLED

    @Column(name = "created_by", nullable = false)
    @Builder.Default
    private Long createdBy = 1L;

    private String notes;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "inboundOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InboundOrderItem> items = new ArrayList<>();
}
