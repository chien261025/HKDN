package com.wms.module.order.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.entity.StockLedger;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.repository.StockLedgerRepository;
import com.wms.module.inventory.service.InventoryLockService;
import com.wms.module.masterdata.entity.Category;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.notification.dto.NotificationMessage;
import com.wms.module.notification.service.NotificationService;
import com.wms.module.order.dto.request.CreateOutboundOrderRequest;
import com.wms.module.order.dto.response.OutboundOrderItemResponse;
import com.wms.module.order.dto.response.OutboundOrderResponse;
import com.wms.module.order.dto.response.PickAllocationResponse;
import com.wms.module.order.dto.response.PickListItemResponse;
import com.wms.module.order.entity.OutboundOrder;
import com.wms.module.order.entity.OutboundOrderItem;
import com.wms.module.order.entity.PickAllocation;
import com.wms.module.order.repository.OutboundOrderRepository;
import com.wms.module.order.repository.PickAllocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboundService {

    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryRepository inventoryRepository;
    private final LocationRepository locationRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryLockService inventoryLockService;
    private final OutboundOrderRepository outboundOrderRepository;
    private final PickAllocationRepository pickAllocationRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<OutboundOrderResponse> getAllOutboundOrders() {
        List<OutboundOrder> orders = outboundOrderRepository.findAll();
        if (orders.isEmpty()) {
            return Collections.emptyList();
        }
        return toResponses(orders);
    }

    @Transactional(readOnly = true)
    public OutboundOrderResponse getOutboundOrderById(Long id) {
        OutboundOrder order = outboundOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn xuất: " + id));
        return toResponse(order);
    }

    @Transactional
    public OutboundOrderResponse createOutboundOrder(CreateOutboundOrderRequest request) {
        String code = request.getOrderCode() != null && !request.getOrderCode().isBlank()
                ? request.getOrderCode()
                : "SO-" + System.currentTimeMillis() % 1000000;

        OutboundOrder order = OutboundOrder.builder()
                .orderCode(code)
                .warehouseId(request.getWarehouseId() != null ? request.getWarehouseId() : 1L)
                .customerName(request.getCustomerName() != null ? request.getCustomerName() : "Khách Hàng Doanh Nghiệp")
                .status("PENDING")
                .notes(request.getNotes())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        if (request.getItems() != null) {
            List<OutboundOrderItem> items = new ArrayList<>();
            for (CreateOutboundOrderRequest.ItemRequest itemReq : request.getItems()) {
                OutboundOrderItem item = OutboundOrderItem.builder()
                        .outboundOrder(order)
                        .productId(itemReq.getProductId())
                        .requestedQty(itemReq.getRequestedQty())
                        .allocatedQty(itemReq.getAllocatedQty() != null ? itemReq.getAllocatedQty() : 0)
                        .pickedQty(0)
                        .unitPrice(itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : java.math.BigDecimal.ZERO)
                        .status("PENDING")
                        .createdAt(Instant.now())
                        .build();
                items.add(item);
            }
            order.setItems(items);
        }
        OutboundOrder saved = outboundOrderRepository.save(order);
        return toResponse(saved);
    }

    @Transactional
    public OutboundOrderResponse allocateOutboundOrderFefo(Long id) {
        OutboundOrder order = outboundOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn xuất: " + id));

        if ("DISPATCHED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn xuất đã bàn giao vận chuyển, không thể cấp phát lại!");
        }

        if (order.getItems() != null) {
            for (OutboundOrderItem item : order.getItems()) {
                // Xóa phân bổ cũ nếu có
                pickAllocationRepository.deleteByOutboundOrderItemId(item.getId());
                item.getAllocations().clear();

                int required = item.getRequestedQty();
                List<ProductBatch> activeBatches = productBatchRepository.findActiveBatchesOrderByExpiryAsc(item.getProductId(), LocalDate.now());
                if (activeBatches.isEmpty()) {
                    throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                            "Sản phẩm ID " + item.getProductId() + " không có lô hàng nào còn hạn dùng khả dụng!");
                }

                int remaining = required;
                for (ProductBatch batch : activeBatches) {
                    if (remaining <= 0) break;
                    List<Inventory> batchInvs = inventoryRepository.findByProductIdAndBatchId(item.getProductId(), batch.getId());
                    if (batchInvs == null || batchInvs.isEmpty()) {
                        batchInvs = inventoryRepository.findAll().stream()
                                .filter(i -> i.getProductId().equals(item.getProductId()) && i.getBatchId().equals(batch.getId()))
                                .toList();
                    }
                    for (Inventory inv : batchInvs) {
                        if (remaining <= 0) break;
                        int avail = inv.getAvailableQty();
                        if (avail <= 0) continue;
                        int toTake = Math.min(avail, remaining);

                        // Khóa tồn an toàn
                        inventoryLockService.reserveStock(item.getProductId(), inv.getLocationId(), batch.getId(), toTake);

                        // Lưu bản ghi Phân bổ Lô FEFO thực tế (PickAllocation)
                        PickAllocation alloc = PickAllocation.builder()
                                .outboundOrderItem(item)
                                .productId(item.getProductId())
                                .locationId(inv.getLocationId())
                                .batchId(batch.getId())
                                .allocatedQty(toTake)
                                .pickedQty(0)
                                .status("ALLOCATED")
                                .createdAt(Instant.now())
                                .build();
                        PickAllocation savedAlloc = pickAllocationRepository.save(alloc);
                        item.getAllocations().add(savedAlloc);

                        remaining -= toTake;
                    }
                }

                if (remaining > 0) {
                    throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                            String.format("Không đủ tồn kho khả dụng để cấp phát FEFO cho mặt hàng %d! Thiếu: %d", item.getProductId(), remaining));
                }

                item.setAllocatedQty(required);
                item.setStatus("ALLOCATED");
            }
        }

        order.setStatus("ALLOCATED");
        order.setUpdatedAt(Instant.now());
        OutboundOrder saved = outboundOrderRepository.save(order);

        if (notificationService != null) {
            notificationService.broadcast(NotificationMessage.builder()
                    .type("OUTBOUND_ORDER_ALLOCATED")
                    .title("Cấp Phát Lô FEFO " + order.getOrderCode())
                    .message("Đơn xuất " + order.getOrderCode() + " đã được cấp phát tự động theo hạn dùng FEFO thành công.")
                    .severity("INFO")
                    .referenceCode(order.getOrderCode())
                    .link("/outbound")
                    .build());
        }

        return toResponse(saved);
    }

    @Transactional
    public OutboundOrderResponse dispatchOutboundOrder(Long id) {
        OutboundOrder order = outboundOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn xuất: " + id));

        if ("DISPATCHED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn xuất kho " + order.getOrderCode() + " đã hoàn tất bàn giao vận chuyển trước đó!");
        }

        Long currentUserId = com.wms.module.identity.util.SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);

        if (order.getItems() != null) {
            for (OutboundOrderItem item : order.getItems()) {
                List<PickAllocation> allocations = pickAllocationRepository.findByOutboundOrderItemId(item.getId());

                if (allocations != null && !allocations.isEmpty()) {
                    // Xuất kho theo đúng các Lô và Ô kệ đã được cấp phát FEFO
                    for (PickAllocation alloc : allocations) {
                        if ("PICKED".equals(alloc.getStatus()) || "CANCELLED".equals(alloc.getStatus())) {
                            continue;
                        }

                        Inventory inv = inventoryRepository.findByProductIdAndLocationIdAndBatchId(
                                alloc.getProductId(), alloc.getLocationId(), alloc.getBatchId()
                        ).orElse(null);

                        if (inv != null) {
                            int deduct = alloc.getAllocatedQty();
                            inv.setOnHandQty(Math.max(0, inv.getOnHandQty() - deduct));
                            inv.setReservedQty(Math.max(0, inv.getReservedQty() - deduct));
                            inv.setLastUpdatedAt(Instant.now());
                            inventoryRepository.saveAndFlush(inv);

                            StockLedger ledger = StockLedger.builder()
                                    .transactionType("OUTBOUND")
                                    .referenceCode(order.getOrderCode())
                                    .locationId(alloc.getLocationId())
                                    .productId(alloc.getProductId())
                                    .batchId(alloc.getBatchId())
                                    .qtyChange(-deduct)
                                    .balanceAfter(inv.getOnHandQty())
                                    .performedBy(currentUserId)
                                    .notes("Bàn giao vận chuyển đơn xuất SO: " + order.getOrderCode())
                                    .createdAt(Instant.now())
                                    .build();
                            stockLedgerRepository.save(ledger);
                        }

                        alloc.setStatus("PICKED");
                        alloc.setPickedQty(alloc.getAllocatedQty());
                        alloc.setPickedAt(Instant.now());
                        pickAllocationRepository.save(alloc);
                    }
                    item.setAllocatedQty(item.getRequestedQty());
                    item.setPickedQty(item.getRequestedQty());
                    item.setStatus("SHIPPED");
                } else {
                    // Fallback nếu đơn chưa phân bổ trước đó
                    int qtyToDeduct = item.getRequestedQty();
                    List<Inventory> inventories = inventoryRepository.findByProductIdAndOnHandQtyGreaterThanOrderByReservedQtyDesc(item.getProductId(), 0);
                    if (inventories == null || inventories.isEmpty()) {
                        inventories = inventoryRepository.findAll().stream()
                                .filter(inv -> inv.getProductId().equals(item.getProductId()) && inv.getOnHandQty() > 0)
                                .sorted((a, b) -> Integer.compare(b.getReservedQty(), a.getReservedQty()))
                                .toList();
                    }

                    for (Inventory inv : inventories) {
                        if (qtyToDeduct <= 0) break;
                        int deduct = Math.min(qtyToDeduct, inv.getOnHandQty());
                        inv.setOnHandQty(inv.getOnHandQty() - deduct);
                        inv.setReservedQty(Math.max(0, inv.getReservedQty() - deduct));
                        inv.setLastUpdatedAt(Instant.now());
                        inventoryRepository.saveAndFlush(inv);

                        StockLedger ledger = StockLedger.builder()
                                .transactionType("OUTBOUND")
                                .referenceCode(order.getOrderCode())
                                .locationId(inv.getLocationId())
                                .productId(item.getProductId())
                                .batchId(inv.getBatchId())
                                .qtyChange(-deduct)
                                .balanceAfter(inv.getOnHandQty())
                                .performedBy(currentUserId)
                                .notes("Bàn giao vận chuyển đơn xuất SO: " + order.getOrderCode())
                                .createdAt(Instant.now())
                                .build();
                        stockLedgerRepository.save(ledger);

                        qtyToDeduct -= deduct;
                    }
                    item.setAllocatedQty(item.getRequestedQty());
                    item.setPickedQty(item.getRequestedQty());
                    item.setStatus("SHIPPED");
                }
            }
        }

        order.setStatus("DISPATCHED");
        order.setUpdatedAt(Instant.now());
        OutboundOrder saved = outboundOrderRepository.save(order);

        if (notificationService != null) {
            notificationService.broadcast(NotificationMessage.builder()
                    .type("OUTBOUND_ORDER_CREATED")
                    .title("Xuất Kho Đơn Hàng " + order.getOrderCode())
                    .message("Đơn hàng " + order.getOrderCode() + " đã hoàn tất kiểm đếm và bàn giao vận chuyển thành công.")
                    .severity("SUCCESS")
                    .referenceCode(order.getOrderCode())
                    .link("/outbound")
                    .build());
        }

        return toResponse(saved);
    }

    @Transactional
    public List<PickListItemResponse> generateFefoPickList(Long productId, int totalRequiredQty) {
        log.info("Bắt đầu sinh Pick List FEFO: ProductId={}, RequiredQty={}", productId, totalRequiredQty);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm"));

        List<ProductBatch> activeBatches = productBatchRepository.findActiveBatchesOrderByExpiryAsc(productId, LocalDate.now());
        if (activeBatches.isEmpty()) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, "Sản phẩm không có lô hàng nào còn hạn sử dụng!");
        }

        List<PickListItemResponse> pickList = new ArrayList<>();
        int remainingToPick = totalRequiredQty;
        int stepOrder = 1;

        for (ProductBatch batch : activeBatches) {
            if (remainingToPick <= 0) break;

            List<Inventory> batchInvs = inventoryRepository.findByProductIdAndBatchId(productId, batch.getId());
            if (batchInvs == null || batchInvs.isEmpty()) {
                batchInvs = inventoryRepository.findAll().stream()
                        .filter(i -> i.getProductId().equals(productId) && i.getBatchId().equals(batch.getId()))
                        .toList();
            }

            List<Inventory> inventories = batchInvs.stream()
                    .filter(i -> i.getAvailableQty() > 0)
                    .toList();

            for (Inventory inv : inventories) {
                if (remainingToPick <= 0) break;

                int available = inv.getAvailableQty();
                int takeQty = Math.min(available, remainingToPick);

                inventoryLockService.reserveStock(productId, inv.getLocationId(), batch.getId(), takeQty);

                Location loc = locationRepository.findById(inv.getLocationId()).orElse(null);
                String binBarcode = (loc != null) ? loc.getBinBarcode() : "LOC-" + inv.getLocationId();

                pickList.add(PickListItemResponse.builder()
                        .binBarcode(binBarcode)
                        .productSku(product.getSku())
                        .productName(product.getName())
                        .batchNumber(batch.getBatchNumber())
                        .expiryDate(batch.getExpiryDate())
                        .pickQty(takeQty)
                        .stepOrder(stepOrder++)
                        .build());

                remainingToPick -= takeQty;
            }
        }

        if (remainingToPick > 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                    String.format("Không đủ tồn kho khả dụng! Thiếu: %d cái", remainingToPick));
        }

        log.info("Sinh Pick List thành công gồm {} điểm dừng", pickList.size());
        return pickList;
    }

    private OutboundOrderResponse toResponse(OutboundOrder order) {
        return toResponses(Collections.singletonList(order)).get(0);
    }

    private List<OutboundOrderResponse> toResponses(List<OutboundOrder> orders) {
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

        LocalDate today = LocalDate.now();

        return orders.stream().map(order -> {
            User user = userMap.get(order.getCreatedBy());

            List<OutboundOrderItemResponse> itemResponses = new ArrayList<>();
            if (order.getItems() != null) {
                for (OutboundOrderItem item : order.getItems()) {
                    Product prod = productMap.get(item.getProductId());
                    Category cat = (prod != null && prod.getCategoryId() != null) ? categoryMap.get(prod.getCategoryId()) : null;

                    List<PickAllocation> allocations = pickAllocationRepository.findByOutboundOrderItemId(item.getId());
                    List<PickAllocationResponse> allocResponses = new ArrayList<>();

                    if (allocations != null && !allocations.isEmpty()) {
                        for (PickAllocation a : allocations) {
                            Location loc = locationMap.get(a.getLocationId());
                            ProductBatch batch = batchMap.get(a.getBatchId());

                            Long daysRemaining = null;
                            if (batch != null && batch.getExpiryDate() != null) {
                                daysRemaining = ChronoUnit.DAYS.between(today, batch.getExpiryDate());
                            }

                            allocResponses.add(PickAllocationResponse.builder()
                                    .id(a.getId())
                                    .outboundOrderItemId(a.getOutboundOrderItem().getId())
                                    .productId(a.getProductId())
                                    .productSku(prod != null ? prod.getSku() : "SKU-" + a.getProductId())
                                    .productName(prod != null ? prod.getName() : "Sản phẩm #" + a.getProductId())
                                    .locationId(a.getLocationId())
                                    .locationBarcode(loc != null ? loc.getBinBarcode() : "LOC-" + a.getLocationId())
                                    .zoneCode(loc != null ? loc.getZoneCode() : "")
                                    .batchId(a.getBatchId())
                                    .batchNumber(batch != null ? batch.getBatchNumber() : "BATCH-" + a.getBatchId())
                                    .expiryDate(batch != null ? batch.getExpiryDate() : null)
                                    .daysRemaining(daysRemaining)
                                    .isNearestExpiry(true)
                                    .allocatedQty(a.getAllocatedQty())
                                    .pickedQty(a.getPickedQty())
                                    .status(a.getStatus())
                                    .createdAt(a.getCreatedAt())
                                    .pickedAt(a.getPickedAt())
                                    .build());
                        }
                    }

                    itemResponses.add(OutboundOrderItemResponse.builder()
                            .id(item.getId())
                            .productId(item.getProductId())
                            .sku(prod != null ? prod.getSku() : "SKU-" + item.getProductId())
                            .barcode(prod != null ? prod.getBarcode() : "")
                            .productName(prod != null ? prod.getName() : "Sản phẩm #" + item.getProductId())
                            .categoryName(cat != null ? cat.getName() : "Hàng tiêu dùng")
                            .unit(prod != null ? prod.getUnit() : "Cái")
                            .requestedQty(item.getRequestedQty())
                            .allocatedQty(item.getAllocatedQty())
                            .pickedQty(item.getPickedQty())
                            .unitPrice(item.getUnitPrice())
                            .status(item.getStatus())
                            .createdAt(item.getCreatedAt())
                            .allocations(allocResponses)
                            .build());
                }
            }

            return OutboundOrderResponse.builder()
                    .id(order.getId())
                    .orderCode(order.getOrderCode())
                    .warehouseId(order.getWarehouseId())
                    .customerName(order.getCustomerName())
                    .status(order.getStatus())
                    .createdBy(order.getCreatedBy())
                    .createdByName(user != null ? user.getFullName() : "Nhân viên kho #" + order.getCreatedBy())
                    .notes(order.getNotes())
                    .createdAt(order.getCreatedAt())
                    .updatedAt(order.getUpdatedAt())
                    .items(itemResponses)
                    .build();
        }).collect(Collectors.toList());
    }
}
