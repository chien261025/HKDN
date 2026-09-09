package com.wms.module.inventory.repository;

import com.wms.module.inventory.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {

    /**
     * Sắp xếp các lô hàng theo thứ tự Hạn sử dụng tăng dần (Hạn gần nhất lên đầu -> Hỗ trợ FEFO)
     */
    @Query("SELECT b FROM ProductBatch b WHERE b.productId = :productId AND b.expiryDate > :currentDate ORDER BY b.expiryDate ASC")
    List<ProductBatch> findActiveBatchesOrderByExpiryAsc(
            @Param("productId") Long productId,
            @Param("currentDate") LocalDate currentDate
    );

    /**
     * Tìm các lô sắp hết hạn trong N ngày tới
     */
    @Query("SELECT b FROM ProductBatch b WHERE b.expiryDate BETWEEN :today AND :targetDate ORDER BY b.expiryDate ASC")
    List<ProductBatch> findBatchesExpiringSoon(
            @Param("today") LocalDate today,
            @Param("targetDate") LocalDate targetDate
    );
}
