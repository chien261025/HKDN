package com.wms.module.inventory.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.util.SecurityUtils;
import com.wms.module.inventory.dto.request.AuditScopePreviewRequest;
import com.wms.module.inventory.dto.request.CreateAuditRequest;
import com.wms.module.inventory.dto.response.AuditScopePreviewResponse;
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
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.repository.WarehouseRepository;
import com.wms.module.notification.dto.NotificationMessage;
import com.wms.module.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
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
    private final WarehouseRepository warehouseRepository;

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
    @Transactional(readOnly = true)
    public AuditScopePreviewResponse previewScope(AuditScopePreviewRequest request) {
        Long warehouseId = request.getWarehouseId() != null ? request.getWarehouseId() : 1L;
        Warehouse wh = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Kho không tồn tại: " + warehouseId));

        String scopeType = request.getScopeType() != null ? request.getScopeType().toUpperCase() : "ALL";
        String scopeValue = request.getScopeValue() != null ? request.getScopeValue().trim() : "";

        List<Location> whLocations = locationRepository.findAll().stream()
                .filter(l -> warehouseId.equals(l.getWarehouseId()))
                .collect(Collectors.toList());

        List<Inventory> whInventories = inventoryRepository.findAuditStock(warehouseId);
        Map<Long, Location> locMap = whLocations.stream().collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, Product> prodMap = productRepository.findAll().stream().collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findAll().stream().collect(Collectors.toMap(ProductBatch::getId, b -> b, (a, b) -> a));

        List<Inventory> filteredInventories = filterInventoriesByScope(whInventories, locMap, prodMap, scopeType, scopeValue);

        Set<Long> matchedLocationIds = filteredInventories.stream().map(Inventory::getLocationId).collect(Collectors.toSet());
        Set<Long> matchedProductIds = filteredInventories.stream().map(Inventory::getProductId).collect(Collectors.toSet());
        int totalExpectedStock = filteredInventories.stream().mapToInt(i -> i.getOnHandQty() != null ? i.getOnHandQty() : 0).sum();

        List<AuditScopePreviewResponse.PreviewItem> samples = filteredInventories.stream()
                .limit(8)
                .map(inv -> {
                    Location loc = locMap.get(inv.getLocationId());
                    Product prod = prodMap.get(inv.getProductId());
                    ProductBatch batch = batchMap.get(inv.getBatchId());
                    return AuditScopePreviewResponse.PreviewItem.builder()
                            .locationId(inv.getLocationId())
                            .locationBarcode(loc != null ? loc.getBinBarcode() : "LOC-" + inv.getLocationId())
                            .zoneCode(loc != null ? loc.getZoneCode() : "")
                            .productId(inv.getProductId())
                            .sku(prod != null ? prod.getSku() : "SKU-" + inv.getProductId())
                            .productName(prod != null ? prod.getName() : "Sản phẩm #" + inv.getProductId())
                            .batchNumber(batch != null ? batch.getBatchNumber() : (inv.getBatchId() != null ? "BATCH-" + inv.getBatchId() : "N/A"))
                            .systemQty(inv.getOnHandQty())
                            .build();
                })
                .collect(Collectors.toList());

        return AuditScopePreviewResponse.builder()
                .warehouseId(warehouseId)
                .warehouseName(wh.getName())
                .scopeType(scopeType)
                .scopeValue(scopeValue)
                .totalLocations(matchedLocationIds.size())
                .totalProducts(matchedProductIds.size())
                .totalLines(filteredInventories.size())
                .totalExpectedStock(totalExpectedStock)
                .sampleItems(samples)
                .build();
    }

    @Override
    public InventoryAuditResponse createAudit(CreateAuditRequest request) {
        Long warehouseId = request.getWarehouseId() != null ? request.getWarehouseId() : 1L;
        Warehouse wh = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy kho hàng: " + warehouseId));

        Long currentUserId = SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);
        String auditType = request.getAuditType() != null ? request.getAuditType().toUpperCase() : "CYCLE_COUNT";
        String scopeType = request.getScopeType() != null ? request.getScopeType().toUpperCase() : "ALL";
        String scopeValue = request.getScopeValue() != null ? request.getScopeValue().trim() : "";

        String title = request.getTitle();
        if (title == null || title.isBlank()) {
            String typeLabel = "CYCLE_COUNT".equals(auditType) ? "Định kỳ" : "FULL_AUDIT".equals(auditType) ? "Toàn bộ" : "Đột xuất";
            title = String.format("Kiểm kê %s %s - %s", typeLabel, scopeType, LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        }

        InventoryAudit audit = InventoryAudit.builder()
                .auditCode("AUD-" + (System.currentTimeMillis() % 1000000))
                .title(title)
                .warehouseId(warehouseId)
                .auditType(auditType)
                .scopeType(scopeType)
                .scopeValue(scopeValue)
                .isBlindCount(request.getBlindCount() != null ? request.getBlindCount() : true)
                .isIndependentVerificationRequired(request.getRequireRecount() != null ? request.getRequireRecount() : true)
                .includeEmptyBins(request.getIncludeEmptyBins() != null ? request.getIncludeEmptyBins() : false)
                .status("IN_PROGRESS")
                .createdBy(currentUserId)
                .assignedOperatorId(request.getAssignedOperatorId() != null ? request.getAssignedOperatorId() : currentUserId)
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .build();

        // Lấy danh sách tồn kho theo phạm vi (Scope Snapshot)
        List<Location> whLocations = locationRepository.findAll().stream()
                .filter(l -> warehouseId.equals(l.getWarehouseId()))
                .collect(Collectors.toList());
        List<Inventory> whInventories = inventoryRepository.findAuditStock(warehouseId);
        Map<Long, Location> locMap = whLocations.stream().collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, Product> prodMap = productRepository.findAll().stream().collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        List<Inventory> targetedInventories = filterInventoriesByScope(whInventories, locMap, prodMap, scopeType, scopeValue);

        if (targetedInventories.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    String.format("Không tìm thấy dữ liệu tồn kho nào trong phạm vi đã chọn: %s (%s) tại kho %s",
                            scopeType, scopeValue, wh.getName()));
        }

        for (Inventory inv : targetedInventories) {
            if (inv.getOnHandQty() != null && inv.getOnHandQty() > 0) {
                InventoryAuditItem item = InventoryAuditItem.builder()
                        .audit(audit)
                        .locationId(inv.getLocationId())
                        .productId(inv.getProductId())
                        .batchId(inv.getBatchId())
                        .systemQty(inv.getOnHandQty())
                        .status("PENDING")
                        .isVerified(false)
                        .build();
                audit.getItems().add(item);
            }
        }

        InventoryAudit saved = inventoryAuditRepository.save(audit);

        if (notificationService != null) {
            notificationService.broadcast(NotificationMessage.builder()
                    .type("AUDIT_CREATED")
                    .severity("INFO")
                    .title("Đợt Kiểm Kê Mới: " + saved.getAuditCode())
                    .message(String.format("Đã chốt số dư snapshot %d vị trí ô kệ cho đợt kiểm kê %s", saved.getItems().size(), saved.getTitle()))
                    .referenceCode(saved.getAuditCode())
                    .link("/audit")
                    .build());
        }

        return toResponse(saved);
    }

    @Override
    public InventoryAuditResponse createAudit(InventoryAudit audit) {
        CreateAuditRequest req = CreateAuditRequest.builder()
                .warehouseId(audit.getWarehouseId())
                .title(audit.getTitle())
                .auditType(audit.getAuditType())
                .scopeType(audit.getScopeType() != null ? audit.getScopeType() : "ALL")
                .scopeValue(audit.getScopeValue())
                .blindCount(audit.getIsBlindCount())
                .requireRecount(audit.getIsIndependentVerificationRequired())
                .includeEmptyBins(audit.getIncludeEmptyBins())
                .notes(audit.getNotes())
                .assignedOperatorId(audit.getAssignedOperatorId())
                .build();
        return createAudit(req);
    }

    @Override
    public InventoryAuditResponse recordCount(Long auditId, Long itemId, Integer countedQty, String notes) {
        return recordCount(auditId, itemId, null, null, countedQty, notes);
    }

    @Override
    public InventoryAuditResponse recordCount(Long auditId, Long itemId, Long locationId, Long productId, Integer countedQty, String notes) {
        if (countedQty == null || countedQty < 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Số lượng kiểm đếm thực tế không được là số âm!");
        }

        InventoryAudit audit = inventoryAuditRepository.findById(auditId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + auditId));

        if (!"IN_PROGRESS".equals(audit.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Phiên kiểm kê không ở trạng thái đang đếm!");
        }

        InventoryAuditItem targetItem = null;
        if (locationId != null) requireAuditLocation(audit, locationId);
        if (itemId != null) {
            targetItem = audit.getItems().stream()
                    .filter(i -> i.getId().equals(itemId))
                    .findFirst()
                    .orElse(null);
        }

        if (itemId == null && locationId != null) {
            var matches = audit.getItems().stream()
                    .filter(i -> i.getLocationId().equals(locationId) && (productId == null || i.getProductId().equals(productId)))
                    .toList();
            if (matches.size() == 1) targetItem = matches.get(0);
        }

        if (targetItem == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không tìm thấy ô kệ kiểm kê tương ứng trong đợt này!");
        }
        requireAuditLocation(audit, targetItem.getLocationId());

        Long currentUserId = SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);
        int safeCounted = countedQty;

        // Lưu vết lịch sử đếm nhiều vòng
        if (targetItem.getCountedQty() == null) {
            targetItem.setFirstCountQty(safeCounted);
        } else {
            targetItem.setSecondCountQty(safeCounted);
            targetItem.setRecountedBy(currentUserId);
        }

        targetItem.setCountedQty(safeCounted);
        targetItem.setCountedAt(Instant.now());
        if (notes != null && !notes.isBlank()) {
            targetItem.setCounterNotes(notes);
        }

        if (targetItem.getSystemQty() != null && safeCounted == targetItem.getSystemQty()) {
            targetItem.setStatus("MATCHED");
            targetItem.setIsVerified(true);
        } else {
            targetItem.setStatus("DISCREPANCY");
            targetItem.setIsVerified(false);
            int diff = safeCounted - (targetItem.getSystemQty() != null ? targetItem.getSystemQty() : 0);
            if (notificationService != null) {
                notificationService.broadcast(NotificationMessage.builder()
                        .type("AUDIT_DISCREPANCY")
                        .severity("WARNING")
                        .title("Cảnh Báo Lệch Tồn: " + audit.getAuditCode())
                        .message("Phát hiện chênh lệch " + (diff > 0 ? "+" : "") + diff + " sản phẩm tại vị trí ô kệ!")
                        .referenceCode(audit.getAuditCode())
                        .link("/audit")
                        .build());
            }
        }

        // Nếu tất cả ô đều đã đếm xong, chuyển trạng thái sang COMPLETED (Chờ trưởng kho phê duyệt)
        boolean allCounted = audit.getItems().stream().allMatch(i -> i.getCountedQty() != null);
        if (allCounted && "IN_PROGRESS".equals(audit.getStatus())) {
            audit.setStatus("COMPLETED");
            if (notificationService != null) {
                notificationService.broadcast(NotificationMessage.builder()
                        .type("AUDIT_COMPLETED")
                        .severity("INFO")
                        .title("Đợt Kiểm Kê Hoàn Tất Kiểm Đếm: " + audit.getAuditCode())
                        .message("Đã hoàn tất đếm toàn bộ ô kệ. Sẵn sàng đối soát và phê duyệt cân đối.")
                        .referenceCode(audit.getAuditCode())
                        .link("/audit")
                        .build());
            }
        }

        InventoryAudit saved = inventoryAuditRepository.save(audit);
        return toResponse(saved);
    }

    @Override
    public InventoryAuditResponse recountItem(Long auditId, Long itemId, Integer recountQty, String notes) {
        if (recountQty == null || recountQty < 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Số lượng đếm lại không được là số âm!");
        }

        InventoryAudit audit = inventoryAuditRepository.findById(auditId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + auditId));

        if ("APPROVED".equals(audit.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đợt kiểm kê đã được duyệt cân đối, không thể đếm lại!");
        }

        InventoryAuditItem targetItem = audit.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy dòng kiểm kê: " + itemId));

        Long currentUserId = SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);
        targetItem.setSecondCountQty(recountQty);
        targetItem.setCountedQty(recountQty);
        targetItem.setRecountedBy(currentUserId);
        targetItem.setIsVerified(true);
        targetItem.setCountedAt(Instant.now());
        if (notes != null && !notes.isBlank()) {
            targetItem.setCounterNotes(notes);
        }

        if (targetItem.getSystemQty() != null && recountQty.equals(targetItem.getSystemQty())) {
            targetItem.setStatus("MATCHED");
        } else {
            targetItem.setStatus("DISCREPANCY");
        }

        InventoryAudit saved = inventoryAuditRepository.save(audit);
        return toResponse(saved);
    }

    @Override
    public InventoryAuditResponse reconcileAudit(Long id) {
        InventoryAudit audit = inventoryAuditRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + id));

        // 1. Kiểm tra tính lũy biến: không được duyệt lại đợt đã duyệt
        if ("APPROVED".equals(audit.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đợt kiểm kê này đã được phê duyệt và cân đối trước đó!");
        }

        // 2. Kiểm tra gate nghiêm ngặt: toàn bộ ô kệ phải được đếm xong
        long uncountedCount = audit.getItems() != null
                ? audit.getItems().stream().filter(i -> i.getCountedQty() == null).count()
                : 0;
        if (uncountedCount > 0) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    String.format("Không thể phê duyệt! Còn %d vị trí ô kệ chưa hoàn thành kiểm đếm.", uncountedCount));
        }

        Long currentUserId = SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);

        // 3. P0: Kiểm soát phân tách nhiệm vụ (Separation of Duties - SoD)
        // Người kiểm đếm (assignedOperator hoặc người tạo) không được tự phê duyệt cân đối kho
        Long counterId = audit.getAssignedOperatorId() != null ? audit.getAssignedOperatorId() : audit.getCreatedBy();
        boolean isSodRequired = Boolean.TRUE.equals(audit.getIsIndependentVerificationRequired());

        if (isSodRequired && counterId != null && counterId.equals(currentUserId)) {
            // Kiểm tra xem user hiện tại có phải là Admin với quyền Override không
            User currUser = userRepository.findById(currentUserId).orElse(null);
            boolean isAdmin = currUser != null && currUser.getRoles() != null && currUser.getRoles().stream()
                    .anyMatch(r -> "ADMIN".equalsIgnoreCase(r.getName()) || "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
            if (!isAdmin) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        String.format("Vi phạm nguyên tắc Phân tách nhiệm vụ (Separation of Duties): Bạn là người trực tiếp thực hiện kiểm đếm (ID: %d). " +
                                "Cần có Quản lý kho hoặc Kế toán kho khác tiến hành phê duyệt độc lập!", counterId));
            }
        }

        // 4. Kiểm tra có dòng nào phát sinh sai lệch thực tế không
        List<InventoryAuditItem> discrepancyItems = audit.getItems().stream()
                .filter(i -> i.getCountedQty() != null && !i.getCountedQty().equals(i.getSystemQty()))
                .collect(Collectors.toList());

        String adjCode = "ADJ-" + audit.getAuditCode();

        if (discrepancyItems.isEmpty()) {
            // Không có sai lệch (Khớp 100%): Hoàn tất mà không cần tạo bút toán thừa
            audit.setStatus("APPROVED");
            audit.setApprovedBy(currentUserId);
            audit.setCompletedAt(Instant.now());
            audit.setAdjustmentCode(null);

            for (InventoryAuditItem item : audit.getItems()) {
                item.setStatus("MATCHED");
            }

            if (notificationService != null) {
                notificationService.broadcast(NotificationMessage.builder()
                        .type("AUDIT_RECONCILED")
                        .severity("SUCCESS")
                        .title("Kiểm Kê Khớp Tuyệt Đối: " + audit.getAuditCode())
                        .message("Toàn bộ số lượng kiểm đếm khớp 100% với số dư hệ thống. Đợt kiểm kê hoàn tất không phát sinh điều chỉnh.")
                        .referenceCode(audit.getAuditCode())
                        .link("/audit")
                        .build());
            }

            InventoryAudit saved = inventoryAuditRepository.save(audit);
            return toResponse(saved);
        }

        // 5. Có sai lệch: Tạo phiếu điều chỉnh StockAdjustment và ghi StockLedger
        StockAdjustment adjustment = StockAdjustment.builder()
                .adjustmentCode(adjCode)
                .auditId(audit.getId())
                .warehouseId(audit.getWarehouseId())
                .reason(String.format("Cân đối %d dòng sai lệch sau kiểm kê %s (%s)",
                        discrepancyItems.size(), audit.getTitle(), audit.getAuditCode()))
                .status("APPROVED")
                .createdBy(audit.getCreatedBy())
                .approvedBy(currentUserId)
                .approvedAt(Instant.now())
                .notes("Tự động sinh từ kết quả đối soát kiểm kê thực tế của " + audit.getAuditCode())
                .build();
        stockAdjustmentRepository.save(adjustment);

        for (InventoryAuditItem item : audit.getItems()) {
            requireAuditLocation(audit, item.getLocationId());
            if (item.getCountedQty() != null && !item.getCountedQty().equals(item.getSystemQty())) {
                int diff = item.getCountedQty() - item.getSystemQty();

                // Pessimistic write lock đảm bảo tính toàn vẹn tồn kho
                Inventory inv = inventoryRepository.findByProductLocationAndBatchForUpdate(
                        item.getProductId(), item.getLocationId(), item.getBatchId()
                ).orElse(null);

                int after;
                if (inv != null) {
                    after = Math.addExact(inv.getOnHandQty(), diff);
                    if (after < inv.getReservedQty()) {
                        throw new BusinessException(ErrorCode.BAD_REQUEST,
                                String.format("Điều chỉnh giảm khiến tồn thực tế (%d) thấp hơn số đang giữ chỗ (%d) tại vị trí #%d!",
                                        after, inv.getReservedQty(), item.getLocationId()));
                    }
                    inv.setOnHandQty(after);
                    inv.setLastUpdatedAt(Instant.now());
                    inventoryRepository.saveAndFlush(inv);
                } else {
                    // Dòng hàng mới phát hiện (Unexpected Stock) tại ô kệ trống
                    after = item.getCountedQty();
                    inv = Inventory.builder()
                            .locationId(item.getLocationId())
                            .productId(item.getProductId())
                            .batchId(item.getBatchId())
                            .onHandQty(after)
                            .reservedQty(0)
                            .lastUpdatedAt(Instant.now())
                            .build();
                    inventoryRepository.saveAndFlush(inv);
                }

                // Ghi nhận biến động vào Stock Ledger bất biến
                StockLedger ledger = StockLedger.builder()
                        .transactionType("ADJUSTMENT")
                        .referenceCode(adjCode)
                        .locationId(item.getLocationId())
                        .productId(item.getProductId())
                        .batchId(item.getBatchId())
                        .qtyChange(diff)
                        .balanceAfter(after)
                        .performedBy(currentUserId)
                        .notes(String.format("Cân đối kiểm kê %s (%s%d)", audit.getAuditCode(), diff > 0 ? "+" : "", diff))
                        .createdAt(Instant.now())
                        .build();
                stockLedgerRepository.save(ledger);

                StockAdjustmentItem adjItem = StockAdjustmentItem.builder()
                        .adjustment(adjustment)
                        .locationId(item.getLocationId())
                        .productId(item.getProductId())
                        .batchId(item.getBatchId())
                        .systemQty(item.getSystemQty())
                        .actualQty(item.getCountedQty())
                        .build();
                adjustment.getItems().add(adjItem);

                item.setStatus("ADJUSTED");
            } else {
                item.setStatus("MATCHED");
            }
        }

        audit.setStatus("APPROVED");
        audit.setApprovedBy(currentUserId);
        audit.setCompletedAt(Instant.now());
        audit.setAdjustmentCode(adjCode);

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

    private List<Inventory> filterInventoriesByScope(
            List<Inventory> inventories,
            Map<Long, Location> locMap,
            Map<Long, Product> prodMap,
            String scopeType,
            String scopeValue
    ) {
        if ("ALL".equalsIgnoreCase(scopeType) || scopeValue.isBlank()) {
            return inventories;
        }

        String val = scopeValue.trim();
        switch (scopeType.toUpperCase()) {
            case "ZONE":
                return inventories.stream()
                        .filter(inv -> {
                            Location loc = locMap.get(inv.getLocationId());
                            return loc != null && (loc.getZoneCode().equalsIgnoreCase(val) || val.contains(loc.getZoneCode()));
                        })
                        .collect(Collectors.toList());
            case "BIN":
                return inventories.stream()
                        .filter(inv -> {
                            Location loc = locMap.get(inv.getLocationId());
                            return loc != null && (loc.getBinBarcode().equalsIgnoreCase(val) || val.contains(loc.getBinBarcode()));
                        })
                        .collect(Collectors.toList());
            case "SKU":
                return inventories.stream()
                        .filter(inv -> {
                            Product prod = prodMap.get(inv.getProductId());
                            return prod != null && (prod.getSku().equalsIgnoreCase(val) || val.contains(prod.getSku())
                                    || (prod.getBarcode() != null && prod.getBarcode().equalsIgnoreCase(val)));
                        })
                        .collect(Collectors.toList());
            default:
                return inventories;
        }
    }

    private InventoryAuditResponse toResponse(InventoryAudit audit) {
        return toResponses(Collections.singletonList(audit)).get(0);
    }

    private void requireAuditLocation(InventoryAudit audit, Long locationId) {
        if (locationId == null || !locationRepository.findById(locationId)
                .map(loc -> audit.getWarehouseId().equals(loc.getWarehouseId())).orElse(false)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Ô kệ không thuộc kho kiểm kê");
        }
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
        Map<Long, Warehouse> warehouseMap = warehouseRepository.findAll().stream()
                .collect(Collectors.toMap(Warehouse::getId, w -> w, (a, b) -> a));

        return audits.stream().map(audit -> {
            User createdUser = userMap.get(audit.getCreatedBy());
            User assignedUser = userMap.get(audit.getAssignedOperatorId());
            User approvedUser = userMap.get(audit.getApprovedBy());
            Warehouse wh = warehouseMap.get(audit.getWarehouseId());

            boolean isBlindCountActive = Boolean.TRUE.equals(audit.getIsBlindCount()) && "IN_PROGRESS".equals(audit.getStatus());

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
                    User recountedUser = item.getRecountedBy() != null ? userMap.get(item.getRecountedBy()) : null;

                    Integer countedQty = item.getCountedQty();
                    Integer diff = (countedQty != null && item.getSystemQty() != null)
                            ? (countedQty - item.getSystemQty())
                            : null;

                    if (countedQty != null) {
                        countedBins++;
                        if (diff != null && diff != 0) {
                            discrepanciesCount++;
                        }
                    }

                    // P0: Ẩn systemQty nếu đang trong chế độ kiểm kê mù và chưa đếm xong
                    Integer displayedSystemQty = isBlindCountActive && countedQty == null ? null : item.getSystemQty();
                    Integer adjustmentQty = (countedQty != null && item.getSystemQty() != null) ? (countedQty - item.getSystemQty()) : 0;
                    Integer balanceAfter = countedQty != null ? countedQty : item.getSystemQty();

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
                            .systemQty(displayedSystemQty)
                            .countedQty(countedQty)
                            .differenceQty(diff)
                            .firstCountQty(item.getFirstCountQty())
                            .secondCountQty(item.getSecondCountQty())
                            .isVerified(item.getIsVerified())
                            .recountedByName(recountedUser != null ? recountedUser.getFullName() : null)
                            .adjustmentQty(adjustmentQty)
                            .balanceAfter(balanceAfter)
                            .status(item.getStatus())
                            .counterNotes(item.getCounterNotes())
                            .countedAt(item.getCountedAt())
                            .build());
                }
            }

            return InventoryAuditResponse.builder()
                    .id(audit.getId())
                    .auditCode(audit.getAuditCode())
                    .title(audit.getTitle())
                    .warehouseId(audit.getWarehouseId())
                    .warehouseName(wh != null ? wh.getName() : "Kho #" + audit.getWarehouseId())
                    .auditType(audit.getAuditType())
                    .scopeType(audit.getScopeType())
                    .scopeValue(audit.getScopeValue())
                    .isBlindCount(audit.getIsBlindCount())
                    .isIndependentVerificationRequired(audit.getIsIndependentVerificationRequired())
                    .includeEmptyBins(audit.getIncludeEmptyBins())
                    .status(audit.getStatus())
                    .createdBy(audit.getCreatedBy())
                    .createdByName(createdUser != null ? createdUser.getFullName() : "Nhân viên #" + audit.getCreatedBy())
                    .assignedOperatorId(audit.getAssignedOperatorId())
                    .assignedOperatorName(assignedUser != null ? assignedUser.getFullName() : (createdUser != null ? createdUser.getFullName() : "Thủ kho PDA"))
                    .approvedBy(audit.getApprovedBy())
                    .approvedByName(approvedUser != null ? approvedUser.getFullName() : (audit.getApprovedBy() != null ? "Quản lý #" + audit.getApprovedBy() : null))
                    .adjustmentCode(audit.getAdjustmentCode())
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
