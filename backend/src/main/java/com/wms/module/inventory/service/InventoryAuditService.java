package com.wms.module.inventory.service;

import com.wms.module.inventory.entity.InventoryAudit;

import java.util.List;

public interface InventoryAuditService {
    List<InventoryAudit> getAllAudits();
    InventoryAudit createAudit(InventoryAudit audit);
    InventoryAudit reconcileAudit(Long id);
}
