package com.wms.module.inventory.service;

import com.wms.module.inventory.dto.response.InventoryBalanceResponse;
import com.wms.module.inventory.dto.response.SafetyStockAlertResponse;
import com.wms.module.inventory.dto.response.StockLedgerResponse;
import com.wms.module.inventory.entity.Inventory;

import java.util.List;
import java.util.Optional;

public interface InventoryQueryService {
    List<InventoryBalanceResponse> getAllBalances();
    List<StockLedgerResponse> getRecentLedgers(int limit);
    Optional<Inventory> getInventory(Long productId, Long locationId, Long batchId);
    List<SafetyStockAlertResponse> getSafetyStockAlerts();
}
