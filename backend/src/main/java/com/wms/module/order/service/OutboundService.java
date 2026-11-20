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
import com.wms.module.masterdata.repository.SupplierRepository;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.notification.dto.NotificationMessage;
import com.wms.module.notification.service.NotificationService;
import com.wms.module.order.dto.request.CreateOutboundOrderRequest;
import com.wms.module.order.dto.response.OutboundOrderItemResponse;
import com.wms.module.order.dto.response.OutboundOrderResponse;
import com.wms.module.order.dto.response.OutboundStockResponse;
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
    private final SupplierRepository supplierRepository;
    private final com.wms.module.inventory.service.WarehouseStockService warehouseStockService;

    private Supplier validateReceiver(Long partnerId) {
        Supplier partner = partnerId == null ? null : supplierRepository.findById(partnerId).orElse(null);
        if (partner == null || partner.getPartnerRole() != com.wms.module.masterdata.entity.PartnerRole.RECEIVER
                || !Boolean.TRUE.equals(partner.getIsActive())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn xuất phải chọn bên nhận hàng đang hoạt động, không phải nhà cung cấp!");
        }
        return partner;
    }

    @Transactional(readOnly = true)
    public List<Supplier> getWarehousePartners(Long warehouseId) {
        return supplierRepository.findAll().stream()
                .filter(partner -> partner.getPartnerRole() == com.wms.module.masterdata.entity.PartnerRole.RECEIVER
                        && Boolean.TRUE.equals(partner.getIsActive()))
                .sorted(Comparator.comparing(Supplier::getName)).toList();
    }

    @Transactional(readOnly = true)
    public List<OutboundStockResponse> getAvailableProducts() {
        return getStockProducts(false);
    }

    @Transactional(readOnly = true)
    public List<OutboundStockResponse> getStockProducts(boolean includeUnavailable) {
        return warehouseStockService.getClosingBalances(includeUnavailable);
    }

    private boolean isInWarehouse(Inventory inv, Long warehouseId) {
        return locationRepository.findById(inv.getLocationId())
                .map(location -> warehouseId.equals(location.getWarehouseId())
                        && Boolean.TRUE.equals(location.getIsActive()))
                .orElse(false);
    }

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
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn xuất phải có ít nhất một sản phẩm!");
        }
        Long warehouseId = request.getWarehouseId() != null ? request.getWarehouseId() : 1L;
        Supplier receiver = validateReceiver(request.getPartnerId());
        request.setCustomerName(receiver.getName());
        Map<Long, Integer> available = getAvailableProducts().stream()
                .filter(p -> warehouseId.equals(p.getWarehouseId()))
                .collect(Collectors.toMap(OutboundStockResponse::getProductId, OutboundStockResponse::getAvailableQty));
        Set<Long> seen = new HashSet<>();
        for (CreateOutboundOrderRequest.ItemRequest item : request.getItems()) {
            if (item == null || item.getProductId() == null || item.getRequestedQty() == null
                    || item.getRequestedQty() <= 0 || !seen.add(item.getProductId())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "Sản phẩm không hợp lệ, bị trùng hoặc số lượng xuất không hợp lệ!");
            }
            if (item.getRequestedQty() > available.getOrDefault(item.getProductId(), 0)) {
                throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                        "Sản phẩm " + item.getProductId() + " không đủ tồn khả dụng trong kho đã chọn!");
            }
        }
        String code = request.getOrderCode() != null && !request.getOrderCode().isBlank()
                ? request.getOrderCode()
                : "SO-" + System.currentTimeMillis() % 1000000;

        OutboundOrder order = OutboundOrder.builder()
                .orderCode(code)
                .warehouseId(request.getWarehouseId() != null ? request.getWarehouseId() : 1L)
                .partnerId(request.getPartnerId())
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
                        .allocatedQty(0)
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
        OutboundOrder order = outboundOrderRepository.findForUpdate(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn xuất: " + id));
        validateReceiver(order.getPartnerId());

        if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Chỉ có thể cấp phát đơn đang chờ duyệt!");
        }

        if (order.getItems() != null) {
            for (OutboundOrderItem item : order.getItems()) {
                // Xóa phân bổ cũ nếu có
                pickAllocationRepository.deleteByOutboundOrderItemId(item.getId());
                item.getAllocations().clear();

                int required = item.getRequestedQty();
                if (required <= 0)
                    throw new BusinessException(ErrorCode.BAD_REQUEST, "Số lượng xuất phải lớn hơn 0!");
                List<ProductBatch> activeBatches = productBatchRepository
                        .findActiveBatchesOrderByExpiryAsc(item.getProductId(), LocalDate.now());
                if (activeBatches.isEmpty()) {
                    throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                            "Sản phẩm ID " + item.getProductId() + " không có lô hàng nào còn hạn dùng khả dụng!");
                }

                int remaining = required;
                for (ProductBatch batch : activeBatches) {
                    if (remaining <= 0)
                        break;
                    List<Inventory> batchInvs = inventoryRepository.findByProductIdAndBatchId(item.getProductId(),
                            batch.getId());
                    if (batchInvs == null || batchInvs.isEmpty()) {
                        batchInvs = inventoryRepository.findAll().stream()
                                .filter(i -> i.getProductId().equals(item.getProductId())
                                        && i.getBatchId().equals(batch.getId()))
                                .toList();
                    }
                    for (Inventory inv : batchInvs) {
                        if (remaining <= 0)
                            break;
                        if (!isInWarehouse(inv, order.getWarehouseId()))
                            continue;
                        Inventory locked = inventoryRepository.findByProductLocationAndBatchForUpdate(
                                inv.getProductId(), inv.getLocationId(), inv.getBatchId())
                                .orElseThrow(() -> new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                                        "Không tìm thấy tồn kho!"));
                        int avail = locked.getAvailableQty();
                        if (avail <= 0)
                            continue;
                        int toTake = Math.min(avail, remaining);

                        // Khóa tồn an toàn
                        inventoryLockService.reserveStock(item.getProductId(), inv.getLocationId(), batch.getId(),
                                toTake);

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
                            String.format("Không đủ tồn kho khả dụng để cấp phát FEFO cho mặt hàng %d! Thiếu: %d",
                                    item.getProductId(), remaining));
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
                    .message("Đơn xuất " + order.getOrderCode()
                            + " đã được cấp phát tự động theo hạn dùng FEFO thành công.")
                    .severity("INFO")
                    .referenceCode(order.getOrderCode())
                    .link("/outbound")
                    .build());
        }

        return toResponse(saved);
    }

    @Transactional
    public OutboundOrderResponse dispatchOutboundOrder(Long id) {
        OutboundOrder order = outboundOrderRepository.findForUpdate(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn xuất: " + id));
        validateReceiver(order.getPartnerId());
        if (!Set.of("PENDING", "ALLOCATED", "PICKING").contains(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn xuất đã hoàn tất hoặc không thể xuất kho!");
        }
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn xuất không có sản phẩm!");
        }
        // A direct dispatch uses the same warehouse-scoped FEFO allocation in this
        // transaction.
        if ("PENDING".equals(order.getStatus()))
            allocateOutboundOrderFefo(id);
        Long currentUserId = com.wms.module.identity.util.SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);
        for (OutboundOrderItem item : order.getItems()) {
            List<PickAllocation> allocations = pickAllocationRepository.findByOutboundOrderItemId(item.getId());
            int allocated = allocations.stream().filter(a -> !"CANCELLED".equals(a.getStatus()))
                    .mapToInt(PickAllocation::getAllocatedQty).sum();
            if (item.getRequestedQty() <= 0 || allocated != item.getRequestedQty()) {
                throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, "Phân bổ không khớp số lượng cần xuất!");
            }
            for (PickAllocation alloc : allocations) {
                if ("CANCELLED".equals(alloc.getStatus()))
                    continue;
                int deduct = alloc.getAllocatedQty();
                Inventory inv = inventoryRepository.findByProductLocationAndBatchForUpdate(
                        alloc.getProductId(), alloc.getLocationId(), alloc.getBatchId())
                        .orElseThrow(() -> new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                                "Không tìm thấy tồn kho đã phân bổ!"));
                boolean activeBatch = productBatchRepository
                        .findActiveBatchesOrderByExpiryAsc(item.getProductId(), LocalDate.now())
                        .stream().anyMatch(batch -> batch.getId().equals(alloc.getBatchId()));
                if (!item.getProductId().equals(alloc.getProductId()) || !isInWarehouse(inv, order.getWarehouseId())
                        || !activeBatch || deduct <= 0 || inv.getOnHandQty() < deduct
                        || inv.getReservedQty() < deduct) {
                    throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                            "Tồn kho không đủ hoặc lô hàng không hợp lệ trong kho của đơn xuất!");
                }
                inv.setOnHandQty(inv.getOnHandQty() - deduct);
                inv.setReservedQty(inv.getReservedQty() - deduct);
                inv.setLastUpdatedAt(Instant.now());
                inventoryRepository.saveAndFlush(inv);
                stockLedgerRepository.save(StockLedger.builder()
                        .transactionType("OUTBOUND").referenceCode(order.getOrderCode())
                        .locationId(inv.getLocationId()).productId(inv.getProductId()).batchId(inv.getBatchId())
                        .qtyChange(-deduct).balanceAfter(inv.getOnHandQty()).performedBy(currentUserId)
                        .notes("Xuất kho đơn SO: " + order.getOrderCode()).createdAt(Instant.now()).build());
                alloc.setStatus("PICKED");
                alloc.setPickedQty(deduct);
                alloc.setPickedAt(Instant.now());
                pickAllocationRepository.save(alloc);
            }
            item.setAllocatedQty(item.getRequestedQty());
            item.setPickedQty(item.getRequestedQty());
            item.setStatus("SHIPPED");
        }
        order.setStatus("DISPATCHED");
        order.setUpdatedAt(Instant.now());
        OutboundOrder saved = outboundOrderRepository.save(order);
        if (notificationService != null) {
            notificationService.broadcast(NotificationMessage.builder()
                    .type("OUTBOUND_ORDER_DISPATCHED").title("Xuất Kho " + order.getOrderCode())
                    .message("Đã xuất đủ hàng và cập nhật tồn cuối kho.").severity("SUCCESS")
                    .referenceCode(order.getOrderCode()).link("/outbound").build());
        }
        return toResponse(saved);
    }

    @Transactional
    public List<PickListItemResponse> generateFefoPickList(Long productId, int totalRequiredQty) {
        log.info("Bắt đầu sinh Pick List FEFO: ProductId={}, RequiredQty={}", productId, totalRequiredQty);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm"));

        List<ProductBatch> activeBatches = productBatchRepository.findActiveBatchesOrderByExpiryAsc(productId,
                LocalDate.now());
        if (activeBatches.isEmpty()) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, "Sản phẩm không có lô hàng nào còn hạn sử dụng!");
        }

        List<PickListItemResponse> pickList = new ArrayList<>();
        int remainingToPick = totalRequiredQty;
        int stepOrder = 1;

        for (ProductBatch batch : activeBatches) {
            if (remainingToPick <= 0)
                break;

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
                if (remainingToPick <= 0)
                    break;

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
                    Category cat = (prod != null && prod.getCategoryId() != null)
                            ? categoryMap.get(prod.getCategoryId())
                            : null;

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
                    .partnerId(order.getPartnerId())
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
