package com.wms.module.order.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.service.InventoryLockService;
import com.wms.module.inventory.entity.StockLedger;
import com.wms.module.inventory.repository.StockLedgerRepository;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.order.dto.response.PickListItemResponse;
import com.wms.module.order.entity.OutboundOrder;
import com.wms.module.order.entity.OutboundOrderItem;
import com.wms.module.order.repository.OutboundOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboundService {

    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryRepository inventoryRepository;
    private final LocationRepository locationRepository;
    private final InventoryLockService inventoryLockService;
    private final OutboundOrderRepository outboundOrderRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final com.wms.module.notification.service.NotificationService notificationService;
    private final com.wms.module.identity.repository.UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<OutboundOrder> getAllOutboundOrders() {
        return outboundOrderRepository.findAll();
    }

    @Transactional
    public OutboundOrder createOutboundOrder(com.wms.module.order.dto.request.CreateOutboundOrderRequest request) {
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
            java.util.List<OutboundOrderItem> items = new java.util.ArrayList<>();
            for (com.wms.module.order.dto.request.CreateOutboundOrderRequest.ItemRequest itemReq : request.getItems()) {
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
        return outboundOrderRepository.save(order);
    }

    @Transactional
    public OutboundOrder createOutboundOrder(OutboundOrder order) {
        if (order.getOrderCode() == null || order.getOrderCode().isBlank()) {
            order.setOrderCode("SO-" + System.currentTimeMillis() % 1000000);
        }
        order.setStatus("PENDING");
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        if (order.getItems() != null) {
            for (OutboundOrderItem item : order.getItems()) {
                item.setOutboundOrder(order);
            }
        }
        return outboundOrderRepository.save(order);
    }

    @Transactional
    public OutboundOrder dispatchOutboundOrder(Long id) {
        OutboundOrder order = outboundOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn xuất: " + id));

        if ("DISPATCHED".equalsIgnoreCase(order.getStatus())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Đơn xuất kho " + order.getOrderCode() + " đã hoàn tất bàn giao vận chuyển trước đó!");
        }

        Long currentUserId = com.wms.module.identity.util.SecurityUtils.getCurrentUserIdOrDefault(userRepository, 1L);

        if (order.getItems() != null) {
            for (OutboundOrderItem item : order.getItems()) {
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
            }
        }

        order.setStatus("DISPATCHED");
        order.setUpdatedAt(Instant.now());
        OutboundOrder saved = outboundOrderRepository.save(order);

        if (notificationService != null) {
            notificationService.broadcast(com.wms.module.notification.dto.NotificationMessage.builder()
                    .type("OUTBOUND_ORDER_CREATED")
                    .title("Xuất Kho Đơn Hàng " + order.getOrderCode())
                    .message("Đơn hàng " + order.getOrderCode() + " đã hoàn tất kiểm đếm và bàn giao vận chuyển thành công.")
                    .severity("SUCCESS")
                    .referenceCode(order.getOrderCode())
                    .link("/outbound")
                    .build());
        }

        return saved;
    }

    /**
     * THUẬT TOÁN XUẤT HÀNG THEO CHIẾN LƯỢC FEFO (FIRST EXPIRED, FIRST OUT):
     * 1. Tìm các Lô hàng có hạn dùng gần nhất (expiryDate ASC)
     * 2. Quét các ô chứa hàng của Lô đó, giữ hàng an toàn (Reserve) chống Race condition
     * 3. Sinh Danh sách nhặt hàng (Pick List) tối ưu theo thứ tự dãy kệ để nhân viên không phải đi vòng vèo
     */
    @Transactional
    public List<PickListItemResponse> generateFefoPickList(Long productId, int totalRequiredQty) {
        log.info("Bat dau sinh Pick List FEFO: ProductId={}, RequiredQty={}", productId, totalRequiredQty);

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

        log.info("Sinh Pick List thanh cong gom {} diem dung", pickList.size());
        return pickList;
    }
}
