package com.wms.module.inventory.service;

import com.wms.module.inventory.dto.response.InventoryAuditResponse;
import com.wms.module.inventory.entity.InventoryAudit;

import java.util.List;

public interface InventoryAuditService {
    List<InventoryAuditResponse> getAllAudits();
    InventoryAuditResponse getAuditById(Long id);
    InventoryAuditResponse createAudit(InventoryAudit audit);
    InventoryAuditResponse recordCount(Long auditId, Long itemId, Integer countedQty, String notes);
    InventoryAuditResponse reconcileAudit(Long id);
}
