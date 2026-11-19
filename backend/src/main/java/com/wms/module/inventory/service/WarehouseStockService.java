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

/** Current closing stock shared by catalogue, inventory, ledger and outbound selection. */
@Service
@RequiredArgsConstructor
public class WarehouseStockService {
    private final ProductRepository productRepository;
    private final InventoryRepository inventoryRepository;
    private final LocationRepository locationRepository;
    private final ProductBatchRepository productBatchRepository;

    @Transactional(readOnly = true)
    public List<OutboundStockResponse> getClosingBalances(boolean includeUnavailable) {
        Map<Long, Location> locations = locationRepository.findAll().stream()
                .collect(Collectors.toMap(Location::getId, l -> l));
        List<Inventory> stocks = inventoryRepository.findAll();
        List<OutboundStockResponse> result = new ArrayList<>();
        for (Product product : productRepository.findAll()) {
            if (product.getDeletedAt() != null) continue;
            Set<Long> activeBatches = productBatchRepository
                    .findActiveBatchesOrderByExpiryAsc(product.getId(), LocalDate.now()).stream()
                    .map(ProductBatch::getId).collect(Collectors.toSet());
            Map<Long, int[]> totals = new TreeMap<>();
            for (Inventory inv : stocks) {
                Location location = locations.get(inv.getLocationId());
                if (!product.getId().equals(inv.getProductId()) || location == null) continue;
                int[] qty = totals.computeIfAbsent(location.getWarehouseId(), key -> new int[2]);
                qty[0] += inv.getOnHandQty();
                if (Boolean.TRUE.equals(location.getIsActive()) && activeBatches.contains(inv.getBatchId())) {
                    qty[1] += Math.max(0, inv.getAvailableQty());
                }
            }
            totals.forEach((warehouseId, qty) -> {
                if (includeUnavailable || qty[1] > 0) result.add(OutboundStockResponse.builder()
                        .productId(product.getId()).warehouseId(warehouseId).sku(product.getSku())
                        .name(product.getName()).unit(product.getUnit())
                        .onHandQty(qty[0]).availableQty(qty[1]).build());
            });
        }
        return result;
    }

}
