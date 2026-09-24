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
    private final com.wms.module.inventory.repository.StockLedgerRepository stockLedgerRepository;
    private final com.wms.module.inventory.repository.InventoryAuditRepository inventoryAuditRepository;
    private final com.wms.module.inventory.service.StockTransferService stockTransferService;

    @GetMapping
    @Operation(summary = "Xem bảng cân đối tồn kho thực tế", description = "Trả về số lượng On-hand (vật lý), Reserved (đang giữ), Available (khả dụng)")
    public ApiResponse<List<Inventory>> getInventoryBalances() {
        List<Inventory> inventories = inventoryRepository.findAll();
        return ApiResponse.success("Lấy số dư tồn kho thành công!", inventories);
    }

    @GetMapping("/ledger")
    @Operation(summary = "Lấy lịch sử sổ cái thẻ kho bất biến", description = "Trả về 50 biến động thẻ kho gần nhất (Nhập, Xuất, Điều chỉnh)")
    public ApiResponse<List<com.wms.module.inventory.entity.StockLedger>> getRecentStockLedger() {
        List<com.wms.module.inventory.entity.StockLedger> ledgers = stockLedgerRepository.findTop50ByOrderByCreatedAtDesc();
        return ApiResponse.success("Lấy sổ cái thẻ kho thành công!", ledgers);
    }

    @GetMapping("/audit")
    @Operation(summary = "Lấy danh sách các đợt kiểm kê kho", description = "Trả về toàn bộ các phiên kiểm kê mù định kỳ")
    public ApiResponse<List<com.wms.module.inventory.entity.InventoryAudit>> getAllAudits() {
        List<com.wms.module.inventory.entity.InventoryAudit> audits = inventoryAuditRepository.findAll();
        return ApiResponse.success("Lấy danh sách đợt kiểm kê thành công!", audits);
    }

    @PostMapping("/audit")
    @Operation(summary = "Khởi tạo đợt kiểm kê mù mới", description = "Tạo phiên kiểm kê mới cho kho hàng")
    public ApiResponse<com.wms.module.inventory.entity.InventoryAudit> createAudit(@RequestBody com.wms.module.inventory.entity.InventoryAudit audit) {
        if (audit.getAuditCode() == null || audit.getAuditCode().isBlank()) {
            audit.setAuditCode("AUD-" + System.currentTimeMillis() % 1000000);
        }
        if (audit.getCreatedBy() == null) {
            audit.setCreatedBy(1L);
        }
        if (audit.getWarehouseId() == null) {
            audit.setWarehouseId(1L);
        }
        audit.setStatus("IN_PROGRESS");
        audit.setCreatedAt(java.time.Instant.now());
        if (audit.getItems() != null) {
            for (com.wms.module.inventory.entity.InventoryAuditItem item : audit.getItems()) {
                item.setAudit(audit);
                item.setStatus("PENDING");
            }
        }
        com.wms.module.inventory.entity.InventoryAudit saved = inventoryAuditRepository.save(audit);
        return ApiResponse.success("Khởi tạo đợt kiểm kê thành công!", saved);
    }

    @PutMapping("/audit/{id}/reconcile")
    @Operation(summary = "Phê duyệt đối soát cân chỉnh kiểm kê", description = "Duyệt kết quả kiểm kê và chuyển trạng thái sang APPROVED")
    public ApiResponse<com.wms.module.inventory.entity.InventoryAudit> reconcileAudit(@PathVariable Long id) {
        com.wms.module.inventory.entity.InventoryAudit audit = inventoryAuditRepository.findById(id)
                .orElseThrow(() -> new com.wms.common.exception.BusinessException(com.wms.common.exception.ErrorCode.NOT_FOUND, "Không tìm thấy đợt kiểm kê: " + id));
        audit.setStatus("APPROVED");
        audit.setCompletedAt(java.time.Instant.now());
        if (audit.getItems() != null) {
            for (com.wms.module.inventory.entity.InventoryAuditItem item : audit.getItems()) {
                item.setStatus("ADJUSTED");
            }
        }
        com.wms.module.inventory.entity.InventoryAudit saved = inventoryAuditRepository.save(audit);
        return ApiResponse.success("Phê duyệt cân chỉnh kiểm kê thành công!", saved);
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

    @GetMapping("/transfers")
    @Operation(summary = "Lấy lịch sử điều chuyển nội bộ giữa các ô kệ", description = "Trả về danh sách các đợt chuyển hàng trong kho")
    public ApiResponse<List<com.wms.module.inventory.dto.response.StockTransferResponse>> getAllTransfers() {
        List<com.wms.module.inventory.dto.response.StockTransferResponse> transfers = stockTransferService.getAllTransfers();
        return ApiResponse.success("Lấy lịch sử điều chuyển thành công!", transfers);
    }

    @PostMapping("/transfers")
    @Operation(summary = "Thực hiện điều chuyển tồn kho giữa 2 ô kệ",
               description = "Trừ tồn ô nguồn, cộng tồn ô đích, khóa dòng dữ liệu chống race condition và tự động ghi 2 bút toán đối ứng vào sổ cái")
    public ApiResponse<com.wms.module.inventory.dto.response.StockTransferResponse> executeTransfer(
            @Valid @RequestBody com.wms.module.inventory.dto.request.CreateStockTransferRequest request) {
        com.wms.module.inventory.dto.response.StockTransferResponse response = stockTransferService.executeTransfer(request);
        return ApiResponse.success("Điều chuyển tồn kho thành công!", response);
    }
}

