package com.wms.module.inventory.repository;

import com.wms.module.inventory.entity.StockLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockLedgerRepository extends JpaRepository<StockLedger, Long> {
    List<StockLedger> findTop50ByOrderByCreatedAtDesc();
    List<StockLedger> findByTransactionTypeInOrderByCreatedAtDesc(List<String> transactionTypes);
    List<StockLedger> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<StockLedger> findByReferenceCodeOrderByCreatedAtDesc(String referenceCode);

    @Query("SELECT l FROM StockLedger l WHERE " +
           "(:productId IS NULL OR l.productId = :productId) AND " +
           "(:locationId IS NULL OR l.locationId = :locationId) AND " +
           "(:batchId IS NULL OR l.batchId = :batchId) AND " +
           "(:transactionType IS NULL OR l.transactionType = :transactionType) " +
           "ORDER BY l.createdAt DESC")
    List<StockLedger> findTargetedLedgers(
            @Param("productId") Long productId,
            @Param("locationId") Long locationId,
            @Param("batchId") Long batchId,
            @Param("transactionType") String transactionType
    );
}
