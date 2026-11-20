package com.wms.module.order.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.entity.StockLedger;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.repository.StockLedgerRepository;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.order.dto.request.ExecutePutawayRequest;
import com.wms.module.order.dto.request.ReceiveInboundRequest;
import com.wms.module.order.entity.InboundOrder;
import com.wms.module.order.entity.InboundOrderItem;
import com.wms.module.order.repository.InboundOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InboundService {

    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;
    private final InboundOrderRepository inboundOrderRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryRepository inventoryRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final com.wms.module.identity.repository.UserRepository userRepository;
    private final com.wms.module.notification.service.NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<InboundOrder> getAllInboundOrders(Long warehouseId) {
        if (warehouseId != null) {
            return inboundOrderRepository.findByWarehouseIdOrderByCreatedAtDesc(warehouseId);
        }
        return inboundOrderRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public List<InboundOrder> getAllInboundOrders() {
        return getAllInboundOrders(null);
    }

    @Transactional
    public InboundOrder createInboundOrder(com.wms.module.order.dto.request.CreateInboundOrderRequest request) {
        String code = request.getOrderCode() != null && !request.getOrderCode().isBlank()
                ? request.getOrderCode()
                : "PO-" + System.currentTimeMillis() % 1000000;

        InboundOrder order = InboundOrder.builder()
                .orderCode(code)
                .warehouseId(request.getWarehouseId() != null ? request.getWarehouseId() : 1L)
                .supplierId(request.getSupplierId())
                .status("PENDING")
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        if (request.getItems() != null) {
            java.util.List<InboundOrderItem> items = new java.util.ArrayList<>();
            for (com.wms.module.order.dto.request.CreateInboundOrderRequest.ItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND,
                                "Không tìm thấy sản phẩm: " + itemReq.getProductId()));
                if (!Boolean.TRUE.equals(product.getIsActive()) || product.getDeletedAt() != null || "DISCONTINUED".equalsIgnoreCase(product.getBusinessStatus()) || "SUSPENDED".equalsIgnoreCase(product.getBusinessStatus())) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Sản phẩm không hoạt động hoặc đang ngưng/tạm dừng kinh doanh (" + product.getBusinessStatus() + "): " + product.getName());
                }
                if (!request.getSupplierId().equals(product.getSupplierId())) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST,
                            "Sản phẩm " + product.getName() + " không thuộc nhà cung cấp đã chọn");
                }
                InboundOrderItem item = InboundOrderItem.builder()
                        .inboundOrder(order)
                        .productId(itemReq.getProductId())
                        .expectedQty(itemReq.getExpectedQty())
                        .receivedQty(0)
                        .batchNumber(itemReq.getBatchNumber())
                        .expiryDate(itemReq.getExpiryDate())
                        .unitPrice(itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : BigDecimal.ZERO)
                        .status("PENDING")
                        .createdAt(Instant.now())
                        .build();
                items.add(item);
            }
            order.setItems(items);

            // Kiểm tra sức chứa vật lý của kho đích (Warehouse Capacity Validation)
            java.util.Map<String, BigDecimal> zoneWeightMap = new java.util.HashMap<>();
            for (var itemReq : request.getItems()) {
                Product p = productRepository.findById(itemReq.getProductId()).orElse(null);
                if (p != null) {
                    BigDecimal unitWeight = p.getWeightKg() != null ? p.getWeightKg() : BigDecimal.ONE;
                    BigDecimal itemWeight = unitWeight.multiply(BigDecimal.valueOf(itemReq.getExpectedQty()));
                    String condition = p.getStorageCondition() != null ? p.getStorageCondition() : "AMBIENT";
                    String zone = "COOL".equalsIgnoreCase(condition) ? "ZONE_B" :
                                  "COLD".equalsIgnoreCase(condition) ? "ZONE_C" :
                                  "SECURE".equalsIgnoreCase(condition) ? "ZONE_D" : "ZONE_A";
                    zoneWeightMap.merge(zone, itemWeight, BigDecimal::add);
                }
            }

            for (java.util.Map.Entry<String, BigDecimal> entry : zoneWeightMap.entrySet()) {
                String zone = entry.getKey();
                BigDecimal neededWeight = entry.getValue();
                List<Location> zoneLocs = locationRepository.findByWarehouseIdAndZoneCode(request.getWarehouseId(), zone);
                BigDecimal zoneCapacity = zoneLocs.stream()
                        .filter(Location::getIsActive)
                        .map(Location::getMaxWeightKg)
                        .filter(java.util.Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (zoneCapacity.compareTo(BigDecimal.ZERO) > 0 && neededWeight.compareTo(zoneCapacity) > 0) {
                    // Enterprise Planning Principle: Ở bước tạo Đơn đặt hàng (PO), không chặn cứng (Hard Block)
                    // để doanh nghiệp có thể ký kết hợp đồng số lượng lớn, giao hàng nhiều đợt (Split Deliveries)
                    // hoặc luân chuyển Cross-Docking không qua kệ. Hệ thống ghi log cảnh báo sức chứa kho.
                    log.warn("Lưu ý tải trọng PO: Đơn hàng {} kg vượt quá sức chứa kệ tức thời phân khu {} của kho đích ({} kg). Doanh nghiệp có thể chia đợt giao hoặc Cross-Docking.",
                            neededWeight.toBigInteger(), zone, zoneCapacity.toBigInteger());
                }
            }
        }
        return inboundOrderRepository.save(order);
    }

    @Transactional
    public InboundOrder createInboundOrder(InboundOrder order) {
        if (order.getOrderCode() == null || order.getOrderCode().isBlank()) {
            order.setOrderCode("PO-" + System.currentTimeMillis() % 1000000);
        }
        order.setStatus("PENDING");
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        if (order.getItems() != null) {
            for (InboundOrderItem item : order.getItems()) {
                item.setInboundOrder(order);
                item.setStatus("PENDING");
            }
        }
        return inboundOrderRepository.save(order);
    }

    @Transactional
    public InboundOrder receiveInboundOrder(Long id, ReceiveInboundRequest request) {
        InboundOrder order = inboundOrderRepository.findForUpdate(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn nhập: " + id));

        if (!"PENDING".equals(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Chỉ được tiếp nhận đơn đang chờ");
        }

        var lines = new java.util.HashMap<Long, ReceiveInboundRequest.Line>();
        for (var line : request.items()) {
            if (lines.put(line.id(), line) != null) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Dòng kiểm nhận bị trùng");
            }
        }
        if (lines.size() != order.getItems().size() || lines.isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Cần kiểm nhận đủ các dòng của đơn");
        }
        for (InboundOrderItem item : order.getItems()) {
            var line = lines.get(item.getId());
            if (line == null || line.rejectedQty() > line.receivedQty()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Dòng hàng hoặc số lượng lỗi không hợp lệ");
            }
            var tolerance = item.getOverDeliveryTolerancePct();
            var max = BigDecimal.valueOf(item.getExpectedQty()).multiply(BigDecimal.ONE.add(
                    tolerance == null ? BigDecimal.ZERO : tolerance.movePointLeft(2)));
            if (BigDecimal.valueOf(line.receivedQty()).compareTo(max) > 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Số thực nhận vượt dung sai của đơn");
            }
            if (line.receivedQty() > line.rejectedQty()) {
                if (line.batchNumber() == null || line.batchNumber().isBlank()) {
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Hàng đạt QC phải có mã lô");
                }
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                if (product != null && Boolean.TRUE.equals(product.getIsExpiryManaged())) {
                    if (line.expiryDate() == null) {
                        throw new BusinessException(ErrorCode.BAD_REQUEST, "Sản phẩm " + product.getName() + " thuộc diện quản lý HSD, bắt buộc phải khai báo ngày hết hạn khi nhận lô!");
                    }
                    if (line.expiryDate().isBefore(LocalDate.now())) {
                        throw new BusinessException(ErrorCode.BAD_REQUEST, "Hạn sử dụng của lô (" + line.expiryDate() + ") đã quá hạn, không được phép tiếp nhận nhập kho!");
                    }
                }
            }
            item.setReceivedQty(line.receivedQty());
            item.setRejectedQty(line.rejectedQty());
            item.setBatchNumber(line.batchNumber() == null ? null : line.batchNumber().trim());
            item.setExpiryDate(line.expiryDate());
            if (item.getRemainingQty() > 0) {
                productBatchRepository.findByProductIdAndBatchNumber(item.getProductId(), item.getBatchNumber())
                        .ifPresent(batch -> requireMatchingExpiry(batch, item));
            }
            item.setStatus(item.getRemainingQty() == 0 ? "COMPLETED" : "RECEIVED");
        }
        order.setStatus(order.getItems().stream().allMatch(i -> i.getRemainingQty() == 0) ? "CLOSED_NO_STOCK" : "RECEIVED");
        order.setUpdatedAt(Instant.now());
        return inboundOrderRepository.save(order);
    }

    /**
     * THUẬT TOÁN GỢI Ý VỊ TRÍ CẤT HÀNG (PUT-AWAY ALGORITHM):
     * 1. Ưu tiên đúng Zone nhiệt độ/chủng loại của sản phẩm (Zone A: Khô, Zone B: Mát)
     * 2. Ưu tiên các ô kệ còn đủ tải trọng chứa hàng
     * 3. Đối với hàng nặng (> 100kg), ưu tiên tầng thấp nhất (Shelf S01) để đảm bảo an toàn kết cấu
     */
    @Transactional(readOnly = true)
    public Location suggestOptimalPutAwayLocation(Long warehouseId, String preferredZone, BigDecimal itemTotalWeightKg) {
        log.info("Chay thuat toan Put-away: Zone={}, Weight={}", preferredZone, itemTotalWeightKg);

        List<Location> availableLocations = locationRepository.findByWarehouseIdAndZoneCode(warehouseId, preferredZone);
        if (availableLocations.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ nào trong phân khu: " + preferredZone);
        }

        boolean isHeavyItem = itemTotalWeightKg.compareTo(BigDecimal.valueOf(100.0)) > 0;

        return availableLocations.stream()
                .filter(Location::getIsActive)
                .filter(loc -> loc.getMaxWeightKg().compareTo(itemTotalWeightKg) >= 0)
                .sorted((l1, l2) -> {
                    if (isHeavyItem) {
                        boolean l1IsBottom = "S01".equalsIgnoreCase(l1.getShelf());
                        boolean l2IsBottom = "S01".equalsIgnoreCase(l2.getShelf());
                        if (l1IsBottom && !l2IsBottom) return -1;
                        if (!l1IsBottom && l2IsBottom) return 1;
                    }
                    int aisleCompare = l1.getAisle().compareTo(l2.getAisle());
                    if (aisleCompare != 0) return aisleCompare;
                    return l1.getShelf().compareTo(l2.getShelf());
                })
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.LOCATION_FULL, 
                        "Khu vực " + preferredZone + " không còn ô kệ nào đủ tải trọng " + itemTotalWeightKg + "kg"));
    }

    @Transactional
    public InboundOrder executePutaway(ExecutePutawayRequest request) {
        log.info("Thuc hien cat hang Put-away: OrderId={}, ProductId={}, Loc={}, Qty={}",
                request.getOrderId(), request.getProductId(), request.getLocationId(), request.getQuantity());

        InboundOrder order = inboundOrderRepository.findForUpdate(request.getOrderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn nhập: " + request.getOrderId()));

        // Product identity must come from the inbound order. Do not allow a
        // stale/inferred client ID to write stock into another product.
        boolean productBelongsToOrder = order.getItems() != null && order.getItems().stream()
                .anyMatch(item -> request.getProductId().equals(item.getProductId()));
        if (!productBelongsToOrder) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Product " + request.getProductId() + " does not belong to inbound order " + order.getOrderCode());
        }

        if ("STOCKED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn nhập kho " + order.getOrderCode() + " đã hoàn tất cất hàng (STOCKED) trước đó!");
        }
        if (!"RECEIVED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn nhập chưa được tiếp nhận: " + order.getOrderCode());
        }

        InboundOrderItem targetItem = order.getItems().stream()
                .filter(item -> request.getOrderItemId() != null && request.getOrderItemId().equals(item.getId()))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Dòng hàng không thuộc đơn nhập"));
        if (!request.getProductId().equals(targetItem.getProductId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Sản phẩm không khớp dòng đơn nhập");
        }
        if (request.getExpectedStockedQty() != targetItem.getStockedQty()) {
            throw new BusinessException(ErrorCode.CONCURRENCY_CONFLICT, "Dòng hàng vừa được cất kệ. Vui lòng tải lại đơn");
        }
        if (request.getQuantity() <= 0 || request.getQuantity() > targetItem.getRemainingQty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Số lượng cất vượt số hàng đạt QC còn chờ cất");
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ: " + request.getLocationId()));

        if (!order.getWarehouseId().equals(location.getWarehouseId()) || !Boolean.TRUE.equals(location.getIsActive())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Ô kệ không hoạt động hoặc không thuộc kho của đơn");
        }
        // Legacy receipts may predate mandatory lot capture. Keep their generated lot stable across placements.
        final String finalBatchNumber = targetItem.getBatchNumber() == null || targetItem.getBatchNumber().isBlank()
                ? "PO-" + order.getId() + "-" + targetItem.getId() : targetItem.getBatchNumber();
        ProductBatch batch = productBatchRepository.findByProductIdAndBatchNumber(request.getProductId(), finalBatchNumber)
                .orElseGet(() -> {
                    ProductBatch newBatch = ProductBatch.builder()
                            .productId(request.getProductId())
                            .batchNumber(finalBatchNumber)
                            .manufactureDate(targetItem.getManufactureDate())
                            .expiryDate(targetItem.getExpiryDate())
                            .status("ACTIVE")
                            .supplierId(order.getSupplierId())
                            .build();
                    return productBatchRepository.save(newBatch);
                });
        requireMatchingExpiry(batch, targetItem);

        Inventory inventory = inventoryRepository.findByProductLocationAndBatchForUpdate(
                request.getProductId(), request.getLocationId(), batch.getId())
                .orElseGet(() -> Inventory.builder()
                        .productId(request.getProductId())
                        .locationId(request.getLocationId())
                        .batchId(batch.getId())
                        .onHandQty(0)
                        .reservedQty(0)
                        .lastUpdatedAt(Instant.now())
                        .build());

        inventory.setOnHandQty(inventory.getOnHandQty() + request.getQuantity());
        inventory.setLastUpdatedAt(Instant.now());
        inventoryRepository.saveAndFlush(inventory);

        StockLedger ledger = StockLedger.builder()
                .transactionType("INBOUND")
                .referenceCode(order.getOrderCode())
                .locationId(request.getLocationId())
                .productId(request.getProductId())
                .batchId(batch.getId())
                .qtyChange(request.getQuantity())
                .balanceAfter(inventory.getOnHandQty())
                .performedBy(com.wms.module.identity.util.SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L))
                .notes("Cất hàng từ khu đệm Staging lên ô kệ " + location.getBinBarcode())
                .createdAt(Instant.now())
                .build();
        stockLedgerRepository.saveAndFlush(ledger);

        targetItem.setProductBatchId(batch.getId());
        targetItem.setBatchNumber(finalBatchNumber);
        targetItem.setStockedQty(targetItem.getStockedQty() + request.getQuantity());
        targetItem.setStatus(targetItem.getRemainingQty() == 0 ? "COMPLETED" : "PARTIAL");
        if (order.getItems().stream().allMatch(item -> item.getRemainingQty() == 0)) {
            order.setStatus("STOCKED");
        }

        order.setUpdatedAt(Instant.now());
        InboundOrder saved = inboundOrderRepository.save(order);

        if ("STOCKED".equalsIgnoreCase(saved.getStatus()) && notificationService != null) {
            notificationService.broadcast(com.wms.module.notification.dto.NotificationMessage.builder()
                    .type("INBOUND_ORDER_CREATED")
                    .title("Hoàn Tất Nhập Kho " + order.getOrderCode())
                    .message("Đơn hàng " + order.getOrderCode() + " đã hoàn tất cất hàng lên ô kệ kho thành công.")
                    .severity("SUCCESS")
                    .referenceCode(order.getOrderCode())
                    .link("/inbound")
                    .build());
        }

        return saved;
    }

    @Transactional
    public InboundOrder closeInboundOrder(Long id, String reason) {
        InboundOrder order = inboundOrderRepository.findForUpdate(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn nhập: " + id));

        if ("STOCKED".equalsIgnoreCase(order.getStatus()) || "CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn đã kết thúc trước đó");
        }

        boolean anyStocked = false;
        if (order.getItems() != null) {
            for (InboundOrderItem item : order.getItems()) {
                if (item.getStockedQty() > 0) {
                    anyStocked = true;
                }
                item.setStatus("COMPLETED");
            }
        }

        order.setStatus(anyStocked ? "STOCKED" : "CANCELLED");
        order.setNotes((order.getNotes() != null ? order.getNotes() + " | " : "") + "Đóng đơn tại cổng/khu đệm: " + reason);
        order.setUpdatedAt(Instant.now());
        return inboundOrderRepository.save(order);
    }

    private void requireMatchingExpiry(ProductBatch batch, InboundOrderItem item) {
        if (!java.util.Objects.equals(batch.getExpiryDate(), item.getExpiryDate())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Hạn dùng kiểm nhận không khớp lô hiện có: " + batch.getBatchNumber());
        }
    }
}
