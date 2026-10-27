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

    private final com.wms.module.inventory.service.InventoryQueryService inventoryQueryService;
    private final InventoryLockService inventoryLockService;
    private final com.wms.module.inventory.service.InventoryAuditService inventoryAuditService;
    private final com.wms.module.inventory.service.StockTransferService stockTransferService;

    @GetMapping
    @Operation(summary = "Xem bảng cân đối tồn kho thực tế", description = "Trả về số lượng On-hand (vật lý), Reserved (đang giữ), Available (khả dụng)")
    public ApiResponse<List<Inventory>> getInventoryBalances() {
        List<Inventory> inventories = inventoryQueryService.getAllBalances();
        return ApiResponse.success("Lấy số dư tồn kho thành công!", inventories);
    }

    @GetMapping("/ledger")
    @Operation(summary = "Lấy lịch sử sổ cái thẻ kho bất biến", description = "Trả về 50 biến động thẻ kho gần nhất (Nhập, Xuất, Điều chỉnh)")
    public ApiResponse<List<com.wms.module.inventory.entity.StockLedger>> getRecentStockLedger() {
        List<com.wms.module.inventory.entity.StockLedger> ledgers = inventoryQueryService.getRecentLedgers(50);
        return ApiResponse.success("Lấy sổ cái thẻ kho thành công!", ledgers);
    }

    @GetMapping("/audit")
    @Operation(summary = "Lấy danh sách các đợt kiểm kê kho", description = "Trả về toàn bộ các phiên kiểm kê mù định kỳ")
    public ApiResponse<List<com.wms.module.inventory.entity.InventoryAudit>> getAllAudits() {
        List<com.wms.module.inventory.entity.InventoryAudit> audits = inventoryAuditService.getAllAudits();
        return ApiResponse.success("Lấy danh sách đợt kiểm kê thành công!", audits);
    }

    @GetMapping("/audit/{id}")
    @Operation(summary = "Xem chi tiết một đợt kiểm kê kho", description = "Trả về thông tin phiên kiểm kê kèm danh sách ô kệ và kết quả đếm")
    public ApiResponse<com.wms.module.inventory.entity.InventoryAudit> getAuditById(@PathVariable Long id) {
        com.wms.module.inventory.entity.InventoryAudit audit = inventoryAuditService.getAuditById(id);
        return ApiResponse.success("Lấy thông tin đợt kiểm kê thành công!", audit);
    }

    @PostMapping("/audit")
    @Operation(summary = "Khởi tạo đợt kiểm kê mù mới", description = "Tạo phiên kiểm kê mới cho kho hàng")
    public ApiResponse<com.wms.module.inventory.entity.InventoryAudit> createAudit(@RequestBody com.wms.module.inventory.entity.InventoryAudit audit) {
        com.wms.module.inventory.entity.InventoryAudit saved = inventoryAuditService.createAudit(audit);
        return ApiResponse.success("Khởi tạo đợt kiểm kê thành công!", saved);
    }

    @PostMapping("/audit/{id}/count")
    @Operation(summary = "Ghi nhận kết quả đếm kiểm kê thực tế tại ô kệ", 
               description = "Cập nhật số lượng đếm thực tế của kiểm kê mù, tính toán chênh lệch")
    public ApiResponse<com.wms.module.inventory.entity.InventoryAudit> recordCount(
            @PathVariable Long id,
            @Valid @RequestBody com.wms.module.inventory.dto.request.RecordCountRequest request
    ) {
        com.wms.module.inventory.entity.InventoryAudit saved = inventoryAuditService.recordCount(
                id, request.getItemId(), request.getCountedQty(), request.getNotes()
        );
        return ApiResponse.success("Ghi nhận số lượng đếm kiểm kê thành công!", saved);
    }

    @PutMapping("/audit/{id}/reconcile")
    @Operation(summary = "Phê duyệt đối soát cân chỉnh kiểm kê", description = "Duyệt kết quả kiểm kê, tự động sinh phiếu điều chỉnh kho và ghi sổ cái bất biến")
    public ApiResponse<com.wms.module.inventory.entity.InventoryAudit> reconcileAudit(@PathVariable Long id) {
        com.wms.module.inventory.entity.InventoryAudit saved = inventoryAuditService.reconcileAudit(id);
        return ApiResponse.success("Phê duyệt cân chỉnh kiểm kê và ghi sổ cái thành công!", saved);
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

        Inventory updated = inventoryQueryService.getInventory(
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

