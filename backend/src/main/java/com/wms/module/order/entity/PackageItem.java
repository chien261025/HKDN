package com.wms.module.order.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "wms_package_item")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PackageItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private OrderPackage orderPackage;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(nullable = false)
    private Integer quantity;
}
