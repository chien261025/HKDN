package com.wms.module.inventory.repository;

import com.wms.module.inventory.entity.InventoryAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventoryAuditRepository extends JpaRepository<InventoryAudit, Long> {
    Optional<InventoryAudit> findByAuditCode(String auditCode);
}
