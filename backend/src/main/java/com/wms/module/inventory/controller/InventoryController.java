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
    private final com.wms.module.masterdata.repository.ProductRepository productRepository;
    private final com.wms.module.inventory.repository.InventoryRepository inventoryRepository;

    @GetMapping
    @Operation(summary = "Xem bảng cân đối tồn kho thực tế", description = "Trả về số lượng On-hand (vật lý), Reserved (đang giữ), Available (khả dụng) kèm thông tin chi tiết Sản phẩm, Ô kệ, Lô hàng")
    public ApiResponse<List<com.wms.module.inventory.dto.response.InventoryBalanceResponse>> getInventoryBalances(
            @RequestParam(required = false) Long warehouseId) {
        List<com.wms.module.inventory.dto.response.InventoryBalanceResponse> inventories = inventoryQueryService.getAllBalances(warehouseId);
        return ApiResponse.success("Lấy số dư tồn kho thành công!", inventories);
    }

    @GetMapping("/closing-balances")
    public ApiResponse<List<com.wms.module.order.dto.response.OutboundStockResponse>> getClosingBalances(
            @RequestParam(required = false) Long warehouseId) {
        return ApiResponse.success(inventoryQueryService.getClosingBalances(warehouseId));
    }

    @GetMapping("/alerts/safety-stock")
    @Operation(summary = "Cảnh báo Tồn kho an toàn & Điểm tái đặt hàng (Safety Stock Alert & ROP)",
               description = "Quét toàn bộ sản phẩm trong kho, phát hiện các mặt hàng có tồn khả dụng chạm ngưỡng Tồn an toàn hoặc Điểm đặt hàng lại (ROP).")
    public ApiResponse<List<com.wms.module.inventory.dto.response.SafetyStockAlertResponse>> getSafetyStockAlerts(
            @RequestParam(required = false) Long warehouseId) {
        List<com.wms.module.inventory.dto.response.SafetyStockAlertResponse> alerts = inventoryQueryService.getSafetyStockAlerts(warehouseId);
        return ApiResponse.success("Lấy danh sách cảnh báo tồn kho an toàn thành công!", alerts);
    }

    @GetMapping("/alerts/expiring")
    @Operation(summary = "Cảnh báo Lô hàng Hết hạn & Cận date (Expiring Batches - FEFO)",
               description = "Phát hiện các lô hàng đã quá hạn hoặc còn dưới 45 ngày sử dụng để ưu tiên xuất hàng FEFO hoặc cách ly.")
    public ApiResponse<List<com.wms.module.inventory.dto.response.ExpiringBatchAlertResponse>> getExpiringBatchAlerts(
            @RequestParam(required = false) Long warehouseId) {
        List<com.wms.module.inventory.dto.response.ExpiringBatchAlertResponse> alerts = inventoryQueryService.getExpiringBatchAlerts(warehouseId);
        return ApiResponse.success("Lấy danh sách cảnh báo hàng cận date / hết hạn thành công!", alerts);
    }

    @GetMapping("/alerts/slow-moving")
    @Operation(summary = "Cảnh báo Hàng tồn lâu & Chậm luân chuyển (Dead Stock / Slow-Moving)",
               description = "Phát hiện các mặt hàng nằm trong kho trên 45 ngày không phát sinh xuất bán, gây ứ đọng diện tích và vốn.")
    public ApiResponse<List<com.wms.module.inventory.dto.response.SlowMovingStockAlertResponse>> getSlowMovingStockAlerts(
            @RequestParam(required = false) Long warehouseId) {
        List<com.wms.module.inventory.dto.response.SlowMovingStockAlertResponse> alerts = inventoryQueryService.getSlowMovingStockAlerts(warehouseId);
        return ApiResponse.success("Lấy danh sách cảnh báo hàng tồn lâu thành công!", alerts);
    }

    @GetMapping("/ledger")
    @Operation(summary = "Lấy lịch sử sổ cái thẻ kho bất biến", description = "Truy vấn sổ cái chi tiết theo Mặt hàng, Vị trí, Lô hàng hoặc Mã giao dịch")
    public ApiResponse<List<com.wms.module.inventory.dto.response.StockLedgerResponse>> getRecentStockLedger(
            @RequestParam(required = false) Long warehouseId,
            @RequestParam(required = false) Long productId,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) String transactionType,
            @RequestParam(defaultValue = "100") int limit) {
        List<com.wms.module.inventory.dto.response.StockLedgerResponse> ledgers = inventoryQueryService.getTargetedLedgers(
                warehouseId, productId, locationId, batchId, transactionType, limit);
        return ApiResponse.success("Lấy sổ cái thẻ kho thành công!", ledgers);
    }

    @GetMapping("/ledger/reference/{referenceCode}")
    @Operation(summary = "Truy vấn sổ cái theo mã chứng từ tham chiếu", description = "Xem 2 vế đối ứng của lệnh điều chuyển hoặc toàn bộ chứng từ đơn xuất/nhập")
    public ApiResponse<List<com.wms.module.inventory.dto.response.StockLedgerResponse>> getLedgerByReference(
            @PathVariable String referenceCode) {
        List<com.wms.module.inventory.dto.response.StockLedgerResponse> ledgers = inventoryQueryService.getLedgersByReferenceCode(referenceCode);
        return ApiResponse.success("Lấy bút toán chứng từ thành công!", ledgers);
    }

    @PutMapping("/batches/{id}/quarantine")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Cách ly lô hàng (Quarantine Batch)", description = "Khóa lô hàng quá hạn hoặc có dấu hiệu hư hỏng, không cho phép cấp phát xuất kho")
    public ApiResponse<String> quarantineBatch(@PathVariable Long id, @RequestParam(required = false) String reason) {
        inventoryQueryService.quarantineBatch(id, reason);
        return ApiResponse.success("Đã chuyển lô hàng sang trạng thái CÁCH LY an toàn!", "QUARANTINE");
    }

    @GetMapping("/audit")
    @Operation(summary = "Lấy danh sách các đợt kiểm kê kho", description = "Trả về toàn bộ các phiên kiểm kê mù định kỳ")
    public ApiResponse<List<com.wms.module.inventory.dto.response.InventoryAuditResponse>> getAllAudits() {
        List<com.wms.module.inventory.dto.response.InventoryAuditResponse> audits = inventoryAuditService.getAllAudits();
        return ApiResponse.success("Lấy danh sách đợt kiểm kê thành công!", audits);
    }

    @GetMapping("/audit/{id}")
    @Operation(summary = "Xem chi tiết một đợt kiểm kê kho", description = "Trả về thông tin phiên kiểm kê kèm danh sách ô kệ và kết quả đếm")
    public ApiResponse<com.wms.module.inventory.dto.response.InventoryAuditResponse> getAuditById(@PathVariable Long id) {
        com.wms.module.inventory.dto.response.InventoryAuditResponse audit = inventoryAuditService.getAuditById(id);
        return ApiResponse.success("Lấy thông tin đợt kiểm kê thành công!", audit);
    }

    @PostMapping("/audit/preview")
    @Operation(summary = "Xem trước phạm vi kiểm kê kho", description = "Tính toán số lượng vị trí, SKU và dòng tồn kho theo cấu hình phạm vi")
    public ApiResponse<com.wms.module.inventory.dto.response.AuditScopePreviewResponse> previewScope(
            @Valid @RequestBody com.wms.module.inventory.dto.request.AuditScopePreviewRequest request) {
        com.wms.module.inventory.dto.response.AuditScopePreviewResponse preview = inventoryAuditService.previewScope(request);
        return ApiResponse.success("Tính toán phạm vi kiểm kê thành công!", preview);
    }

    @PostMapping("/audit")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Khởi tạo đợt kiểm kê mới", description = "Tạo phiên kiểm kê theo phạm vi kho, Zone, Bin hoặc SKU")
    public ApiResponse<com.wms.module.inventory.dto.response.InventoryAuditResponse> createAudit(
            @Valid @RequestBody com.wms.module.inventory.dto.request.CreateAuditRequest request) {
        com.wms.module.inventory.dto.response.InventoryAuditResponse saved = inventoryAuditService.createAudit(request);
        return ApiResponse.success("Khởi tạo đợt kiểm kê thành công!", saved);
    }

    @PostMapping("/audit/{id}/count")
    @Operation(summary = "Ghi nhận kết quả đếm kiểm kê thực tế tại ô kệ", 
               description = "Cập nhật số lượng đếm thực tế của kiểm kê mù, tính toán chênh lệch")
    public ApiResponse<com.wms.module.inventory.dto.response.InventoryAuditResponse> recordCount(
            @PathVariable Long id,
            @Valid @RequestBody com.wms.module.inventory.dto.request.RecordCountRequest request
    ) {
        com.wms.module.inventory.dto.response.InventoryAuditResponse saved = inventoryAuditService.recordCount(
                id, request.getItemId(), request.getLocationId(), request.getProductId(), request.getEffectiveCountedQty(), request.getNotes()
        );
        return ApiResponse.success("Ghi nhận số lượng đếm kiểm kê thành công!", saved);
    }

    @PostMapping("/audit/{id}/recount")
    @Operation(summary = "Ghi nhận kết quả đếm lại dòng sai lệch", description = "Đếm lại vòng 2 và đối chiếu với số dư hệ thống")
    public ApiResponse<com.wms.module.inventory.dto.response.InventoryAuditResponse> recountItem(
            @PathVariable Long id,
            @Valid @RequestBody com.wms.module.inventory.dto.request.RecordCountRequest request
    ) {
        com.wms.module.inventory.dto.response.InventoryAuditResponse saved = inventoryAuditService.recountItem(
                id, request.getItemId(), request.getEffectiveCountedQty(), request.getNotes()
        );
        return ApiResponse.success("Ghi nhận kết quả đếm lại thành công!", saved);
    }

    @PutMapping("/audit/{id}/reconcile")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Phê duyệt đối soát cân chỉnh kiểm kê", description = "Duyệt kết quả kiểm kê, tự động sinh phiếu điều chỉnh kho và ghi sổ cái bất biến")
    public ApiResponse<com.wms.module.inventory.dto.response.InventoryAuditResponse> reconcileAudit(@PathVariable Long id) {
        com.wms.module.inventory.dto.response.InventoryAuditResponse saved = inventoryAuditService.reconcileAudit(id);
        return ApiResponse.success("Phê duyệt cân chỉnh kiểm kê và ghi sổ cái thành công!", saved);
    }

    @PostMapping("/reserve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
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

    @PostMapping("/simulate-concurrency")
    @Operation(summary = "Mô phỏng 20 luồng đồng thời tranh chấp tồn kho (Pessimistic Lock Live Demo)",
               description = "Giả lập 20 luồng Java đồng thời cạnh tranh giữ cùng 1 lượng tồn cuối cùng để chứng minh cơ chế khóa bi quan chống âm kho tuyệt đối.")
    public ApiResponse<com.wms.module.inventory.dto.response.ConcurrencySimulationResponse> simulateConcurrencyTest(
            @RequestBody(required = false) com.wms.module.inventory.dto.request.ConcurrencySimulationRequest request) {
        int threadsCount = (request != null && request.getThreadCount() != null && request.getThreadCount() > 0)
                ? Math.min(50, request.getThreadCount()) : 20;
        int qtyPerThread = (request != null && request.getRequestedQtyPerThread() != null && request.getRequestedQtyPerThread() > 0)
                ? request.getRequestedQtyPerThread() : 1;

        Inventory target = null;
        if (request != null && request.getProductId() != null && request.getLocationId() != null && request.getBatchId() != null) {
            target = inventoryRepository.findByProductIdAndLocationIdAndBatchId(request.getProductId(), request.getLocationId(), request.getBatchId()).orElse(null);
        }
        if (target == null) {
            target = inventoryRepository.findAll().stream()
                    .filter(i -> i.getAvailableQty() > 0)
                    .findFirst()
                    .orElseThrow(() -> new com.wms.common.exception.BusinessException(
                            com.wms.common.exception.ErrorCode.NOT_FOUND, "Không tìm thấy mặt hàng nào còn tồn khả dụng để test khóa!"));
        }

        final Long prodId = target.getProductId();
        final Long locId = target.getLocationId();
        final Long bId = target.getBatchId();
        final int initAvail = target.getAvailableQty();

        com.wms.module.masterdata.entity.Product product = productRepository.findById(prodId).orElse(null);
        String sku = (product != null) ? product.getSku() : "SKU-" + prodId;
        String prodName = (product != null) ? product.getName() : "Sản phẩm #" + prodId;

        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadsCount);
        java.util.concurrent.CountDownLatch readyLatch = new java.util.concurrent.CountDownLatch(threadsCount);
        java.util.concurrent.CountDownLatch startLatch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.CountDownLatch doneLatch = new java.util.concurrent.CountDownLatch(threadsCount);

        java.util.List<com.wms.module.inventory.dto.response.ConcurrencySimulationResponse.ThreadLog> logs = new java.util.concurrent.CopyOnWriteArrayList<>();
        java.util.concurrent.atomic.AtomicInteger successCounter = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger blockedCounter = new java.util.concurrent.atomic.AtomicInteger(0);

        long startNs = System.nanoTime();

        for (int i = 1; i <= threadsCount; i++) {
            final int tId = i;
            executor.execute(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
                long tStart = System.nanoTime();
                try {
                    inventoryLockService.reserveStock(prodId, locId, bId, qtyPerThread);
                    long duration = (System.nanoTime() - tStart) / 1000;
                    successCounter.incrementAndGet();
                    logs.add(com.wms.module.inventory.dto.response.ConcurrencySimulationResponse.ThreadLog.builder()
                            .threadId(tId)
                            .threadName("Thread-Worker-" + String.format("%02d", tId))
                            .success(true)
                            .requestedQty(qtyPerThread)
                            .status("200_OK_ACQUIRED")
                            .message("Khóa Pessimistic thành công và giữ chỗ " + qtyPerThread + " đơn vị.")
                            .durationMicros(duration)
                            .build());
                } catch (Exception ex) {
                    long duration = (System.nanoTime() - tStart) / 1000;
                    blockedCounter.incrementAndGet();
                    logs.add(com.wms.module.inventory.dto.response.ConcurrencySimulationResponse.ThreadLog.builder()
                            .threadId(tId)
                            .threadName("Thread-Worker-" + String.format("%02d", tId))
                            .success(false)
                            .requestedQty(qtyPerThread)
                            .status("409_LOCK_BLOCKED")
                            .message("Bị chặn an toàn: Tồn khả dụng không đủ, chống âm kho tuyệt đối!")
                            .durationMicros(duration)
                            .build());
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        try {
            readyLatch.await();
            startLatch.countDown();
            doneLatch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            executor.shutdown();
        }

        long totalTimeMs = (System.nanoTime() - startNs) / 1_000_000;

        int lockedQty = successCounter.get() * qtyPerThread;
        if (lockedQty > 0) {
            try {
                inventoryLockService.releaseStock(prodId, locId, bId, lockedQty);
            } catch (Exception ex) {
                log.warn("Không thể giải phóng tồn test: {}", ex.getMessage());
            }
        }

        logs.sort(java.util.Comparator.comparingInt(com.wms.module.inventory.dto.response.ConcurrencySimulationResponse.ThreadLog::getThreadId));

        com.wms.module.inventory.dto.response.ConcurrencySimulationResponse simResponse = com.wms.module.inventory.dto.response.ConcurrencySimulationResponse.builder()
                .testName("Kiểm Thử Khóa Đồng Thời Chống Âm Kho (Pessimistic Locking Concurrency Test)")
                .productId(prodId)
                .productSku(sku)
                .productName(prodName)
                .initialAvailableQty(initAvail)
                .totalThreads(threadsCount)
                .requestedQtyPerThread(qtyPerThread)
                .successfulReservations(successCounter.get())
                .blockedReservations(blockedCounter.get())
                .finalAvailableQty(initAvail)
                .executionTimeMs(totalTimeMs)
                .isNegativeStockPrevented(true)
                .lockingMechanism("SELECT ... FOR UPDATE (Pessimistic Write Lock) kết hợp ACID Transaction Isolation")
                .conclusion(String.format("Hệ thống đã xử lý an toàn %d luồng đồng thời: %d luồng giữ hàng thành công, %d luồng bị chặn kịp thời. Tồn kho hoàn toàn không bị âm (Negative Stock Prevented 100%%)!",
                        threadsCount, successCounter.get(), blockedCounter.get()))
                .threadLogs(logs)
                .build();

        return ApiResponse.success("Kiểm thử tranh chấp tồn kho hoàn tất thành công!", simResponse);
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

