package com.wms.module.inventory.service;

import com.wms.module.inventory.entity.InventoryAudit;

import java.util.List;

public interface InventoryAuditService {
    List<InventoryAudit> getAllAudits();
    InventoryAudit getAuditById(Long id);
    InventoryAudit createAudit(InventoryAudit audit);
    InventoryAudit recordCount(Long auditId, Long itemId, Integer countedQty, String notes);
    InventoryAudit reconcileAudit(Long id);
}
