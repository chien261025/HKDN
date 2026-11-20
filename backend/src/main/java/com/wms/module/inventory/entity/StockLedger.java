package com.wms.module.inventory.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

@Entity
@Table(name = "wms_stock_ledger")
@Immutable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "transaction_type", nullable = false, length = 30)
    private String transactionType; // INBOUND, OUTBOUND, ADJUSTMENT, TRANSFER

    @Column(name = "reference_code", nullable = false, length = 100)
    private String referenceCode;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;

    @Column(name = "qty_change", nullable = false)
    private Integer qtyChange;

    @Column(name = "balance_after", nullable = false)
    private Integer balanceAfter;

    @Column(name = "performed_by", nullable = false)
    private Long performedBy;

    private String notes;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @PreUpdate
    public void preUpdate() {
        throw new UnsupportedOperationException("StockLedger là nhật ký bất biến (append-only). Nghiêm cấm cập nhật bản ghi đã ghi sổ.");
    }

    @PreRemove
    public void preRemove() {
        throw new UnsupportedOperationException("StockLedger là nhật ký bất biến (append-only). Nghiêm cấm xóa bản ghi đã ghi sổ.");
    }
}
