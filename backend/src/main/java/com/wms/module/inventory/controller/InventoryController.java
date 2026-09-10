package com.wms.module.inventory.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.inventory.dto.request.ReserveStockRequest;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.service.InventoryLockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/inventory")
@RequiredArgsConstructor
@Tag(name = "4. Lõi Tồn Kho & Khóa Đồng Thời (Core Inventory)", description = "APIs tra cứu tồn thực tế và test Pessimistic Locking chống âm kho")
public class InventoryController {

    private final InventoryRepository inventoryRepository;
    private final InventoryLockService inventoryLockService;

    @GetMapping
    @Operation(summary = "Xem bảng cân đối tồn kho thực tế", description = "Trả về số lượng On-hand (vật lý), Reserved (đang giữ), Available (khả dụng)")
    public ApiResponse<List<Inventory>> getInventoryBalances() {
        List<Inventory> inventories = inventoryRepository.findAll();
        return ApiResponse.success("Lấy số dư tồn kho thành công!", inventories);
    }

    @PostMapping("/reserve")
    @Operation(summary = "Test giữ hàng với Khóa bi quan (Pessimistic Locking)",
               description = "Giữ hàng an toàn trong Database Transaction, chống Race Condition khi nhiều nhân viên cùng xuất 1 lúc")
    public ApiResponse<Map<String, Object>> reserveStock(@Valid @RequestBody ReserveStockRequest request) {
        log.info("API goi giu hang: ProductId={}, Loc={}, Batch={}, Qty={}", 
                request.getProductId(), request.getLocationId(), request.getBatchId(), request.getRequestedQty());

        inventoryLockService.reserveStock(
                request.getProductId(),
                request.getLocationId(),
                request.getBatchId(),
                request.getRequestedQty()
        );

        Inventory updated = inventoryRepository.findByProductIdAndLocationIdAndBatchId(
                request.getProductId(), request.getLocationId(), request.getBatchId()).orElseThrow();

        return ApiResponse.success("Khóa và giữ hàng thành công!", Map.of(
                "productId", request.getProductId(),
                "locationId", request.getLocationId(),
                "batchId", request.getBatchId(),
                "onHandQty", updated.getOnHandQty(),
                "reservedQty", updated.getReservedQty(),
                "availableQty", updated.getAvailableQty()
        ));
    }
}
