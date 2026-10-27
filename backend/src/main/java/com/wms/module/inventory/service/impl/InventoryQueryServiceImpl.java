package com.wms.module.inventory.service.impl;

import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.StockLedger;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.StockLedgerRepository;
import com.wms.module.inventory.service.InventoryQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryQueryServiceImpl implements InventoryQueryService {

    private final InventoryRepository inventoryRepository;
    private final StockLedgerRepository stockLedgerRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Inventory> getAllBalances() {
        return inventoryRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StockLedger> getRecentLedgers(int limit) {
        return stockLedgerRepository.findTop50ByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.Optional<Inventory> getInventory(Long productId, Long locationId, Long batchId) {
        return inventoryRepository.findByProductIdAndLocationIdAndBatchId(productId, locationId, batchId);
    }
}
