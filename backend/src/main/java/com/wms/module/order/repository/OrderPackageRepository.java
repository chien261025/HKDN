package com.wms.module.order.repository;

import com.wms.module.order.entity.OrderPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderPackageRepository extends JpaRepository<OrderPackage, Long> {
    Optional<OrderPackage> findByPackageCode(String packageCode);
    List<OrderPackage> findByOutboundOrderId(Long outboundOrderId);
    List<OrderPackage> findByStatus(String status);
}
