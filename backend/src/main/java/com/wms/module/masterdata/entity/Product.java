package com.wms.module.masterdata.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, unique = true, length = 100)
    private String barcode;

    @Column(nullable = false)
    private String name;

    private String category;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String unit = "Cái";

    @Column(name = "safety_stock")
    @Builder.Default
    private Integer safetyStock = 10;

    @Column(name = "reorder_point")
    @Builder.Default
    private Integer reorderPoint = 20;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
