package com.wms.module.order.repository;

import com.wms.module.order.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByShipmentCode(String shipmentCode);
    List<Shipment> findByOutboundOrderId(Long outboundOrderId);
    List<Shipment> findByStatus(String status);
}
