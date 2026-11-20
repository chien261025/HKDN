package com.wms.module.inventory.service;

import com.wms.module.inventory.dto.response.ExpiringBatchAlertResponse;
import com.wms.module.inventory.dto.response.InventoryBalanceResponse;
import com.wms.module.inventory.dto.response.SafetyStockAlertResponse;
import com.wms.module.inventory.dto.response.SlowMovingStockAlertResponse;
import com.wms.module.inventory.dto.response.StockLedgerResponse;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.order.dto.response.OutboundStockResponse;

import java.util.List;
import java.util.Optional;

public interface InventoryQueryService {
    List<OutboundStockResponse> getClosingBalances(Long warehouseId);
    default List<OutboundStockResponse> getClosingBalances() { return getClosingBalances(null); }

    List<InventoryBalanceResponse> getAllBalances(Long warehouseId);
    default List<InventoryBalanceResponse> getAllBalances() { return getAllBalances(null); }

    List<StockLedgerResponse> getRecentLedgers(int limit);
    List<StockLedgerResponse> getTargetedLedgers(Long warehouseId, Long productId, Long locationId, Long batchId, String transactionType, int limit);
    List<StockLedgerResponse> getLedgersByReferenceCode(String referenceCode);

    Optional<Inventory> getInventory(Long productId, Long locationId, Long batchId);

    List<SafetyStockAlertResponse> getSafetyStockAlerts(Long warehouseId);
    default List<SafetyStockAlertResponse> getSafetyStockAlerts() { return getSafetyStockAlerts(null); }

    List<ExpiringBatchAlertResponse> getExpiringBatchAlerts(Long warehouseId);
    default List<ExpiringBatchAlertResponse> getExpiringBatchAlerts() { return getExpiringBatchAlerts(null); }

    List<SlowMovingStockAlertResponse> getSlowMovingStockAlerts(Long warehouseId);
    default List<SlowMovingStockAlertResponse> getSlowMovingStockAlerts() { return getSlowMovingStockAlerts(null); }

    void quarantineBatch(Long batchId, String reason);
}
