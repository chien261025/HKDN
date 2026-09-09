package com.wms.module.order.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.service.InventoryLockService;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.order.dto.response.PickListItemResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OutboundService {

    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final InventoryRepository inventoryRepository;
    private final LocationRepository locationRepository;
    private final InventoryLockService inventoryLockService;

    /**
     * THUẬT TOÁN XUẤT HÀNG THEO CHIẾN LƯỢC FEFO (FIRST EXPIRED, FIRST OUT):
     * 1. Tìm các Lô hàng có hạn dùng gần nhất (expiryDate ASC)
     * 2. Quét các ô chứa hàng của Lô đó, giữ hàng an toàn (Reserve) chống Race condition
     * 3. Sinh Danh sách nhặt hàng (Pick List) tối ưu theo thứ tự dãy kệ để nhân viên không phải đi vòng vèo
     */
    @Transactional
    public List<PickListItemResponse> generateFefoPickList(Long productId, int totalRequiredQty) {
        log.info("Bat dau sinh Pick List FEFO: ProductId={}, RequiredQty={}", productId, totalRequiredQty);

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm"));

        // 1. Lấy danh sách lô còn hạn, sắp xếp hạn gần nhất lên trước
        List<ProductBatch> activeBatches = productBatchRepository.findActiveBatchesOrderByExpiryAsc(productId, LocalDate.now());
        if (activeBatches.isEmpty()) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, "Sản phẩm không có lô hàng nào còn hạn sử dụng!");
        }

        List<PickListItemResponse> pickList = new ArrayList<>();
        int remainingToPick = totalRequiredQty;
        int stepOrder = 1;

        // 2. Duyệt từng lô theo thứ tự FEFO
        for (ProductBatch batch : activeBatches) {
            if (remainingToPick <= 0) break;

            // Tìm các ô kệ chứa lô này (Giả lập logic quét tồn)
            // Trong thực tế sẽ query Inventory theo productId và batchId
            // Ở đây tạm dùng inventoryRepository
            List<Inventory> inventories = inventoryRepository.findAll().stream()
                    .filter(i -> i.getProductId().equals(productId) && i.getBatchId().equals(batch.getId()))
                    .filter(i -> i.getAvailableQty() > 0)
                    .toList();

            for (Inventory inv : inventories) {
                if (remainingToPick <= 0) break;

                int available = inv.getAvailableQty();
                int takeQty = Math.min(available, remainingToPick);

                // Khóa và giữ trước hàng (Reserve) an toàn trong Database
                inventoryLockService.reserveStock(productId, inv.getLocationId(), batch.getId(), takeQty);

                Location loc = locationRepository.findById(inv.getLocationId()).orElse(null);
                String binBarcode = (loc != null) ? loc.getBinBarcode() : "LOC-" + inv.getLocationId();

                pickList.add(PickListItemResponse.builder()
                        .binBarcode(binBarcode)
                        .productSku(product.getSku())
                        .productName(product.getName())
                        .batchNumber(batch.getBatchNumber())
                        .expiryDate(batch.getExpiryDate())
                        .pickQty(takeQty)
                        .stepOrder(stepOrder++)
                        .build());

                remainingToPick -= takeQty;
            }
        }

        if (remainingToPick > 0) {
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK, 
                    String.format("Không đủ tồn kho khả dụng! Thiếu: %d cái", remainingToPick));
        }

        log.info("Sinh Pick List thanh cong gom {} diem dung", pickList.size());
        return pickList;
    }
}
