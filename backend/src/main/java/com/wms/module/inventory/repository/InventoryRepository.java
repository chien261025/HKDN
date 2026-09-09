package com.wms.module.inventory.repository;

import com.wms.module.inventory.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {

    /**
     * Khóa bi quan (Pessimistic Write Lock / SELECT FOR UPDATE)
     * Đảm bảo chỉ đúng 1 luồng được truy cập và cập nhật số lượng tồn tại 1 thời điểm!
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.productId = :productId AND i.locationId = :locationId AND i.batchId = :batchId")
    Optional<Inventory> findByProductLocationAndBatchForUpdate(
            @Param("productId") Long productId,
            @Param("locationId") Long locationId,
            @Param("batchId") Long batchId
    );

    Optional<Inventory> findByProductIdAndLocationIdAndBatchId(Long productId, Long locationId, Long batchId);
}
