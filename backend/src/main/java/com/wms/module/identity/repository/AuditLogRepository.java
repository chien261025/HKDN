package com.wms.module.identity.repository;

import com.wms.module.identity.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop50ByOrderByCreatedAtDesc();
    List<AuditLog> findByTargetIdOrderByCreatedAtDesc(String targetId);
    List<AuditLog> findByTargetNameOrderByCreatedAtDesc(String targetName);
}

