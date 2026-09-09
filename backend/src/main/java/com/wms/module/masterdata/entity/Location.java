package com.wms.module.masterdata.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "wms_location")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "zone_code", nullable = false, length = 20)
    private String zoneCode;

    @Column(nullable = false, length = 20)
    private String aisle;

    @Column(nullable = false, length = 20)
    private String rack;

    @Column(nullable = false, length = 20)
    private String shelf;

    @Column(name = "bin_barcode", nullable = false, unique = true, length = 50)
    private String binBarcode;

    @Column(name = "max_weight_kg")
    @Builder.Default
    private BigDecimal maxWeightKg = BigDecimal.valueOf(500.0);

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;
}
