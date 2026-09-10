package com.wms.module.inventory.repository;

import com.wms.module.inventory.entity.StockTransfer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockTransferRepository extends JpaRepository<StockTransfer, Long> {
    Optional<StockTransfer> findByTransferCode(String transferCode);
    List<StockTransfer> findByWarehouseIdAndStatus(Long warehouseId, String status);
}
