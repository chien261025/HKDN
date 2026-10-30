package com.wms.module.inventory.service.impl;

import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.inventory.dto.response.InventoryBalanceResponse;
import com.wms.module.inventory.dto.response.SafetyStockAlertResponse;
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
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<InventoryBalanceResponse> getAllBalances() {
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

        LocalDate soonThreshold = LocalDate.now().plusDays(30);

        return allInventory.stream().map(inv -> {
            Product prod = productMap.get(inv.getProductId());
            Location loc = locationMap.get(inv.getLocationId());
            ProductBatch batch = batchMap.get(inv.getBatchId());
            Category cat = (prod != null && prod.getCategoryId() != null) ? categoryMap.get(prod.getCategoryId()) : null;

            boolean isExpiringSoon = false;
            LocalDate expDate = null;
            LocalDate mfgDate = null;
            String batchNum = "BATCH-" + inv.getBatchId();

            if (batch != null) {
                batchNum = batch.getBatchNumber();
                expDate = batch.getExpiryDate();
                mfgDate = batch.getManufactureDate();
                if (expDate != null && expDate.isBefore(soonThreshold)) {
                    isExpiringSoon = true;
                }
            }

            return InventoryBalanceResponse.builder()
                    .id(inv.getId())
                    .productId(inv.getProductId())
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
                    .onHandQty(inv.getOnHandQty())
                    .reservedQty(inv.getReservedQty())
                    .availableQty(inv.getAvailableQty())
                    .lastUpdatedAt(inv.getLastUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLedgerResponse> getRecentLedgers(int limit) {
        List<StockLedger> ledgers = stockLedgerRepository.findTop50ByOrderByCreatedAtDesc();
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

        return ledgers.stream().map(l -> {
            Product prod = productMap.get(l.getProductId());
            Location loc = locationMap.get(l.getLocationId());
            ProductBatch batch = batchMap.get(l.getBatchId());
            User user = userMap.get(l.getPerformedBy());

            int before = (l.getBalanceAfter() != null ? l.getBalanceAfter() : 0) - (l.getQtyChange() != null ? l.getQtyChange() : 0);

            return StockLedgerResponse.builder()
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
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Inventory> getInventory(Long productId, Long locationId, Long batchId) {
        return inventoryRepository.findByProductIdAndLocationIdAndBatchId(productId, locationId, batchId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SafetyStockAlertResponse> getSafetyStockAlerts() {
        List<Product> products = productRepository.findAll();
        List<Inventory> allInventory = inventoryRepository.findAll();
        Map<Long, Category> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, c -> c, (a, b) -> a));

        Map<Long, Integer> onHandMap = new HashMap<>();
        Map<Long, Integer> reservedMap = new HashMap<>();
        Map<Long, Integer> availableMap = new HashMap<>();

        for (Inventory inv : allInventory) {
            onHandMap.merge(inv.getProductId(), inv.getOnHandQty(), Integer::sum);
            reservedMap.merge(inv.getProductId(), inv.getReservedQty(), Integer::sum);
            availableMap.merge(inv.getProductId(), inv.getAvailableQty(), Integer::sum);
        }

        List<SafetyStockAlertResponse> alerts = new ArrayList<>();

        for (Product product : products) {
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
                message = String.format("Mặt hàng %s (%s) đã hoàn toàn hết tồn kho khả dụng! Cần lập đơn đặt hàng khẩn cấp.", product.getName(), product.getSku());
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
                continue; // Tồn an toàn bình thường, không đưa vào danh sách cảnh báo
            }

            Category cat = product.getCategoryId() != null ? categoryMap.get(product.getCategoryId()) : null;

            alerts.add(SafetyStockAlertResponse.builder()
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
}
