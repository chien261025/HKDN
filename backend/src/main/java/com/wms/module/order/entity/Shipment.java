package com.wms.module.order.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "wms_shipment")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_code", nullable = false, unique = true, length = 50)
    private String shipmentCode;

    @Column(name = "outbound_order_id", nullable = false)
    private Long outboundOrderId;

    @Column(name = "carrier_name", nullable = false, length = 100)
    private String carrierName;

    @Column(name = "vehicle_number", length = 50)
    private String vehicleNumber;

    @Column(name = "driver_name", length = 100)
    private String driverName;

    @Column(name = "driver_phone", length = 20)
    private String driverPhone;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String status = "DISPATCHED"; // PREPARING, DISPATCHED, DELIVERED, RETURNED

    @Column(name = "dispatched_at")
    @Builder.Default
    private Instant dispatchedAt = Instant.now();

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    private String notes;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
