package com.wms.module.inventory.repository;

import com.wms.module.inventory.entity.StockAdjustment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockAdjustmentRepository extends JpaRepository<StockAdjustment, Long> {
    Optional<StockAdjustment> findByAdjustmentCode(String adjustmentCode);
    List<StockAdjustment> findByAuditId(Long auditId);
    List<StockAdjustment> findByWarehouseIdAndStatus(Long warehouseId, String status);
}
