package com.wms.module.inventory.service;

import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.StockLedger;

import java.util.List;
import java.util.Optional;

public interface InventoryQueryService {
    List<Inventory> getAllBalances();
    List<StockLedger> getRecentLedgers(int limit);
    Optional<Inventory> getInventory(Long productId, Long locationId, Long batchId);
}
