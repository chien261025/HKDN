package com.wms.module.inventory.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.InventoryAudit;
import com.wms.module.inventory.entity.InventoryAuditItem;
import com.wms.module.inventory.repository.InventoryAuditRepository;
import com.wms.module.inventory.service.InventoryAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryAuditServiceImpl implements InventoryAuditService {

    private final InventoryAuditRepository inventoryAuditRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryAudit> getAllAudits() {
        return inventoryAuditRepository.findAll();
    }

    @Override
    public InventoryAudit createAudit(InventoryAudit audit) {
        if (audit.getAuditCode() == null || audit.getAuditCode().isBlank()) {
            audit.setAuditCode("AUD-" + System.currentTimeMillis() % 1000000);
        }
        if (audit.getCreatedBy() == null) {
            audit.setCreatedBy(1L);
        }
        if (audit.getWarehouseId() == null) {
            audit.setWarehouseId(1L);
        }
        audit.setStatus("IN_PROGRESS");
        audit.setCreatedAt(Instant.now());
        if (audit.getItems() != null) {
            for (InventoryAuditItem item : audit.getItems()) {
                item.setAudit(audit);
                item.setStatus("PENDING");
            }
        }
        return inventoryAuditRepository.save(audit);
    }

    @Override
    public InventoryAudit reconcileAudit(Long id) {
        InventoryAudit audit = inventoryAuditRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + id));
        audit.setStatus("APPROVED");
        audit.setCompletedAt(Instant.now());
        if (audit.getItems() != null) {
            for (InventoryAuditItem item : audit.getItems()) {
                item.setStatus("ADJUSTED");
            }
        }
        return inventoryAuditRepository.save(audit);
    }
}
