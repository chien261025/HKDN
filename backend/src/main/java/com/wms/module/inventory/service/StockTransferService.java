package com.wms.module.inventory.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.dto.request.CreateStockTransferRequest;
import com.wms.module.inventory.dto.response.StockTransferResponse;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.entity.StockLedger;
import com.wms.module.inventory.entity.StockTransfer;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.repository.StockLedgerRepository;
import com.wms.module.inventory.repository.StockTransferRepository;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockTransferService {

    private final StockTransferRepository stockTransferRepository;
    private final InventoryRepository inventoryRepository;
    private final StockLedgerRepository stockLedgerRepository;
    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;

    /**
     * Thực hiện điều chuyển tồn kho giữa 2 ô kệ với Khóa bi quan và ghi sổ cái bất biến
     */
    @Transactional
    public StockTransferResponse executeTransfer(CreateStockTransferRequest request) {
        log.info("Yeu cau dieu chuyen ton kho: Product={}, FromLoc={}, ToLoc={}, Batch={}, Qty={}",
                request.getProductId(), request.getFromLocationId(), request.getToLocationId(),
                request.getBatchId(), request.getQuantity());

        // 1. Kiểm tra logic ô nguồn và ô đích
        if (request.getFromLocationId().equals(request.getToLocationId())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Ô đích phải khác ô nguồn!");
        }

        Location fromLoc = locationRepository.findById(request.getFromLocationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ nguồn: " + request.getFromLocationId()));

        Location toLoc = locationRepository.findById(request.getToLocationId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ đích: " + request.getToLocationId()));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm: " + request.getProductId()));

        ProductBatch batch = productBatchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy lô hàng: " + request.getBatchId()));

        // 2. Khóa dòng dữ liệu tồn kho tại ô nguồn (Pessimistic Lock - SELECT FOR UPDATE)
        Inventory sourceInv = inventoryRepository.findByProductLocationAndBatchForUpdate(
                request.getProductId(), request.getFromLocationId(), request.getBatchId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND,
                        String.format("Không tìm thấy hàng tại ô nguồn %s cho sản phẩm %s (Lô %s)",
                                fromLoc.getBinBarcode(), product.getSku(), batch.getBatchNumber())));

        // 3. Kiểm tra số lượng khả dụng
        if (sourceInv.getAvailableQty() < request.getQuantity()) {
            log.warn("Khong du ton kha dung de dieu chuyen: Co={}, Yeu cau={}", sourceInv.getAvailableQty(), request.getQuantity());
            throw new BusinessException(ErrorCode.INSUFFICIENT_STOCK,
                    String.format("Không đủ hàng khả dụng tại ô nguồn! Khả dụng: %d, Yêu cầu chuyển: %d",
                            sourceInv.getAvailableQty(), request.getQuantity()));
        }

        // 4. Trừ tồn kho tại ô nguồn
        sourceInv.setOnHandQty(sourceInv.getOnHandQty() - request.getQuantity());
        inventoryRepository.save(sourceInv);

        // 5. Cộng tồn kho tại ô đích (tìm hoặc tạo mới record tồn kho)
        Inventory targetInv = inventoryRepository.findByProductIdAndLocationIdAndBatchId(
                request.getProductId(), request.getToLocationId(), request.getBatchId())
                .orElse(null);

        Long warehouseId = fromLoc.getWarehouseId() != null ? fromLoc.getWarehouseId() : 1L;

        if (targetInv == null) {
            targetInv = Inventory.builder()
                    .locationId(request.getToLocationId())
                    .productId(request.getProductId())
                    .batchId(request.getBatchId())
                    .onHandQty(request.getQuantity())
                    .reservedQty(0)
                    .build();
        } else {
            targetInv.setOnHandQty(targetInv.getOnHandQty() + request.getQuantity());
        }
        inventoryRepository.save(targetInv);

        // BẮT BUỘC: Ép Hibernate flush các câu lệnh UPDATE/INSERT wms_inventory xuống CSDL ngay lập tức!
        // Tránh lỗi trigger CSDL trg_validate_stock_ledger_balance đối soát lệch số dư do Hibernate hoãn flush
        inventoryRepository.flush();

        // 6. Tạo mã phiếu và lưu bản ghi StockTransfer
        String transferCode = "TRF-" + (System.currentTimeMillis() % 1000000);
        String notes = request.getNotes() != null && !request.getNotes().isBlank()
                ? request.getNotes()
                : String.format("Điều chuyển từ ô %s sang ô %s", fromLoc.getBinBarcode(), toLoc.getBinBarcode());

        Instant now = Instant.now();
        StockTransfer transfer = StockTransfer.builder()
                .transferCode(transferCode)
                .warehouseId(warehouseId)
                .fromLocationId(request.getFromLocationId())
                .toLocationId(request.getToLocationId())
                .productId(request.getProductId())
                .batchId(request.getBatchId())
                .quantity(request.getQuantity())
                .status("COMPLETED")
                .createdBy(1L)
                .completedBy(1L)
                .notes(notes)
                .createdAt(now)
                .completedAt(now)
                .build();
        StockTransfer savedTransfer = stockTransferRepository.save(transfer);

        // 7. Ghi 2 bút toán đối ứng vào Sổ cái thẻ kho bất biến (wms_stock_ledger)
        // Bút toán 1: Xuất khỏi ô nguồn
        StockLedger outLedger = StockLedger.builder()
                .transactionType("TRANSFER")
                .referenceCode(transferCode)
                .locationId(request.getFromLocationId())
                .productId(request.getProductId())
                .batchId(request.getBatchId())
                .qtyChange(-request.getQuantity())
                .balanceAfter(sourceInv.getOnHandQty())
                .performedBy(1L)
                .notes("Xuất điều chuyển sang ô " + toLoc.getBinBarcode())
                .createdAt(now)
                .build();
        stockLedgerRepository.save(outLedger);

        // Bút toán 2: Nhập vào ô đích
        StockLedger inLedger = StockLedger.builder()
                .transactionType("TRANSFER")
                .referenceCode(transferCode)
                .locationId(request.getToLocationId())
                .productId(request.getProductId())
                .batchId(request.getBatchId())
                .qtyChange(request.getQuantity())
                .balanceAfter(targetInv.getOnHandQty())
                .performedBy(1L)
                .notes("Nhập nhận điều chuyển từ ô " + fromLoc.getBinBarcode())
                .createdAt(now)
                .build();
        stockLedgerRepository.save(inLedger);

        log.info("Dieu chuyen ton kho thanh cong! Ma phieu: {}", transferCode);

        return mapToResponse(savedTransfer, fromLoc.getBinBarcode(), toLoc.getBinBarcode(),
                product.getSku(), product.getName(), batch.getBatchNumber());
    }

    /**
     * Lấy toàn bộ lịch sử các đợt điều chuyển trong kho
     */
    @Transactional(readOnly = true)
    public List<StockTransferResponse> getAllTransfers() {
        List<StockTransfer> transfers = stockTransferRepository.findAllByOrderByCreatedAtDesc();

        return transfers.stream().map(t -> {
            String fromBarcode = locationRepository.findById(t.getFromLocationId())
                    .map(Location::getBinBarcode).orElse("LOC-" + t.getFromLocationId());
            String toBarcode = locationRepository.findById(t.getToLocationId())
                    .map(Location::getBinBarcode).orElse("LOC-" + t.getToLocationId());
            String sku = productRepository.findById(t.getProductId())
                    .map(Product::getSku).orElse("SKU-" + t.getProductId());
            String name = productRepository.findById(t.getProductId())
                    .map(Product::getName).orElse("Sản phẩm #" + t.getProductId());
            String batchNum = productBatchRepository.findById(t.getBatchId())
                    .map(ProductBatch::getBatchNumber).orElse("BATCH-" + t.getBatchId());

            return mapToResponse(t, fromBarcode, toBarcode, sku, name, batchNum);
        }).collect(Collectors.toList());
    }

    private StockTransferResponse mapToResponse(StockTransfer t, String fromBarcode, String toBarcode,
                                                String sku, String name, String batchNumber) {
        return StockTransferResponse.builder()
                .id(t.getId())
                .transferCode(t.getTransferCode())
                .fromLocationId(t.getFromLocationId())
                .fromLocationBarcode(fromBarcode)
                .toLocationId(t.getToLocationId())
                .toLocationBarcode(toBarcode)
                .productId(t.getProductId())
                .productSku(sku)
                .productName(name)
                .batchId(t.getBatchId())
                .batchNumber(batchNumber)
                .quantity(t.getQuantity())
                .status(t.getStatus())
                .notes(t.getNotes())
                .createdAt(t.getCreatedAt())
                .completedAt(t.getCompletedAt())
                .build();
    }
}
