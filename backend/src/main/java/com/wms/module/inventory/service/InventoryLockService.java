package com.wms.module.inventory.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryLockService {

    private final InventoryRepository inventoryRepository;

    /**
     * Giữ hàng an toàn chống Race Condition với Transaction ACID & Pessimistic Lock
     */
    @Transactional
    public void reserveStock(Long productId, Long locationId, Long batchId, int requestedQty) {
        log.info("Bat dau giu hang: Product={}, Loc={}, Batch={}, Qty={}", productId, locationId, batchId, requestedQty);

        // 1. Kích hoạt SELECT FOR UPDATE: khóa dòng dữ liệu trong DB
        Inventory inventory = inventoryRepository.findByProductLocationAndBatchForUpdate(productId, locationId, batchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy mặt hàng tại vị trí này"));

        // 2. Kiểm tra tồn kho khả dụng
        if (inventory.getAvailableQty() < requestedQty) {
            log.warn("Khong du ton kho kha dung: Available={}, Requested={}", inventory.getAvailableQty(), requestedQty);
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, 
                    String.format("Không đủ hàng! Khả dụng: %d, Yêu cầu: %d", inventory.getAvailableQty(), requestedQty));
        }

        // 3. Tăng số lượng đã giữ (reserved_qty)
        inventory.setReservedQty(inventory.getReservedQty() + requestedQty);
        inventoryRepository.save(inventory);

        log.info("Giu hang thanh cong! Reserved moi={}", inventory.getReservedQty());
    }
}
