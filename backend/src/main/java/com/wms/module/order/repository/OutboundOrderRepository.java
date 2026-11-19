package com.wms.module.order.repository;

import com.wms.module.order.entity.OutboundOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OutboundOrderRepository extends JpaRepository<OutboundOrder, Long> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT o FROM OutboundOrder o WHERE o.id = :id")
    Optional<OutboundOrder> findForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    Optional<OutboundOrder> findByOrderCode(String orderCode);
}
