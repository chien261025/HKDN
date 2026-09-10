package com.wms.module.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wms_package")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "package_code", nullable = false, unique = true, length = 50)
    private String packageCode;

    @Column(name = "outbound_order_id", nullable = false)
    private Long outboundOrderId;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    @Column(name = "weight_kg", precision = 10, scale = 2)
    private BigDecimal weightKg;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "PACKING"; // PACKING, SEALED, SHIPPED

    @Column(name = "packed_by", nullable = false)
    private Long packedBy;

    @Column(name = "packed_at")
    @Builder.Default
    private Instant packedAt = Instant.now();

    private String notes;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "orderPackage", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PackageItem> items = new ArrayList<>();
}
