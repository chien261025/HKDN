package com.wms.module.inventory.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.util.SecurityUtils;
import com.wms.module.inventory.dto.response.InventoryAuditItemResponse;
import com.wms.module.inventory.dto.response.InventoryAuditResponse;
import com.wms.module.inventory.entity.*;
import com.wms.module.inventory.repository.InventoryAuditRepository;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.repository.StockAdjustmentRepository;
import com.wms.module.inventory.repository.StockLedgerRepository;
import com.wms.module.inventory.service.InventoryAuditService;
import com.wms.module.masterdata.entity.Category;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.notification.dto.NotificationMessage;
import com.wms.module.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryAuditServiceImpl implements InventoryAuditService {

    private final InventoryAuditRepository inventoryAuditRepository;
    private final InventoryRepository inventoryRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final NotificationService notificationService;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final ProductBatchRepository productBatchRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryAuditResponse> getAllAudits() {
        List<InventoryAudit> audits = inventoryAuditRepository.findAll();
        if (audits.isEmpty()) {
            return Collections.emptyList();
        }
        return toResponses(audits);
    }

    @Override
    @Transactional(readOnly = true)
    public InventoryAuditResponse getAuditById(Long id) {
        InventoryAudit audit = inventoryAuditRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + id));
        return toResponse(audit);
    }

    @Override
    public InventoryAuditResponse createAudit(InventoryAudit audit) {
        if (audit.getAuditCode() == null || audit.getAuditCode().isBlank()) {
            audit.setAuditCode("AUD-" + (System.currentTimeMillis() % 1000000));
        }
        Long currentUserId = SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);
        if (audit.getCreatedBy() == null) {
            audit.setCreatedBy(currentUserId);
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
        InventoryAudit saved = inventoryAuditRepository.save(audit);
        return toResponse(saved);
    }

    @Override
    public InventoryAuditResponse recordCount(Long auditId, Long itemId, Integer countedQty, String notes) {
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
            if (notificationService != null) {
                notificationService.broadcast(NotificationMessage.builder()
                        .type("AUDIT_DISCREPANCY")
                        .severity("WARNING")
                        .title("Cảnh Báo Lệch Tồn Kho: " + audit.getAuditCode())
                        .message("Phát hiện chênh lệch " + (diff > 0 ? "+" : "") + diff + " sản phẩm tại vị trí ô kệ!")
                        .referenceCode(audit.getAuditCode())
                        .link("/audit")
                        .build());
            }
        }

        // Nếu tất cả các ô đều đã được đếm xong, chuyển trạng thái đợt sang COMPLETED (Chờ trưởng kho duyệt)
        boolean allCounted = audit.getItems().stream().allMatch(i -> i.getCountedQty() != null);
        if (allCounted && "IN_PROGRESS".equals(audit.getStatus())) {
            audit.setStatus("COMPLETED");
            if (notificationService != null) {
                notificationService.broadcast(NotificationMessage.builder()
                        .type("AUDIT_COMPLETED")
                        .severity("INFO")
                        .title("Phiên Kiểm Kê Hoàn Tất: " + audit.getAuditCode())
                        .message("Đã đếm xong toàn bộ ô kệ. Sẵn sàng đối soát và duyệt cân đối.")
                        .referenceCode(audit.getAuditCode())
                        .link("/audit")
                        .build());
            }
        }

        InventoryAudit saved = inventoryAuditRepository.save(audit);
        return toResponse(saved);
    }

    @Override
    public InventoryAuditResponse reconcileAudit(Long id) {
        InventoryAudit audit = inventoryAuditRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + id));

        if ("APPROVED".equals(audit.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đợt kiểm kê này đã được phê duyệt và cân đối trước đó!");
        }

        Long currentUserId = SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);
        String adjCode = "ADJ-" + audit.getAuditCode();

        StockAdjustment adjustment = StockAdjustment.builder()
                .adjustmentCode(adjCode)
                .auditId(audit.getId())
                .warehouseId(audit.getWarehouseId())
                .reason("Cân đối số dư sau kiểm kê kho: " + audit.getAuditCode())
                .status("APPROVED")
                .createdBy(audit.getCreatedBy())
                .approvedBy(currentUserId)
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
                            .performedBy(currentUserId)
                            .notes("Điều chỉnh cân đối kiểm kê " + audit.getAuditCode() + " (" + (diff > 0 ? "+" : "") + diff + ")")
                            .createdAt(Instant.now())
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
        audit.setApprovedBy(currentUserId);
        audit.setCompletedAt(Instant.now());

        if (notificationService != null) {
            notificationService.broadcast(NotificationMessage.builder()
                    .type("AUDIT_RECONCILED")
                    .severity("SUCCESS")
                    .title("Cân Đối Kho Thành Công: " + adjCode)
                    .message("Đã sinh phiếu điều chỉnh tồn kho và tự động ghi sổ cái bất biến.")
                    .referenceCode(adjCode)
                    .link("/audit")
                    .build());
        }

        InventoryAudit saved = inventoryAuditRepository.save(audit);
        return toResponse(saved);
    }

    private InventoryAuditResponse toResponse(InventoryAudit audit) {
        return toResponses(Collections.singletonList(audit)).get(0);
    }

    private List<InventoryAuditResponse> toResponses(List<InventoryAudit> audits) {
        Map<Long, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<Long, Location> locationMap = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(ProductBatch::getId, b -> b, (a, b) -> a));
        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return audits.stream().map(audit -> {
            User createdUser = userMap.get(audit.getCreatedBy());
            User approvedUser = userMap.get(audit.getApprovedBy());

            List<InventoryAuditItemResponse> itemResponses = new ArrayList<>();
            int totalBins = 0;
            int countedBins = 0;
            int discrepanciesCount = 0;

            if (audit.getItems() != null) {
                totalBins = audit.getItems().size();
                for (InventoryAuditItem item : audit.getItems()) {
                    Product prod = productMap.get(item.getProductId());
                    Location loc = locationMap.get(item.getLocationId());
                    ProductBatch batch = batchMap.get(item.getBatchId());
                    Category cat = (prod != null && prod.getCategoryId() != null) ? categoryMap.get(prod.getCategoryId()) : null;

                    Integer countedQty = item.getCountedQty();
                    Integer diff = (countedQty != null) ? (countedQty - item.getSystemQty()) : null;

                    if (countedQty != null) {
                        countedBins++;
                        if (diff != null && diff != 0) {
                            discrepanciesCount++;
                        }
                    }

                    itemResponses.add(InventoryAuditItemResponse.builder()
                            .id(item.getId())
                            .auditId(audit.getId())
                            .locationId(item.getLocationId())
                            .locationBarcode(loc != null ? loc.getBinBarcode() : "LOC-" + item.getLocationId())
                            .zoneCode(loc != null ? loc.getZoneCode() : "")
                            .aisle(loc != null ? loc.getAisle() : "")
                            .rack(loc != null ? loc.getRack() : "")
                            .shelf(loc != null ? loc.getShelf() : "")
                            .bin(loc != null ? loc.getBin() : "")
                            .productId(item.getProductId())
                            .sku(prod != null ? prod.getSku() : "SKU-" + item.getProductId())
                            .barcode(prod != null ? prod.getBarcode() : "")
                            .productName(prod != null ? prod.getName() : "Sản phẩm #" + item.getProductId())
                            .categoryName(cat != null ? cat.getName() : "Hàng tiêu dùng")
                            .unit(prod != null ? prod.getUnit() : "Cái")
                            .batchId(item.getBatchId())
                            .batchNumber(batch != null ? batch.getBatchNumber() : (item.getBatchId() != null ? "BATCH-" + item.getBatchId() : "N/A"))
                            .expiryDate(batch != null ? batch.getExpiryDate() : null)
                            .systemQty(item.getSystemQty())
                            .countedQty(countedQty)
                            .differenceQty(diff)
                            .status(item.getStatus())
                            .counterNotes(item.getCounterNotes())
                            .countedAt(item.getCountedAt())
                            .build());
                }
            }

            return InventoryAuditResponse.builder()
                    .id(audit.getId())
                    .auditCode(audit.getAuditCode())
                    .warehouseId(audit.getWarehouseId())
                    .auditType(audit.getAuditType())
                    .status(audit.getStatus())
                    .createdBy(audit.getCreatedBy())
                    .createdByName(createdUser != null ? createdUser.getFullName() : "Nhân viên kho #" + audit.getCreatedBy())
                    .approvedBy(audit.getApprovedBy())
                    .approvedByName(approvedUser != null ? approvedUser.getFullName() : (audit.getApprovedBy() != null ? "Quản lý #" + audit.getApprovedBy() : null))
                    .notes(audit.getNotes())
                    .createdAt(audit.getCreatedAt())
                    .completedAt(audit.getCompletedAt())
                    .totalBins(totalBins)
                    .countedBins(countedBins)
                    .discrepanciesCount(discrepanciesCount)
                    .items(itemResponses)
                    .build();
        }).collect(Collectors.toList());
    }
}
