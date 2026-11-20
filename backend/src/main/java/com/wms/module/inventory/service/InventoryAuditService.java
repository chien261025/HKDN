package com.wms.module.inventory.service;

import com.wms.module.inventory.dto.request.AuditScopePreviewRequest;
import com.wms.module.inventory.dto.request.CreateAuditRequest;
import com.wms.module.inventory.dto.response.AuditScopePreviewResponse;
import com.wms.module.inventory.dto.response.InventoryAuditResponse;
import com.wms.module.inventory.entity.InventoryAudit;

import java.util.List;

public interface InventoryAuditService {
    List<InventoryAuditResponse> getAllAudits();
    InventoryAuditResponse getAuditById(Long id);
    AuditScopePreviewResponse previewScope(AuditScopePreviewRequest request);
    InventoryAuditResponse createAudit(CreateAuditRequest request);
    InventoryAuditResponse createAudit(InventoryAudit audit);
    InventoryAuditResponse recordCount(Long auditId, Long itemId, Integer countedQty, String notes);
    InventoryAuditResponse recordCount(Long auditId, Long itemId, Long locationId, Long productId, Integer countedQty, String notes);
    InventoryAuditResponse recountItem(Long auditId, Long itemId, Integer recountQty, String notes);
    InventoryAuditResponse reconcileAudit(Long id);
}
