package com.wms.module.masterdata.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "wms_product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {
    @jakarta.persistence.Transient
    @Builder.Default
    private Integer currentStock = 0;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String sku;

    @Column(nullable = false, unique = true, length = 100)
    private String barcode;

    @Column(nullable = false)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "supplier_id")
    private Long supplierId;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", insertable = false, updatable = false)
    private Supplier supplier;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", insertable = false, updatable = false)
    private Category category;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String unit = "Cái";

    @Column(name = "brand", length = 100)
    private String brand;

    @Column(name = "origin", length = 100)
    private String origin;

    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;

    @Column(name = "storage_condition", length = 50)
    @Builder.Default
    private String storageCondition = "AMBIENT"; // AMBIENT, COOL, COLD, SECURE

    @Column(name = "weight_kg", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal weightKg = new BigDecimal("1.00");

    @Column(name = "length_cm", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal lengthCm = new BigDecimal("20.00");

    @Column(name = "width_cm", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal widthCm = new BigDecimal("15.00");

    @Column(name = "height_cm", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal heightCm = new BigDecimal("10.00");

    @Column(name = "safety_stock")
    @Builder.Default
    private Integer safetyStock = 10;

    @Column(name = "reorder_point")
    @Builder.Default
    private Integer reorderPoint = 20;

    @Column(name = "max_stock")
    @Builder.Default
    private Integer maxStock = 500;

    @Column(name = "purchase_price", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal purchasePrice = BigDecimal.ZERO;

    @Column(name = "selling_price", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal sellingPrice = BigDecimal.ZERO;

    @Column(name = "business_status", length = 30)
    @Builder.Default
    private String businessStatus = "ACTIVE"; // ACTIVE, SUSPENDED, DISCONTINUED

    @Column(name = "is_batch_managed")
    @Builder.Default
    private Boolean isBatchManaged = true;

    @Column(name = "is_expiry_managed")
    @Builder.Default
    private Boolean isExpiryManaged = true;

    @Column(name = "shelf_life_days")
    private Integer shelfLifeDays;

    @Column(name = "outbound_strategy", length = 20)
    @Builder.Default
    private String outboundStrategy = "FEFO";

    @Column(name = "packaging_unit", length = 30)
    @Builder.Default
    private String packagingUnit = "Thùng";

    @Column(name = "conversion_rate")
    @Builder.Default
    private Integer conversionRate = 24;

    public int convertToBaseQty(int packagingQty) {
        int rate = (conversionRate != null && conversionRate > 0) ? conversionRate : 1;
        return packagingQty * rate;
    }

    public int convertToPackagingQty(int baseQty) {
        int rate = (conversionRate != null && conversionRate > 0) ? conversionRate : 1;
        return baseQty / rate;
    }

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
