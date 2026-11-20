package com.wms.module.inventory.service;

import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.order.dto.response.OutboundStockResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Quản lý số dư tồn kho phục vụ Master Data, Inventory Balances và Điều phối Outbound FEFO.
 */
@Service
@RequiredArgsConstructor
public class WarehouseStockService {
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final LocationRepository locationRepository;
    private final ProductBatchRepository productBatchRepository;

    @Transactional(readOnly = true)
    public List<OutboundStockResponse> getClosingBalances(boolean includeUnavailable) {
        return getClosingBalances(null, includeUnavailable);
    }

    @Transactional(readOnly = true)
    public List<OutboundStockResponse> getClosingBalances(Long filterWarehouseId, boolean includeUnavailable) {
        Map<Long, Location> locations = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l));
        List<Inventory> stocks = inventoryRepository.findAll();
        List<OutboundStockResponse> result = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (Product product : productRepository.findAll()) {
            if (product.getDeletedAt() != null) continue;

            // Lô hợp lệ: trạng thái ACTIVE và chưa quá hạn (expiryDate >= today hoặc expiryDate null)
            Set<Long> activeBatches = productBatchRepository
                    .findActiveBatchesOrderByExpiryAsc(product.getId(), today).stream()
                    .map(ProductBatch::getId).collect(Collectors.toSet());

            // totals: Map<WarehouseId, int[4]>
            // qty[0] = onHandQty (Tồn vật lý)
            // qty[1] = reservedQty (Đã giữ trước cho đơn xuất)
            // qty[2] = unavailableQty (Hạn dùng / Cách ly / Kệ khóa)
            // qty[3] = availableQty (Khả dụng xuất ngay)
            Map<Long, int[]> totals = new TreeMap<>();

            for (Inventory inv : stocks) {
                if (!product.getId().equals(inv.getProductId())) continue;

                Location location = locations.get(inv.getLocationId());
                if (location == null) continue;

                Long whId = location.getWarehouseId() != null ? location.getWarehouseId() : 1L;
                if (filterWarehouseId != null && !filterWarehouseId.equals(whId)) {
                    continue;
                }

                int[] qty = totals.computeIfAbsent(whId, key -> new int[4]);

                int onHand = inv.getOnHandQty() != null ? inv.getOnHandQty() : 0;
                int reserved = inv.getReservedQty() != null ? inv.getReservedQty() : 0;
                boolean isLocationActive = Boolean.TRUE.equals(location.getIsActive());
                boolean isBatchEligible = activeBatches.contains(inv.getBatchId());

                qty[0] += onHand;

                if (isLocationActive && isBatchEligible) {
                    qty[1] += reserved;
                    qty[3] += Math.max(0, onHand - reserved);
                } else {
                    // Lô quá hạn, cách ly hoặc kệ bị ngưng hoạt động -> Không được phép cấp phát
                    qty[2] += onHand;
                }
            }

            totals.forEach((warehouseId, qty) -> {
                if (includeUnavailable || qty[3] > 0) {
                    result.add(OutboundStockResponse.builder()
                            .productId(product.getId())
                            .warehouseId(warehouseId)
                            .sku(product.getSku())
                            .name(product.getName())
                            .unit(product.getUnit())
                            .onHandQty(qty[0])
                            .reservedQty(qty[1])
                            .unavailableQty(qty[2])
                            .availableQty(qty[3])
                            .build());
                }
            });
        }
        return result;
    }
}
