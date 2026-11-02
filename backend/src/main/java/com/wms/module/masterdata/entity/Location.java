package com.wms.module.masterdata.entity;

import java.math.BigDecimal;
import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wms_location", uniqueConstraints = {
        @UniqueConstraint(name = "uq_location_coords", columnNames = { "warehouse_id", "zone_code", "aisle", "rack",
                "shelf", "bin" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "warehouse_id", nullable = false)
    @Builder.Default
    private Long warehouseId = 1L;

    @Column(name = "zone_code", nullable = false, length = 20)
    private String zoneCode;

    @Column(nullable = false, length = 20)
    private String aisle;

    @Column(nullable = false, length = 20)
    private String rack;

    @Column(nullable = false, length = 20)
    private String shelf;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String bin = "B01";

    @Column(name = "bin_barcode", nullable = false, unique = true, length = 50)
    private String binBarcode;

    @Column(name = "max_weight_kg")
    @Builder.Default
    private BigDecimal maxWeightKg = BigDecimal.valueOf(500.0);

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
