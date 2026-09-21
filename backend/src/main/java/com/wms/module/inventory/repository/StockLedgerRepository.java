package com.wms.module.inventory.repository;

import com.wms.module.inventory.entity.StockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockLedgerRepository extends JpaRepository<StockLedger, Long> {
    List<StockLedger> findTop50ByOrderByCreatedAtDesc();
    List<StockLedger> findByProductIdOrderByCreatedAtDesc(Long productId);
}
