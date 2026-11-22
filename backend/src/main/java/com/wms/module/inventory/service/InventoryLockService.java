package com.wms.module.inventory.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryLockService {

    private final InventoryRepository inventoryRepository;
    private final ProductBatchRepository productBatchRepository;

    /**
     * Giữ hàng an toàn chống Race Condition với Transaction ACID & Pessimistic Lock
     */
    @Transactional
    public void reserveStock(Long productId, Long locationId, Long batchId, int requestedQty) {
        log.info("Bat dau giu hang: Product={}, Loc={}, Batch={}, Qty={}", productId, locationId, batchId, requestedQty);

        // 1. Kiểm tra tính hợp lệ của lô hàng (Hạn sử dụng & Trạng thái cách ly)
        if (batchId != null) {
            ProductBatch batch = productBatchRepository.findById(batchId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy thông tin lô hàng: " + batchId));

            if ("QUARANTINE".equalsIgnoreCase(batch.getStatus())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        String.format("Lô hàng %s đang bị CÁCH LY, nghiêm cấm giữ hàng hoặc cấp phát xuất kho!", batch.getBatchNumber()));
            }

            if (batch.getExpiryDate() != null && batch.getExpiryDate().isBefore(LocalDate.now())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        String.format("Lô hàng %s đã HẾT HẠN sử dụng (%s), không thể giữ hàng xuất bán!",
                                batch.getBatchNumber(), batch.getExpiryDate()));
            }
        }

        // 2. Kích hoạt SELECT FOR UPDATE: khóa dòng dữ liệu trong DB
        Inventory inventory = inventoryRepository.findByProductLocationAndBatchForUpdate(productId, locationId, batchId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy mặt hàng tại vị trí này"));

        // 3. Kiểm tra tồn kho khả dụng
        if (inventory.getAvailableQty() < requestedQty) {
            log.warn("Khong du ton kho kha dung: Available={}, Requested={}", inventory.getAvailableQty(), requestedQty);
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, 
                    String.format("Không đủ hàng khả dụng! Khả dụng: %d, Yêu cầu: %d", inventory.getAvailableQty(), requestedQty));
        }

        // 4. Tăng số lượng đã giữ (reserved_qty)
        inventory.setReservedQty(inventory.getReservedQty() + requestedQty);
        inventoryRepository.save(inventory);

        log.info("Giu hang thanh cong! Reserved moi={}", inventory.getReservedQty());
    }

    /**
     * Giải phóng số lượng tồn kho đã giữ (Reservation Release) khi hủy đơn hoặc điều chỉnh phân bổ
     */
    @Transactional
    public void releaseStock(Long productId, Long locationId, Long batchId, int qtyToRelease) {
        log.info("Bat dau giai phong hang giu: Product={}, Loc={}, Batch={}, Qty={}", productId, locationId, batchId, qtyToRelease);

        Inventory inventory = null;
        if (locationId != null) {
            inventory = inventoryRepository.findByProductLocationAndBatchForUpdate(productId, locationId, batchId)
                    .orElse(null);
        }

        // Nếu không tìm thấy tại vị trí chỉ định, tìm kiếm các bản ghi tồn kho khác của sản phẩm và lô này
        if (inventory == null && batchId != null) {
            List<Inventory> batchInvs = inventoryRepository.findByProductIdAndBatchId(productId, batchId);
            if (batchInvs != null && !batchInvs.isEmpty()) {
                inventory = batchInvs.stream()
                        .filter(i -> i.getReservedQty() != null && i.getReservedQty() > 0)
                        .findFirst()
                        .orElse(batchInvs.get(0));
            }
        }

        // Nếu vẫn không tìm thấy, tìm theo productId
        if (inventory == null && productId != null) {
            List<Inventory> prodInvs = inventoryRepository.findByProductId(productId);
            if (prodInvs != null && !prodInvs.isEmpty()) {
                inventory = prodInvs.stream()
                        .filter(i -> i.getReservedQty() != null && i.getReservedQty() > 0)
                        .findFirst()
                        .orElse(null);
            }
        }

        if (inventory != null) {
            int currentReserved = inventory.getReservedQty() != null ? inventory.getReservedQty() : 0;
            int newReserved = Math.max(0, currentReserved - qtyToRelease);
            inventory.setReservedQty(newReserved);
            inventoryRepository.save(inventory);
            log.info("Giai phong hang thanh cong! LocationId={}, Reserved moi={}", inventory.getLocationId(), inventory.getReservedQty());
        } else {
            log.warn("Khong tim thay ban ghi ton kho de giai phong giu hang: Product={}, Loc={}, Batch={}. Bo qua de hoan tat huy don.", productId, locationId, batchId);
        }
    }
}
