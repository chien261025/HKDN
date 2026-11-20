package com.wms.module.inventory.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.inventory.dto.response.ExpiringBatchAlertResponse;
import com.wms.module.inventory.dto.response.InventoryBalanceResponse;
import com.wms.module.inventory.dto.response.SafetyStockAlertResponse;
import com.wms.module.inventory.dto.response.SlowMovingStockAlertResponse;
import com.wms.module.inventory.dto.response.StockLedgerResponse;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.entity.StockLedger;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.repository.StockLedgerRepository;
import com.wms.module.inventory.service.InventoryQueryService;
import com.wms.module.masterdata.entity.Category;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.repository.WarehouseRepository;
import com.wms.module.order.dto.response.OutboundStockResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InventoryQueryServiceImpl implements InventoryQueryService {

    private final InventoryRepository inventoryRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final ProductRepository productRepository;
    private final LocationRepository locationRepository;
    private final ProductBatchRepository productBatchRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;
    private final UserRepository userRepository;
    private final com.wms.module.inventory.service.WarehouseStockService warehouseStockService;

    @Override
    @Transactional(readOnly = true)
    public List<OutboundStockResponse> getClosingBalances(Long warehouseId) {
        return warehouseStockService.getClosingBalances(warehouseId, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InventoryBalanceResponse> getAllBalances(Long warehouseId) {
        List<Inventory> allInventory = inventoryRepository.findAll();
        if (allInventory.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<Long, Location> locationMap = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(ProductBatch::getId, b -> b, (a, b) -> a));
        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));
        Map<Long, Warehouse> warehouseMap = warehouseRepository.findAll().stream()
                .collect(Collectors.toMap(Warehouse::getId, w -> w, (a, b) -> a));

        LocalDate soonThreshold = LocalDate.now().plusDays(30);

        return allInventory.stream()
                .filter(inv -> {
                    if (!productMap.containsKey(inv.getProductId()) || productMap.get(inv.getProductId()).getDeletedAt() != null) {
                        return false;
                    }
                    Location loc = locationMap.get(inv.getLocationId());
                    if (loc == null) return false;
                    Long whId = loc.getWarehouseId() != null ? loc.getWarehouseId() : 1L;
                    return warehouseId == null || warehouseId.equals(whId);
                })
                .map(inv -> {
            Product prod = productMap.get(inv.getProductId());
            Location loc = locationMap.get(inv.getLocationId());
            ProductBatch batch = batchMap.get(inv.getBatchId());
            Category cat = (prod != null && prod.getCategoryId() != null) ? categoryMap.get(prod.getCategoryId()) : null;

            LocalDate today = LocalDate.now();
            boolean isExpiringSoon = false;
            boolean isExpired = false;
            String expiryStatus = "NO_EXPIRY";
            Long daysRemaining = null;
            LocalDate expDate = null;
            LocalDate mfgDate = null;
            String batchNum = "BATCH-" + inv.getBatchId();

            boolean isQuarantined = (batch != null && "QUARANTINE".equalsIgnoreCase(batch.getStatus()));
            boolean isLocationActive = (loc != null && Boolean.TRUE.equals(loc.getIsActive()));

            if (batch != null) {
                batchNum = batch.getBatchNumber();
                expDate = batch.getExpiryDate();
                mfgDate = batch.getManufactureDate();
                if (expDate != null) {
                    daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(today, expDate);
                    if (expDate.isBefore(today)) {
                        isExpired = true;
                        expiryStatus = "EXPIRED";
                    } else if (!expDate.isAfter(soonThreshold)) {
                        isExpiringSoon = true;
                        expiryStatus = "EXPIRING_SOON";
                    } else {
                        expiryStatus = "VALID";
                    }
                }
            }

            int onHand = inv.getOnHandQty() != null ? inv.getOnHandQty() : 0;
            int reserved = inv.getReservedQty() != null ? inv.getReservedQty() : 0;
            int unavailable = 0;
            int available = 0;

            if (isExpired || isQuarantined || !isLocationActive) {
                // Khi lô quá hạn, bị cách ly hoặc kệ ngưng hoạt động:
                // Toàn bộ tồn vật lý bị phong tỏa -> Khả dụng (ATP) bắt buộc = 0
                // Số lượng giữ chỗ (nếu có tồn đọng) không được tính là cấp phát hợp lệ
                unavailable = onHand;
                reserved = 0;
                available = 0;
            } else {
                available = Math.max(0, onHand - reserved);
            }

            Long whId = loc != null && loc.getWarehouseId() != null ? loc.getWarehouseId() : 1L;
            Warehouse wh = warehouseMap.get(whId);
            String whName = wh != null ? wh.getName() : "Kho Tổng Tân Bình";

            return InventoryBalanceResponse.builder()
                    .id(inv.getId())
                    .productId(inv.getProductId())
                    .warehouseId(whId)
                    .warehouseName(whName)
                    .sku(prod != null ? prod.getSku() : "SKU-" + inv.getProductId())
                    .barcode(prod != null ? prod.getBarcode() : "")
                    .productName(prod != null ? prod.getName() : "Sản Phẩm #" + inv.getProductId())
                    .categoryName(cat != null ? cat.getName() : "Hàng tiêu dùng")
                    .unit(prod != null ? prod.getUnit() : "Cái")
                    .locationId(inv.getLocationId())
                    .locationBarcode(loc != null ? loc.getBinBarcode() : "LOC-" + inv.getLocationId())
                    .zoneCode(loc != null ? loc.getZoneCode() : "")
                    .aisle(loc != null ? loc.getAisle() : "")
                    .rack(loc != null ? loc.getRack() : "")
                    .shelf(loc != null ? loc.getShelf() : "")
                    .bin(loc != null ? loc.getBin() : "")
                    .batchId(inv.getBatchId())
                    .batchNumber(batchNum)
                    .manufactureDate(mfgDate)
                    .expiryDate(expDate)
                    .isExpiringSoon(isExpiringSoon)
                    .isExpired(isExpired)
                    .expiryStatus(expiryStatus)
                    .daysRemaining(daysRemaining)
                    .onHandQty(onHand)
                    .reservedQty(reserved)
                    .unavailableQty(unavailable)
                    .availableQty(available)
                    .lastUpdatedAt(inv.getLastUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLedgerResponse> getRecentLedgers(int limit) {
        return getTargetedLedgers(null, null, null, null, null, limit);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLedgerResponse> getTargetedLedgers(Long warehouseId, Long productId, Long locationId, Long batchId, String transactionType, int limit) {
        List<StockLedger> ledgers;
        if (productId != null || locationId != null || batchId != null || transactionType != null) {
            ledgers = stockLedgerRepository.findTargetedLedgers(productId, locationId, batchId, transactionType);
        } else {
            ledgers = stockLedgerRepository.findTop50ByOrderByCreatedAtDesc();
        }

        if (ledgers.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<Long, Location> locationMap = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(ProductBatch::getId, b -> b, (a, b) -> a));
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return ledgers.stream()
                .filter(l -> {
                    if (warehouseId == null) return true;
                    Location loc = locationMap.get(l.getLocationId());
                    return loc != null && warehouseId.equals(loc.getWarehouseId());
                })
                .limit(limit > 0 ? limit : 100)
                .map(l -> mapToLedgerResponse(l, productMap, locationMap, batchMap, userMap))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLedgerResponse> getLedgersByReferenceCode(String referenceCode) {
        List<StockLedger> ledgers = stockLedgerRepository.findByReferenceCodeOrderByCreatedAtDesc(referenceCode);
        if (ledgers.isEmpty()) return Collections.emptyList();

        Map<Long, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<Long, Location> locationMap = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(ProductBatch::getId, b -> b, (a, b) -> a));
        Map<Long, User> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return ledgers.stream()
                .map(l -> mapToLedgerResponse(l, productMap, locationMap, batchMap, userMap))
                .collect(Collectors.toList());
    }

    private StockLedgerResponse mapToLedgerResponse(StockLedger l, Map<Long, Product> productMap,
                                                    Map<Long, Location> locationMap,
                                                    Map<Long, ProductBatch> batchMap, Map<Long, User> userMap) {
        Product prod = productMap.get(l.getProductId());
        Location loc = locationMap.get(l.getLocationId());
        ProductBatch batch = batchMap.get(l.getBatchId());
        User user = userMap.get(l.getPerformedBy());

        int before = (l.getBalanceAfter() != null ? l.getBalanceAfter() : 0) - (l.getQtyChange() != null ? l.getQtyChange() : 0);

        return StockLedgerResponse.builder()
                .warehouseId(loc != null ? loc.getWarehouseId() : null)
                .id(l.getId())
                .transactionType(l.getTransactionType())
                .referenceCode(l.getReferenceCode())
                .locationId(l.getLocationId())
                .locationBarcode(loc != null ? loc.getBinBarcode() : "LOC-" + l.getLocationId())
                .productId(l.getProductId())
                .productSku(prod != null ? prod.getSku() : "SKU-" + l.getProductId())
                .productName(prod != null ? prod.getName() : "Sản phẩm #" + l.getProductId())
                .batchId(l.getBatchId())
                .batchNumber(batch != null ? batch.getBatchNumber() : "BATCH-" + l.getBatchId())
                .expiryDate(batch != null ? batch.getExpiryDate() : null)
                .qtyChange(l.getQtyChange())
                .balanceBefore(before)
                .balanceAfter(l.getBalanceAfter())
                .performedBy(l.getPerformedBy())
                .performedByName(user != null ? user.getFullName() : "Nhân viên kho #" + l.getPerformedBy())
                .notes(l.getNotes())
                .createdAt(l.getCreatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Inventory> getInventory(Long productId, Long locationId, Long batchId) {
        return inventoryRepository.findByProductIdAndLocationIdAndBatchId(productId, locationId, batchId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SafetyStockAlertResponse> getSafetyStockAlerts(Long warehouseId) {
        List<Product> products = productRepository.findAll();
        List<Inventory> allInventory = inventoryRepository.findAll();
        Map<Long, Location> locationMap = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));
        Map<Long, Warehouse> warehouseMap = warehouseRepository.findAll().stream()
                .collect(Collectors.toMap(Warehouse::getId, w -> w, (a, b) -> a));

        Map<Long, Integer> onHandMap = new HashMap<>();
        Map<Long, Integer> reservedMap = new HashMap<>();
        Map<Long, Integer> availableMap = new HashMap<>();

        for (Inventory inv : allInventory) {
            Location loc = locationMap.get(inv.getLocationId());
            if (loc == null) continue;
            Long whId = loc.getWarehouseId() != null ? loc.getWarehouseId() : 1L;
            if (warehouseId != null && !warehouseId.equals(whId)) {
                continue;
            }

            onHandMap.merge(inv.getProductId(), inv.getOnHandQty(), Integer::sum);
            reservedMap.merge(inv.getProductId(), inv.getReservedQty(), Integer::sum);
            availableMap.merge(inv.getProductId(), inv.getAvailableQty(), Integer::sum);
        }

        List<SafetyStockAlertResponse> alerts = new ArrayList<>();
        String currentWhName = warehouseId != null && warehouseMap.containsKey(warehouseId)
                ? warehouseMap.get(warehouseId).getName()
                : "Toàn bộ chi nhánh kho";

        for (Product product : products) {
            if (product.getDeletedAt() != null) continue;

            int onHand = onHandMap.getOrDefault(product.getId(), 0);
            int reserved = reservedMap.getOrDefault(product.getId(), 0);
            int available = availableMap.getOrDefault(product.getId(), 0);
            int safety = product.getSafetyStock() != null ? product.getSafetyStock() : 10;
            int reorder = product.getReorderPoint() != null ? product.getReorderPoint() : 20;

            String alertLevel;
            String message;
            int suggestedOrderQty;

            if (available <= 0) {
                alertLevel = "OUT_OF_STOCK";
                suggestedOrderQty = Math.max(reorder * 2, 50);
                message = String.format("Mặt hàng %s (%s) đã hoàn toàn hết tồn khả dụng tại %s! Cần lập đơn đặt hàng khẩn cấp.",
                        product.getName(), product.getSku(), currentWhName);
            } else if (available <= safety) {
                alertLevel = "CRITICAL";
                suggestedOrderQty = (reorder * 2) - available;
                message = String.format("Tồn kho khả dụng (%d %s) tụt xuống dưới mức an toàn (%d %s)! Nguy cơ thiếu hụt đơn xuất.",
                        available, product.getUnit(), safety, product.getUnit());
            } else if (available <= reorder) {
                alertLevel = "WARNING";
                suggestedOrderQty = (reorder * 2) - available;
                message = String.format("Tồn kho (%d %s) chạm ngưỡng điểm tái đặt hàng ROP (%d). Nên lên kế hoạch nhập hàng.",
                        available, product.getUnit(), reorder);
            } else {
                continue;
            }

            Category cat = product.getCategoryId() != null ? categoryMap.get(product.getCategoryId()) : null;

            alerts.add(SafetyStockAlertResponse.builder()
                    .warehouseId(warehouseId)
                    .warehouseName(currentWhName)
                    .productId(product.getId())
                    .sku(product.getSku())
                    .barcode(product.getBarcode())
                    .productName(product.getName())
                    .categoryName(cat != null ? cat.getName() : "Hàng tiêu dùng")
                    .unit(product.getUnit())
                    .currentOnHand(onHand)
                    .currentReserved(reserved)
                    .currentAvailable(available)
                    .safetyStock(safety)
                    .reorderPoint(reorder)
                    .suggestedReorderQty(suggestedOrderQty)
                    .alertLevel(alertLevel)
                    .message(message)
                    .build());
        }

        alerts.sort((a, b) -> {
            int scoreA = "OUT_OF_STOCK".equals(a.getAlertLevel()) ? 3 : "CRITICAL".equals(a.getAlertLevel()) ? 2 : 1;
            int scoreB = "OUT_OF_STOCK".equals(b.getAlertLevel()) ? 3 : "CRITICAL".equals(b.getAlertLevel()) ? 2 : 1;
            return Integer.compare(scoreB, scoreA);
        });

        return alerts;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpiringBatchAlertResponse> getExpiringBatchAlerts(Long warehouseId) {
        List<Inventory> allInventory = inventoryRepository.findAll();
        if (allInventory.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<Long, Location> locationMap = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(ProductBatch::getId, b -> b, (a, b) -> a));
        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));
        Map<Long, Warehouse> warehouseMap = warehouseRepository.findAll().stream()
                .collect(Collectors.toMap(Warehouse::getId, w -> w, (a, b) -> a));

        LocalDate today = LocalDate.now();
        List<ExpiringBatchAlertResponse> alerts = new ArrayList<>();

        for (Inventory inv : allInventory) {
            if (inv.getOnHandQty() == null || inv.getOnHandQty() <= 0) {
                continue;
            }

            Location loc = locationMap.get(inv.getLocationId());
            if (loc == null) continue;
            Long whId = loc.getWarehouseId() != null ? loc.getWarehouseId() : 1L;
            if (warehouseId != null && !warehouseId.equals(whId)) {
                continue;
            }

            ProductBatch batch = batchMap.get(inv.getBatchId());
            if (batch == null || batch.getExpiryDate() == null) {
                continue;
            }

            long daysRemaining = java.time.temporal.ChronoUnit.DAYS.between(today, batch.getExpiryDate());
            // Cảnh báo nếu đã quá hạn, cách ly, hoặc còn dưới 45 ngày
            boolean isQuarantined = "QUARANTINE".equals(batch.getStatus());
            if (daysRemaining > 45 && !isQuarantined) {
                continue;
            }

            Product prod = productMap.get(inv.getProductId());
            if (prod == null || prod.getDeletedAt() != null) {
                continue;
            }
            Category cat = prod.getCategoryId() != null ? categoryMap.get(prod.getCategoryId()) : null;
            Warehouse wh = warehouseMap.get(whId);

            String alertLevel;
            String message;

            if (isQuarantined) {
                alertLevel = "EXPIRED";
                message = String.format("Lô %s của mặt hàng %s đang bị CÁCH LY! Nghiêm cấm cấp phát xuất kho.",
                        batch.getBatchNumber(), prod.getName());
            } else if (daysRemaining < 0) {
                alertLevel = "EXPIRED";
                message = String.format("Lô %s của mặt hàng %s đã QUÁ HẠN %d ngày! Cần lập tức cách ly ô kệ %s.",
                        batch.getBatchNumber(), prod.getName(), Math.abs(daysRemaining), loc.getBinBarcode());
            } else if (daysRemaining == 0) {
                alertLevel = "CRITICAL";
                message = String.format("Lô %s hết hạn vào HÔM NAY! Cần xử lý xuất khẩn cấp hoặc chuyển trạng thái kiểm định.",
                        batch.getBatchNumber());
            } else if (daysRemaining <= 15) {
                alertLevel = "CRITICAL";
                message = String.format("Lô %s chỉ còn %d ngày sử dụng! Ưu tiên xuất FEFO khẩn cấp tại ô %s.",
                        batch.getBatchNumber(), daysRemaining, loc.getBinBarcode());
            } else {
                alertLevel = "WARNING";
                message = String.format("Lô %s còn %d ngày sử dụng. Cần giám sát và ưu tiên phân bổ đơn xuất.",
                        batch.getBatchNumber(), daysRemaining);
            }

            alerts.add(ExpiringBatchAlertResponse.builder()
                    .warehouseId(whId)
                    .warehouseName(wh != null ? wh.getName() : "Kho Tân Bình")
                    .productId(prod.getId())
                    .sku(prod.getSku())
                    .productName(prod.getName())
                    .categoryName(cat != null ? cat.getName() : "Hàng tiêu dùng")
                    .unit(prod.getUnit())
                    .batchId(batch.getId())
                    .batchNumber(batch.getBatchNumber())
                    .batchStatus(batch.getStatus())
                    .manufactureDate(batch.getManufactureDate())
                    .expiryDate(batch.getExpiryDate())
                    .daysRemaining(daysRemaining)
                    .locationId(inv.getLocationId())
                    .locationBarcode(loc.getBinBarcode())
                    .onHandQty(inv.getOnHandQty())
                    .reservedQty(inv.getReservedQty())
                    .availableQty(inv.getAvailableQty())
                    .alertLevel(alertLevel)
                    .message(message)
                    .build());
        }

        alerts.sort(Comparator.comparingLong(ExpiringBatchAlertResponse::getDaysRemaining));
        return alerts;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SlowMovingStockAlertResponse> getSlowMovingStockAlerts(Long warehouseId) {
        List<Inventory> allInventory = inventoryRepository.findAll();
        if (allInventory.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<Long, Location> locationMap = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(ProductBatch::getId, b -> b, (a, b) -> a));
        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));
        Map<Long, Warehouse> warehouseMap = warehouseRepository.findAll().stream()
                .collect(Collectors.toMap(Warehouse::getId, w -> w, (a, b) -> a));

        // Lấy thời điểm giao dịch xuất hàng (OUTBOUND) hoặc nhập mới (INBOUND) gần nhất
        // QUAN TRỌNG: Loại trừ giao dịch điều chuyển kệ (TRANSFER) để không làm mất cảnh báo của lô 90 ngày!
        List<StockLedger> allLedgers = stockLedgerRepository.findAll();
        Map<String, Instant> lastMovementMap = new HashMap<>();
        for (StockLedger ledger : allLedgers) {
            if ("OUTBOUND".equals(ledger.getTransactionType()) || "INBOUND".equals(ledger.getTransactionType())) {
                String key = ledger.getProductId() + "_" + ledger.getBatchId();
                Instant current = lastMovementMap.get(key);
                if (current == null || (ledger.getCreatedAt() != null && ledger.getCreatedAt().isAfter(current))) {
                    lastMovementMap.put(key, ledger.getCreatedAt());
                }
            }
        }

        LocalDate today = LocalDate.now();
        Instant now = Instant.now();
        List<SlowMovingStockAlertResponse> alerts = new ArrayList<>();

        for (Inventory inv : allInventory) {
            if (inv.getOnHandQty() == null || inv.getOnHandQty() <= 0) {
                continue;
            }

            Location loc = locationMap.get(inv.getLocationId());
            if (loc == null) continue;
            Long whId = loc.getWarehouseId() != null ? loc.getWarehouseId() : 1L;
            if (warehouseId != null && !warehouseId.equals(whId)) {
                continue;
            }

            Product prod = productMap.get(inv.getProductId());
            if (prod == null || prod.getDeletedAt() != null) {
                continue;
            }

            ProductBatch batch = batchMap.get(inv.getBatchId());
            String key = inv.getProductId() + "_" + inv.getBatchId();
            Instant lastMove = lastMovementMap.get(key);
            if (lastMove == null && batch != null && batch.getManufactureDate() != null) {
                lastMove = batch.getManufactureDate().atStartOfDay(java.time.ZoneId.systemDefault()).toInstant();
            } else if (lastMove == null && batch != null && batch.getCreatedAt() != null) {
                lastMove = batch.getCreatedAt();
            } else if (lastMove == null && inv.getLastUpdatedAt() != null) {
                lastMove = inv.getLastUpdatedAt();
            } else if (lastMove == null) {
                lastMove = now.minus(java.time.Duration.ofDays(30));
            }

            long daysInStock = java.time.temporal.ChronoUnit.DAYS.between(
                    lastMove.atZone(java.time.ZoneId.systemDefault()).toLocalDate(), today);

            // Xét ngưỡng chậm luân chuyển >= 45 ngày
            if (daysInStock < 45) {
                continue;
            }

            Category cat = prod.getCategoryId() != null ? categoryMap.get(prod.getCategoryId()) : null;
            Warehouse wh = warehouseMap.get(whId);

            BigDecimal purchasePrice = prod.getPurchasePrice() != null ? prod.getPurchasePrice() : BigDecimal.ZERO;
            BigDecimal holdingValue = purchasePrice.multiply(BigDecimal.valueOf(inv.getOnHandQty()));

            String alertLevel;
            String message;
            String suggestedAction;

            if (daysInStock >= 90) {
                alertLevel = "DEAD_STOCK";
                message = String.format("Mặt hàng %s (Lô %s) tồn đọng %d ngày không phát sinh xuất bán tại ô %s!",
                        prod.getName(), batch != null ? batch.getBatchNumber() : "N/A", daysInStock, loc.getBinBarcode());
                suggestedAction = "Lập tức lập chương trình thanh lý / xả kho chiết khấu hoặc điều chuyển sang đại lý cấp 2";
            } else {
                alertLevel = "SLOW_MOVING";
                message = String.format("Mặt hàng %s (Lô %s) chậm luân chuyển (%d ngày lưu kho). Tốc độ giải phóng hàng thấp.",
                        prod.getName(), batch != null ? batch.getBatchNumber() : "N/A", daysInStock);
                suggestedAction = "Ưu tiên chào hàng kênh bán buôn, đóng gói combo khuyến mãi hoặc kích cầu bán lẻ";
            }

            alerts.add(SlowMovingStockAlertResponse.builder()
                    .warehouseId(whId)
                    .warehouseName(wh != null ? wh.getName() : "Kho Tân Bình")
                    .productId(prod.getId())
                    .sku(prod.getSku())
                    .productName(prod.getName())
                    .categoryName(cat != null ? cat.getName() : "Hàng tiêu dùng")
                    .unit(prod.getUnit())
                    .batchId(batch != null ? batch.getId() : inv.getBatchId())
                    .batchNumber(batch != null ? batch.getBatchNumber() : "BATCH-" + inv.getBatchId())
                    .locationId(inv.getLocationId())
                    .locationBarcode(loc.getBinBarcode())
                    .onHandQty(inv.getOnHandQty())
                    .availableQty(inv.getAvailableQty())
                    .purchasePrice(purchasePrice)
                    .holdingValue(holdingValue)
                    .daysInStock(daysInStock)
                    .lastMovementDate(lastMove)
                    .alertLevel(alertLevel)
                    .message(message)
                    .suggestedAction(suggestedAction)
                    .build());
        }

        alerts.sort((a, b) -> Long.compare(b.getDaysInStock(), a.getDaysInStock()));
        return alerts;
    }

    @Override
    @Transactional
    public void quarantineBatch(Long batchId, String reason) {
        ProductBatch batch = productBatchRepository.findById(batchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy lô hàng: " + batchId));
        batch.setStatus("QUARANTINE");
        batch.setUpdatedAt(Instant.now());
        productBatchRepository.save(batch);
    }
}
