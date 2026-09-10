package com.wms.module.inventory.repository;

import com.wms.module.inventory.entity.StockReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockReservationRepository extends JpaRepository<StockReservation, Long> {
    List<StockReservation> findByOutboundOrderId(Long outboundOrderId);
    List<StockReservation> findByLocationIdAndProductIdAndBatchId(Long locationId, Long productId, Long batchId);
    List<StockReservation> findByStatus(String status);
}
