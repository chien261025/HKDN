package com.wms.module.order.repository;

import com.wms.module.order.entity.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    Optional<Receipt> findByReceiptCode(String receiptCode);
    List<Receipt> findByInboundOrderId(Long inboundOrderId);
    List<Receipt> findByWarehouseIdAndStatus(Long warehouseId, String status);
}
