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
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.order.dto.request.ExecutePutawayRequest;
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
    private final InboundOrderRepository inboundOrderRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryRepository inventoryRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final com.wms.module.notification.service.NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<InboundOrder> getAllInboundOrders() {
        return inboundOrderRepository.findAll();
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
    public InboundOrder receiveInboundOrder(Long id) {
        InboundOrder order = inboundOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn nhập: " + id));

        if ("RECEIVED".equalsIgnoreCase(order.getStatus()) || "STOCKED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn nhập kho " + order.getOrderCode() + " đã được tiếp nhận trước đó!");
        }

        order.setStatus("RECEIVED");
        order.setUpdatedAt(Instant.now());
        if (order.getItems() != null) {
            for (InboundOrderItem item : order.getItems()) {
                item.setReceivedQty(item.getExpectedQty());
                item.setStatus("COMPLETED");
            }
        }
        return inboundOrderRepository.save(order);
    }

    /**
     * THUẬT TOÁN GỢI Ý VỊ TRÍ CẤT HÀNG (PUT-AWAY ALGORITHM):
     * 1. Ưu tiên đúng Zone nhiệt độ/chủng loại của sản phẩm (Zone A: Khô, Zone B: Mát)
     * 2. Ưu tiên các ô kệ còn đủ tải trọng chứa hàng
     * 3. Đối với hàng nặng (> 100kg), ưu tiên tầng thấp nhất (Shelf S01) để đảm bảo an toàn kết cấu
     */
    @Transactional(readOnly = true)
    public Location suggestOptimalPutAwayLocation(String preferredZone, BigDecimal itemTotalWeightKg) {
        log.info("Chay thuat toan Put-away: Zone={}, Weight={}", preferredZone, itemTotalWeightKg);

        List<Location> availableLocations = locationRepository.findByZoneCode(preferredZone);
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

        InboundOrder order = inboundOrderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn nhập: " + request.getOrderId()));

        if ("STOCKED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn nhập kho " + order.getOrderCode() + " đã hoàn tất cất hàng (STOCKED) trước đó!");
        }

        Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ: " + request.getLocationId()));

        String batchNumber = request.getBatchNumber();
        if (batchNumber == null || batchNumber.isBlank()) {
            batchNumber = "BATCH-PO" + order.getId() + "-" + (System.currentTimeMillis() % 10000);
        }

        final String finalBatchNumber = batchNumber;
        ProductBatch batch = productBatchRepository.findByProductIdAndBatchNumber(request.getProductId(), finalBatchNumber)
                .orElseGet(() -> {
                    LocalDate expiry = request.getExpiryDate() != null ? request.getExpiryDate() : LocalDate.now().plusYears(1);
                    ProductBatch newBatch = ProductBatch.builder()
                            .productId(request.getProductId())
                            .batchNumber(finalBatchNumber)
                            .manufactureDate(LocalDate.now())
                            .expiryDate(expiry)
                            .status("ACTIVE")
                            .supplierId(order.getSupplierId())
                            .build();
                    return productBatchRepository.save(newBatch);
                });

        Inventory inventory = inventoryRepository.findByProductIdAndLocationIdAndBatchId(
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
        inventoryRepository.saveAndFlush(inventory);

        StockLedger ledger = StockLedger.builder()
                .transactionType("INBOUND")
                .referenceCode(order.getOrderCode())
                .locationId(request.getLocationId())
                .productId(request.getProductId())
                .batchId(batch.getId())
                .qtyChange(request.getQuantity())
                .balanceAfter(inventory.getOnHandQty())
                .performedBy(1L)
                .notes("Cất hàng từ khu đệm Staging lên ô kệ " + location.getBinBarcode())
                .createdAt(Instant.now())
                .build();
        stockLedgerRepository.save(ledger);

        if (order.getItems() != null) {
            boolean allStocked = true;
            for (InboundOrderItem item : order.getItems()) {
                if (request.getOrderItemId() != null && request.getOrderItemId().equals(item.getId())) {
                    item.setReceivedQty(request.getQuantity());
                    item.setStatus("COMPLETED");
                } else if (item.getProductId() != null && item.getProductId().equals(request.getProductId())) {
                    item.setReceivedQty(request.getQuantity());
                    item.setStatus("COMPLETED");
                }
                if (!"COMPLETED".equalsIgnoreCase(item.getStatus())) {
                    allStocked = false;
                }
            }
            if (allStocked) {
                order.setStatus("STOCKED");
            }
        } else {
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
}
