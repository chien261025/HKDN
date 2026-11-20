package com.wms.module.identity.entity;

import com.wms.module.masterdata.entity.Warehouse;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_user_warehouse_access")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserWarehouseAccess {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}

