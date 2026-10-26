package com.wms.module.inventory.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.*;
import com.wms.module.inventory.repository.InventoryAuditRepository;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.StockAdjustmentRepository;
import com.wms.module.inventory.repository.StockLedgerRepository;
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
    private final InventoryRepository inventoryRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final com.wms.module.notification.service.NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryAudit> getAllAudits() {
        return inventoryAuditRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryAudit getAuditById(Long id) {
        return inventoryAuditRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + id));
    }

    @Override
    public InventoryAudit createAudit(InventoryAudit audit) {
        if (audit.getAuditCode() == null || audit.getAuditCode().isBlank()) {
            audit.setAuditCode("AUD-" + (System.currentTimeMillis() % 1000000));
        }
        if (audit.getCreatedBy() == null) {
            audit.setCreatedBy(1L);
        }
        if (audit.getWarehouseId() == null) {
            audit.setWarehouseId(1L);
        }
        audit.setStatus("IN_PROGRESS");
        audit.setCreatedAt(Instant.now());

        // Snapshot danh mục tồn kho thực tế nếu danh sách kiểm đếm rỗng
        if (audit.getItems() == null || audit.getItems().isEmpty()) {
            List<Inventory> allInventories = inventoryRepository.findAll();
            for (Inventory inv : allInventories) {
                if (inv.getOnHandQty() != null && inv.getOnHandQty() > 0) {
                    InventoryAuditItem item = InventoryAuditItem.builder()
                            .audit(audit)
                            .locationId(inv.getLocationId())
                            .productId(inv.getProductId())
                            .batchId(inv.getBatchId())
                            .systemQty(inv.getOnHandQty())
                            .status("PENDING")
                            .build();
                    audit.getItems().add(item);
                }
            }
        } else {
            for (InventoryAuditItem item : audit.getItems()) {
                item.setAudit(audit);
                if (item.getStatus() == null) {
                    item.setStatus("PENDING");
                }
            }
        }
        return inventoryAuditRepository.save(audit);
    }

    @Override
    public InventoryAudit recordCount(Long auditId, Long itemId, Integer countedQty, String notes) {
        InventoryAudit audit = inventoryAuditRepository.findById(auditId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + auditId));

        InventoryAuditItem targetItem = audit.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kiểm kê: " + itemId));

        targetItem.setCountedQty(countedQty);
        targetItem.setCountedAt(Instant.now());
        if (notes != null && !notes.isBlank()) {
            targetItem.setCounterNotes(notes);
        }

        if (countedQty.equals(targetItem.getSystemQty())) {
            targetItem.setStatus("MATCHED");
        } else {
            targetItem.setStatus("DISCREPANCY");
            int diff = countedQty - targetItem.getSystemQty();
            notificationService.broadcast(com.wms.module.notification.dto.NotificationMessage.builder()
                    .type("AUDIT_DISCREPANCY")
                    .severity("WARNING")
                    .title("Cảnh Báo Lệch Tồn Kho: " + audit.getAuditCode())
                    .message("Phát hiện chênh lệch " + (diff > 0 ? "+" : "") + diff + " sản phẩm tại vị trí ô kệ!")
                    .referenceCode(audit.getAuditCode())
                    .link("/audit")
                    .build());
        }

        // Nếu tất cả các ô đều đã được đếm xong, chuyển trạng thái đợt sang COMPLETED (Chờ trưởng kho duyệt)
        boolean allCounted = audit.getItems().stream().allMatch(i -> i.getCountedQty() != null);
        if (allCounted && "IN_PROGRESS".equals(audit.getStatus())) {
            audit.setStatus("COMPLETED");
            notificationService.broadcast(com.wms.module.notification.dto.NotificationMessage.builder()
                    .type("AUDIT_COMPLETED")
                    .severity("INFO")
                    .title("Phiên Kiểm Kê Hoàn Tất: " + audit.getAuditCode())
                    .message("Đã đếm xong toàn bộ ô kệ. Sẵn sàng đối soát và duyệt cân đối.")
                    .referenceCode(audit.getAuditCode())
                    .link("/audit")
                    .build());
        }

        return inventoryAuditRepository.save(audit);
    }

    @Override
    public InventoryAudit reconcileAudit(Long id) {
        InventoryAudit audit = inventoryAuditRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + id));

        if ("APPROVED".equals(audit.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đợt kiểm kê này đã được phê duyệt và cân đối trước đó!");
        }

        String adjCode = "ADJ-" + audit.getAuditCode();
        StockAdjustment adjustment = StockAdjustment.builder()
                .adjustmentCode(adjCode)
                .auditId(audit.getId())
                .warehouseId(audit.getWarehouseId())
                .reason("Cân đối số dư sau kiểm kê kho: " + audit.getAuditCode())
                .status("APPROVED")
                .createdBy(audit.getCreatedBy())
                .approvedBy(1L)
                .approvedAt(Instant.now())
                .notes("Tự động sinh từ phiên kiểm đếm thực tế của " + audit.getAuditCode())
                .build();
        stockAdjustmentRepository.save(adjustment);

        for (InventoryAuditItem item : audit.getItems()) {
            if (item.getCountedQty() != null && !item.getCountedQty().equals(item.getSystemQty())) {
                int diff = item.getCountedQty() - item.getSystemQty();

                Inventory inv = inventoryRepository.findByProductIdAndLocationIdAndBatchId(
                        item.getProductId(), item.getLocationId(), item.getBatchId()
                ).orElse(null);

                if (inv != null) {
                    inv.setOnHandQty(inv.getOnHandQty() + diff);
                    inv.setLastUpdatedAt(Instant.now());
                    inventoryRepository.saveAndFlush(inv);

                    // Ghi sổ cái bất biến (Stock Ledger)
                    StockLedger ledger = StockLedger.builder()
                            .transactionType("ADJUSTMENT")
                            .referenceCode(adjCode)
                            .locationId(item.getLocationId())
                            .productId(item.getProductId())
                            .batchId(item.getBatchId())
                            .qtyChange(diff)
                            .balanceAfter(inv.getOnHandQty())
                            .performedBy(1L)
                            .notes("Điều chỉnh cân đối kiểm kê " + audit.getAuditCode() + " (" + (diff > 0 ? "+" : "") + diff + ")")
                            .build();
                    stockLedgerRepository.save(ledger);

                    // Thêm item vào phiếu điều chỉnh
                    StockAdjustmentItem adjItem = StockAdjustmentItem.builder()
                            .adjustment(adjustment)
                            .locationId(item.getLocationId())
                            .productId(item.getProductId())
                            .batchId(item.getBatchId())
                            .systemQty(item.getSystemQty())
                            .actualQty(item.getCountedQty())
                            .build();
                    adjustment.getItems().add(adjItem);
                }
                item.setStatus("ADJUSTED");
            } else {
                item.setStatus("MATCHED");
            }
        }

        audit.setStatus("APPROVED");
        audit.setApprovedBy(1L);
        audit.setCompletedAt(Instant.now());

        notificationService.broadcast(com.wms.module.notification.dto.NotificationMessage.builder()
                .type("AUDIT_RECONCILED")
                .severity("SUCCESS")
                .title("Cân Đối Kho Thành Công: " + adjCode)
                .message("Đã sinh phiếu điều chỉnh tồn kho và tự động ghi sổ cái bất biến.")
                .referenceCode(adjCode)
                .link("/audit")
                .build());

        return inventoryAuditRepository.save(audit);
    }
}
