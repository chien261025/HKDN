package com.wms.module.order.repository;

import com.wms.module.order.entity.InboundOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InboundOrderRepository extends JpaRepository<InboundOrder, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select o from InboundOrder o where o.id = :id")
    Optional<InboundOrder> findForUpdate(@org.springframework.data.repository.query.Param("id") Long id);
    Optional<InboundOrder> findByOrderCode(String orderCode);
    java.util.List<InboundOrder> findByWarehouseIdOrderByCreatedAtDesc(Long warehouseId);
    java.util.List<InboundOrder> findAllByOrderByCreatedAtDesc();
}
